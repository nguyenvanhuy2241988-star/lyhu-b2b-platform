/**
 * Level 5: Group Intelligence (Dual-Mode)
 * 1. Mở Facebook và Tham gia vào Nhóm (Nếu có URL List)
 * 2. Lùng sục Nhóm mới trên Search (Nếu chỉ có Keyword)
 */

const { launchBrowser, delay, rdn } = require('./setup_browser');
const { logAction, supabase } = require('./supabase_logger');

async function answerGroupQuestions(page) {
    // Nếu có popup xuất hiện, tìm các form hỏi đáp và điền "Đồng ý"
    const hasDialog = await page.$('div[role="dialog"]');
    if (hasDialog) {
        console.log(`[GROUP] Phát hiện Form câu hỏi kiểm duyệt. Bắt đầu trả lời tự động...`);
        
        // Tìm các ô nhập liệu dạng textarea hoặc text input
        const textboxes = await page.$$('div[role="dialog"] textarea, div[role="dialog"] input[type="text"], div[role="dialog"] div[role="textbox"][contenteditable="true"]');
        for (const box of textboxes) {
            try {
                await box.scrollIntoView({ block: 'center' });
                await delay(500);
                await box.click();
                await page.keyboard.press('Space');
                await page.keyboard.press('Backspace');
                await delay(200);
                await page.keyboard.type("Đồng ý", { delay: 50 });
                await delay(500);
            } catch (e) {}
        }
        
        // Tìm các checkbox rule
        const checkboxes = await page.$$('div[role="dialog"] div[role="checkbox"]');
        for (const chk of checkboxes) {
            try {
                const isChecked = await page.evaluate(el => el.getAttribute('aria-checked') === 'true', chk);
                if (!isChecked) {
                    await chk.scrollIntoView({ block: 'center' });
                    await delay(300);
                    await chk.click();
                    await delay(500);
                }
            } catch(e) {}
        }
        
        // Tìm và nhấn Gửi (Submit)
        const buttons = await page.$$('div[role="dialog"] div[role="button"]');
        for (const btn of buttons) {
            const txt = await page.evaluate(el => el.innerText, btn);
            if (txt && (txt.toLowerCase().includes('gửi') || txt.toLowerCase().includes('xong') || txt.toLowerCase().includes('tham gia') || txt.toLowerCase().includes('submit'))) {
                try {
                    await btn.scrollIntoView({ block: 'center' });
                    await btn.click();
                    console.log(`[GROUP] Đã Submit Form tham gia!`);
                    await delay(2000);
                    break;
                } catch(e) {}
            }
        }
    }
}

async function executeGroupSearch() {
    let browser = null;
    try {
        const rawArg = process.argv.slice(2).find(a => !a.startsWith('--')) || "";
        
        // Parsing Dual-mode:
        let mode = 'keyword';
        let targetLinks = [];
        let keyword = rawArg;
        let targetGroupType = 'sales';
        let limit = 5;
        let internalDelay = 10;
        
        if (rawArg.includes('http')) {
            mode = 'crm';
            const parts = rawArg.split('|');
            targetLinks = parts[0].split(',').map(l => l.trim()).filter(Boolean);
            if (parts[2]) limit = parseInt(parts[2].trim()) || 5;
            if (parts[3]) internalDelay = parseInt(parts[3].trim()) || 10;
        } else if (rawArg.includes('|')) {
            const parts = rawArg.split('|');
            keyword = parts[0].trim() || "Chợ sỉ kinh doanh";
            targetGroupType = parts[1]?.trim() || "sales"; // Extract targetGroupType
            if (parts[2]) limit = parseInt(parts[2].trim()) || 5;
            if (parts[3]) internalDelay = parseInt(parts[3].trim()) || 10;
        }

        console.log(`[GROUP] 🚀 KHỞI ĐỘNG CHẾ ĐỘ QUÉT: ${mode === 'crm' ? 'VÀO THEO LINK CRM' : 'LÙNG SỤC TỪ KHÓA'}`);
        await logAction('search', 'info', `🚀 Khởi động Tham gia Nhóm. Chế độ: ${mode.toUpperCase().slice(0, 3)} (${Math.max(limit, targetLinks.length)} nhóm)`);

        browser = await launchBrowser();
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        let joinedCount = 0;

        if (mode === 'crm') {
            // ==================== CHẾ ĐỘ 1: CRM MODE ====================
            console.log(`[GROUP] Kế hoạch: Xin gia nhập ${targetLinks.length} nhóm từ danh sách CRM...`);
            
            for (const link of targetLinks) {
                if (joinedCount >= limit) {
                    console.log(`[GROUP] 🛑 Đã đạt chỉ tiêu ${limit} nhóm nghỉ ngơi theo cài đặt. Dừng lại an toàn.`);
                    break;
                }
                
                console.log(`[GROUP] >>> Điều hướng tới Nhóm: ${link}`);
                await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await delay(rdn(6000, 10000));
                
                // Mở rộng tìm kiếm nút
                const joinBtn = await page.evaluateHandle(() => {
                    const btns = Array.from(document.querySelectorAll('div[role="button"]'));
                    return btns.find(b => {
                        const txt = (b.innerText || '').trim();
                        // Tránh "Đã tham gia" / "Joined"
                        return (txt === 'Tham gia nhóm' || txt === 'Join group' || txt === 'Tham gia' || txt === 'Join') && !txt.includes('Đã');
                    });
                });
                
                if (joinBtn && await joinBtn.asElement()) {
                    console.log(`[GROUP] 🖱️ Phát hiện nút "Tham gia nhóm". Tiến hành bấm...`);
                    try {
                        // Di chuyển chuột tới và Cố gắng click vật lý
                        const el = await joinBtn.asElement();
                        await el.scrollIntoView({ block: 'center' });
                        await delay(500);
                        await el.click();
                    } catch (err) {
                        // Nếu bị lỗi "not clickable" do bị Banner của FB đè lên, dùng JS Click cưỡng bức
                        console.log(`[GROUP] ⚠ Nút bị che mờ, kích hoạt Click Cưỡng bức (JS)...`);
                        await page.evaluate(btn => btn.click(), await joinBtn.asElement());
                    }
                    await delay(rdn(4000, 6000));
                    
                    // Khắc phục câu hỏi Form
                    await answerGroupQuestions(page);
                    
                    console.log(`[GROUP] ✅ Đã ấn Tham gia thành công / Đã gửi yêu cầu!`);
                    await logAction('search', 'success', `Đã xin tham gia nhánh: ${link.split('/').pop()?.slice(0,10)}...`);
                    joinedCount++;
                    
                    // Trạm nghỉ ngơi chống Spam
                    if (joinedCount < limit) {
                        if (joinedCount % 3 === 0) {
                            const longWait = rdn(45000, 75000); // 45-75s break
                            console.log(`[GROUP] ☕ Đã join 3 nhóm liên tục. Giải lao ${Math.round(longWait/1000)}s để qua mặt bộ lọc Spam...`);
                            await delay(longWait);
                        } else {
                            // Tăng delay ngẫu nhiên lên cao hơn chút
                            const waitTime = rdn(internalDelay * 1000, (internalDelay + 15) * 1000);
                            console.log(`[GROUP] ⏳ Giãn cách an toàn ${Math.round(waitTime/1000)}s trước khi xin tiếp...`);
                            await delay(waitTime);
                        }
                    }
                } else {
                    console.log(`[GROUP] ❌ Bỏ qua: Không tìm thấy nút Xin Tham Gia (Hoặc đã Join từ trước).`);
                    await logAction('search', 'info', `Bỏ qua 1 nhóm (Đã tham gia hoặc lỗi hiển thị).`);
                }
            }
        } else {
            // ==================== CHẾ ĐỘ 2: LÙNG SỤC TỪ KHÓA ====================
            if (!keyword) keyword = "Chợ kinh doanh mua bán sỉ";
            console.log(`[GROUP] Lùng sục Từ khóa: "${keyword}" - Chỉ tiêu: ${limit} nhóm mới toanh.`);
            
            const searchUrl = `https://www.facebook.com/search/groups/?q=${encodeURIComponent(keyword)}`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await delay(rdn(6000, 9000));

            // Cuộn trang để lấy thêm thẻ Nhóm
            console.log(`[GROUP] Cuộn trang thu thập Nhóm...`);
            for(let i=0; i<3; i++) {
                await page.evaluate(() => window.scrollBy(0, window.innerHeight));
                await delay(2000);
            }

            const joinButtons = await page.$$('div[role="button"]');
            
            for (const btn of joinButtons) {
                if (joinedCount >= limit) {
                     console.log(`[GROUP] 🛑 Đã đạt mốc an toàn ${limit} nhóm. Tự động thu quân chờ mẻ sau.`);
                     break;
                }

                const txt = await page.evaluate(el => el.innerText, btn);
                // Lọc những thẻ có nút Tham gia (chưa là member)
                if (txt && (txt === 'Tham gia' || txt === 'Join' || txt === 'Tham gia nhóm' || txt === 'Join group')) {
                    try {
                        console.log(`[GROUP] 🖱️ Chộp được 1 Hội Nhóm tiềm năng...`);
                        
                        // Bước 1: Trích xuất Tên và Link nhóm bằng thuật toán leo cây DOM
                        const groupMeta = await page.evaluate((elBtn) => {
                            let curr = elBtn;
                            let linkEl = null;
                            // Leo lên tối đa 12 bậc (các lớp áo của FB rất dày)
                            for (let i = 0; i < 12; i++) {
                                if (!curr) break;
                                // Tìm tất cả các thẻ <a> bên trong scope hiện tại
                                const links = Array.from(curr.querySelectorAll('a[href*="/groups/"]'));
                                // Lọc lấy Link chứa Tên Nhóm (Thường có text dài hơn 3 ký tự)
                                linkEl = links.find(a => a.innerText && a.innerText.trim().length > 3);
                                if (linkEl) break;
                                curr = curr.parentElement;
                            }
                            
                            if (!linkEl) return null;
                            
                            // Lọc lấy URL sạch: https://www.facebook.com/groups/12345/
                            const cleanUrl = linkEl.href.split('?')[0];
                            const name = linkEl.innerText.trim();
                            
                            return { url: cleanUrl, name: name };
                        }, btn);

                        if (!groupMeta || !groupMeta.url) {
                            console.log(`[GROUP] ⚠ Không thể bóc tách Tên/Link nhóm này vì cấu trúc dị biệt. Vẫn tiến hành tham gia mù...`);
                        } else {
                            console.log(`[GROUP] 🏷️ Đã quét được Data: ${groupMeta.name} | ${groupMeta.url}`);
                        }

                        // Bước 2: Chống trùng (Check Database)
                        let skipJoin = false;
                        if (groupMeta && groupMeta.url && supabase) {
                            try {
                                const { data: existingGroup } = await supabase
                                    .from('telesales_fb_groups')
                                    .select('id')
                                    .eq('link', groupMeta.url)
                                    .single();
                                
                                if (existingGroup) {
                                    console.log(`[GROUP] ℹ️ Bỏ qua Group: ${groupMeta.name} (Đã có sẵn trên CRM)`);
                                    skipJoin = true;
                                }
                            } catch (e) { } // Ignore read error, proceed anyway
                        }
                        
                        if (skipJoin) continue; // Bỏ qua nhóm trùng, không tăng biến đếm, chạy tiếp vòng lặp

                        console.log(`[GROUP] 🖱️ Bắt đầu xin tham gia: ${groupMeta?.name || 'Nhóm mới'}...`);
                        await btn.scrollIntoView({ block: 'center' });
                        await delay(1000);
                        try {
                            await btn.click();
                        } catch (err) {
                            console.log(`[GROUP] ⚠ Nút bị che mờ, kích hoạt Click Cưỡng bức (JS)...`);
                            await page.evaluate(el => el.click(), btn);
                        }
                        await delay(rdn(4000, 6000));
                        
                        await answerGroupQuestions(page);

                        console.log(`[GROUP] ✅ Đã xin tham gia: ${groupMeta?.name || keyword}!`);
                        await logAction('search', 'success', `Đã xin tham gia Nhóm: ${groupMeta?.name || 'Nhóm ẩn danh'} `);
                        
                        // Bước 3: Đẩy thẳng lên CRM nếu trích xuất thành công
                        if (groupMeta && groupMeta.url && supabase) {
                            console.log(`[GROUP] ☁️ Đang đồng bộ Nhóm lên kho CRM (${targetGroupType.toUpperCase()}) ...`);
                            // Bỏ 'www' hoặc domain locale để quy chuẩn (Tùy chọn)
                            const { error } = await supabase.from('telesales_fb_groups').insert({
                                name: groupMeta.name,
                                link: groupMeta.url,
                                platform: 'facebook_group',
                                category: targetGroupType === 'job' ? 'general_job' : 'other',
                                status: 'active',
                                group_type: targetGroupType,
                                notes: `Auto Mined (Keyword: ${keyword})`
                            });
                            
                            if (error) {
                                console.log(`[GROUP] ❌ Lưu CRM lỗi: ${error.message}`);
                            } else {
                                console.log(`[GROUP] ☁️ Đồng bộ CRM Thành công!`);
                            }
                        }

                        joinedCount++;
                        // Trạm nghỉ ngơi chống Spam
                        if (joinedCount < limit) {
                            if (joinedCount % 3 === 0) {
                                const longWait = rdn(45000, 75000); // 45-75s break
                                console.log(`[GROUP] ☕ Đã join 3 nhóm liên tục. Giải lao ${Math.round(longWait/1000)}s để qua mặt bộ lọc Spam...`);
                                await delay(longWait);
                            } else {
                                // Tăng delay ngẫu nhiên lên cao hơn chút
                                const waitTime = rdn(internalDelay * 1000, (internalDelay + 15) * 1000);
                                console.log(`[GROUP] ⏳ Giãn cách an toàn ${Math.round(waitTime/1000)}s trước khi xin tiếp...`);
                                await delay(waitTime);
                            }
                        }
                    } catch (e) {
                         console.log(`[GROUP] ⚠ Group này bị lỗi giao diện, Skip.`);
                    }
                }
            }
        }
        
        console.log(`[GROUP] 🎉 HOÀN TẤT CHIẾN DỊCH KHAI HOANG! Mở rộng được: ${joinedCount} vùng đất mới!`);
        await logAction('search', 'success', `🏁 KẾT THÚC QUÉT NHÓM. Thu thập thành công: ${joinedCount} nhóm.`);

    } catch (e) {
        console.error("[GROUP LOGIC ERROR]", e);
        await logAction('search', 'error', `Lỗi Tới hạn Quét Nhóm: ${e.message}`);
    } finally {
        if (browser) await browser.close();
        process.exit(0);
    }
}

if (require.main === module) {
    executeGroupSearch();
}

module.exports = { executeGroupSearch };
