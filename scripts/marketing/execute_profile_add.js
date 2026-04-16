/**
 * Level 4: Execution Module - Profile Friends Scanner
 * Mở danh sách bạn bè của 1 người cụ thể và tự động kết bạn
 */

const { launchBrowser } = require('./setup_browser');
const { logAction, saveLead } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeProfileAdd(rawCommand) {
    console.log(`[EXEC] Received Command (Profile URL or Config): "${rawCommand}"`);

    // Phân tích đầu vào (JSON hoặc Chuỗi thẳng)
    let targetUrl = rawCommand.trim();
    let maxAdds = 15;
    let botAction = 'auto_add';
    let botSpeed = 'normal';

    try {
        if (targetUrl.startsWith('{')) {
            const config = JSON.parse(targetUrl);
            targetUrl = config.url.trim();
            if (config.limit) maxAdds = config.limit;
            if (config.action) botAction = config.action;
            if (config.speed) botSpeed = config.speed;
            console.log(`[EXEC] ⚙️ Khởi động Chế độ Nâng Cao: Giới hạn=${maxAdds}, Hành động=${botAction}, Tốc độ=${botSpeed}`);
        }
    } catch (e) {
        console.log(`[EXEC] Sử dụng cấu hình Mặc Định.`);
    }

    if (!targetUrl.startsWith('http')) {
        if (targetUrl.includes('facebook.com')) {
            targetUrl = 'https://' + targetUrl;
        } else {
            targetUrl = 'https://www.facebook.com/' + targetUrl;
        }
    }

    if (!targetUrl.includes('sk=friends') && !/\/friends\/?$/.test(targetUrl)) {
        if (targetUrl.includes('profile.php?id=')) {
            targetUrl += '&sk=friends';
        } else {
            if (!targetUrl.endsWith('/')) targetUrl += '/';
            targetUrl += 'friends';
        }
    }

    console.log(`[EXEC] Auto-formated Target URL: ${targetUrl}`);
    await logAction('search', 'info', `🚀 Đột nhập danh sách bạn bè của: ${targetUrl.split('facebook.com/')[1] || 'Profile'}`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    let addedCount = 0;
    try {
        console.log(`[EXEC] Navigating to: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        await sleep(4000);

        const isPageAvailable = await page.evaluate(() => {
            return !document.body.innerText.includes("This content isn't available right now") &&
                   !document.body.innerText.includes("Nội dung này hiện không khả dụng");
        });

        if (!isPageAvailable) {
            console.log(`[EXEC] Trang bị lỗi hoặc Không khả dụng.`);
            await logAction('search', 'warning', `Profile bị khoá hoặc FB chặn hiển thị.`);
            return;
        }

        console.log(`[EXEC] Scrolling để kích mồi hiển thị danh sách...`);
        // Cuộn nhiều hơn tí để bù trường hợp số lượng vượt 15
        const scrollTimes = Math.max(4, Math.ceil(maxAdds / 5));
        for (let i = 0; i < scrollTimes; i++) {
            await page.evaluate(() => window.scrollBy(0, 800));
            await sleep(2000);
        }

        const buttonHandles = await page.$$('div[role="button"]');
        
        console.log(`[EXEC] Quét ${buttonHandles.length} phần tử rác kiếm nút "Thêm bạn bè"...`);

        for (const btnHandle of buttonHandles) {
            if (addedCount >= maxAdds) break;

            const text = await page.evaluate(el => el.innerText || el.getAttribute('aria-label') || "", btnHandle);

            if (text.includes('Add friend') || text.includes('Thêm bạn bè')) {

                const profileData = await page.evaluate(btn => {
                    let url = 'Unknown';
                    let name = 'Facebook User';
                    
                    const btnAria = btn.getAttribute('aria-label') || '';
                    const nameMatch = btnAria.match(/(?:Thêm|Add) (.+?) (?:làm bạn bè|as a friend)/i);
                    if (nameMatch && nameMatch[1]) {
                        name = nameMatch[1].trim();
                    }
                    
                    let container = btn.parentElement;
                    let safeGuard = 0;
                    
                    while (container && safeGuard < 12) {
                        const links = container.querySelectorAll('a');
                        
                        // Pass 1: Grab the URL from any valid link
                        if (url === 'Unknown') {
                            for (const link of links) {
                                if (link.href && !link.href.includes('/friends/') && !link.href.includes('search') && link.href.includes('facebook.com')) {
                                    url = link.href.split('?')[0];
                                    break;
                                }
                            }
                        }

                        // Pass 2: Grab the Name from any valid link that actually has Text (e.g. the Name instead of the Avatar image)
                        if (name === 'Facebook User') {
                            for (const link of links) {
                                if (link.innerText && link.innerText.trim().length > 1) {
                                    // Make sure it's not some random 'Add friend' text link, though FB rarely uses A tags for buttons
                                    if (!link.innerText.includes('friend') && !link.innerText.includes('bạn bè')) {
                                        name = link.innerText.trim().split('\n')[0]; // Sometimes FB packs subtext inside the same a tag
                                        break;
                                    }
                                }
                            }
                        }

                        if (url !== 'Unknown' && name !== 'Facebook User') break;
                        container = container.parentElement;
                        safeGuard++;
                    }
                    
                    return { url, name };
                }, btnHandle);

                if (profileData.url !== 'Unknown') {
                    console.log(`[EXEC] 🎯 Đã khóa rà mục tiêu: ${profileData.name} | ${profileData.url}`);

                    try {
                        addedCount++;

                        if (botAction === 'scrape_only') {
                            // Chế độ Bắn Tỉa Thủ Công (Chỉ quét Data về)
                            await saveLead({
                                source: `fb_profile_friends`,
                                name: profileData.name,
                                profile_url: profileData.url
                            });
                            // Cho trạng thái ở UI báo là Scraped / Pending Action
                            console.log(`[EXEC] 🕵️ Đã Vơ vét (Không Click): ${profileData.name}`);
                        } else {
                            // Chế độ Tự Động Kết Bạn: Đổi sang Click thật (Human-like)
                            try {
                                await btnHandle.scrollIntoView();
                                await sleep(500 + Math.random() * 500); 
                                // Di chuột vào nút ngẫu nhiên như người thật
                                await btnHandle.hover();
                                await sleep(200 + Math.random() * 400);
                                // Click thật bằng chuột của Puppeteer với độ trễ tay
                                await btnHandle.click({ delay: 50 + Math.random() * 100 });
                            } catch (clickErr) {
                                console.log(`[EXEC] Lỗi Click thật, xài Fallback JS Click: ${clickErr.message}`);
                                await page.evaluate(el => el.click(), btnHandle);
                            }

                            // Chờ xíu để xem FB có ném Popup lỗi không
                            await sleep(2500);
                            
                            // Kiểm tra Popup Trừng phạt của FB (Hạn chế tính năng)
                            const isRestricted = await page.evaluate(() => {
                                const bodyText = document.body.innerText || "";
                                return bodyText.includes('Bạn đã bị hạn chế') || 
                                       bodyText.includes('temporarily restricted') || 
                                       bodyText.includes('You can\'t use this feature right now') ||
                                       bodyText.includes('Tính năng này hiện không khả dụng');
                            });
                            
                            if (isRestricted) {
                                console.log(`[EXEC] 🛑 PHÁT HIỆN FACEBOOK BÁO HẠN CHẾ TÍNH NĂNG! Kích hoạt quy trình Rút Quân khẩn cấp...`);
                                await logAction('search', 'error', `Tài khoản đã bị Facebook khoá tính năng/Hạn chế. Đã Dừng Auto ngay lập tức để bảo vệ tài khoản!`);
                                // Bắn return thoát hẳn kịch bản
                                return;
                            }

                            await logAction('search', 'success', `[Tự động] Đã gửi lời mời: ${profileData.name}`, {
                                profile_url: profileData.url
                            });

                            await saveLead({
                                source: `fb_profile_friends`,
                                name: profileData.name,
                                profile_url: profileData.url
                            });
                            console.log(`[EXEC] 🎯 Đã Click Add Friend: ${profileData.name}`);

                            // Phân bổ thời gian (Speed Control)
                            if (botSpeed === 'fast') {
                                await sleep(3000 + Math.random() * 2000); // 3-5s siêu tốc
                            } else if (botSpeed === 'slow') {
                                const safeWait = 35000 + Math.random() * 20000;
                                console.log(`[EXEC] ⏳ Tốc độ CỰC Rùa: Đứng chờ ${Math.round(safeWait/1000)}s...`);
                                await sleep(safeWait);
                            } else {
                                // Mặc định: Coffee Break chống Spam sau mỗi 3 cú Add
                                if (addedCount % 3 === 0) {
                                    const longWait = 45000 + Math.random() * 30000; 
                                    console.log(`[EXEC] ☕ Đã cướp ${addedCount} người. Tạm nghỉ giải lao ${Math.round(longWait/1000)}s chống Spam...`);
                                    await sleep(longWait);
                                } else {
                                    const shortWait = 15000 + Math.random() * 10000; 
                                    console.log(`[EXEC] ⏳ Chờ ${Math.round(shortWait/1000)}s ngụy trang hành vi người dùng...`);
                                    await sleep(shortWait);
                                }
                            }
                        }
                    } catch (e) {
                        console.log(`[EXEC] ❌ Lỗi khi Xử lý 1 Target: ${e.message}`);
                    }
                }
            }
        }

        if (addedCount === 0) {
            console.log(`[EXEC] Không mót được ai. Có thể Facebook của họ thiết lập ẩn bạn bè.`);
            await logAction('search', 'warning', `Danh sách bạn bè bị khóa hoặc không tìm thấy mục tiêu.`);
        } else {
            if (botAction === 'scrape_only') {
                await logAction('search', 'info', `[Thành công] Đã Vơ Vét ${addedCount} người về Kho Leads.`);
            }
        }

    } catch (e) {
        console.error(`[EXEC] Lỗi Chí tử: ${e.message}`);
        await logAction('search', 'error', `Lỗi: ${e.message}`);
    } finally {
        console.log(`[EXEC] Hoàn thành đi săn. Đóng trình duyệt...`);
        await sleep(3000); 
        await browser.close();
    }
}


// CLI usage
if (require.main === module) {
    const cmd = process.argv[2] || "https://www.facebook.com/zuck";
    executeProfileAdd(cmd);
}

module.exports = { executeProfileAdd };
