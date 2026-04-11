/**
 * Level 5: Group Intelligence (Dual-Mode)
 * 1. Mở Facebook và Tham gia vào Nhóm (Nếu có URL List)
 * 2. Lùng sục Nhóm mới trên Search (Nếu chỉ có Keyword)
 */

const { launchBrowser, delay, rdn } = require('./setup_browser');
const { logAction } = require('./supabase_logger');

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
            keyword = parts[0].trim() || parts[1]?.trim() || "Chợ sỉ kinh doanh";
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
                    await joinBtn.click();
                    await delay(rdn(4000, 6000));
                    
                    // Khắc phục câu hỏi Form
                    await answerGroupQuestions(page);
                    
                    console.log(`[GROUP] ✅ Đã ấn Tham gia thành công / Đã gửi yêu cầu!`);
                    await logAction('search', 'success', `Đã xin tham gia nhánh: ${link.split('/').pop()?.slice(0,10)}...`);
                    joinedCount++;
                    
                    // Không chờ nếu là nhóm cuối cùng
                    if (joinedCount < limit) {
                        const waitTime = rdn(internalDelay * 1000, (internalDelay + 5) * 1000);
                        console.log(`[GROUP] ⏳ Nghỉ ngơi ${Math.round(waitTime/1000)}s tránh bị Checkpoint...`);
                        await delay(waitTime);
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
                        console.log(`[GROUP] 🖱️ Chộp được 1 Hội Nhóm tiềm năng... Bấm Tham Gia...`);
                        await btn.scrollIntoView({ block: 'center' });
                        await delay(1000);
                        await btn.click();
                        await delay(rdn(4000, 6000));
                        
                        await answerGroupQuestions(page);

                        console.log(`[GROUP] ✅ Đã chốt hạ xin tham gia (Từ khóa: ${keyword})!`);
                        await logAction('search', 'success', `Đã xin Tham gia 1 nhóm thuộc bộ từ khóa: ${keyword}`);
                        
                        joinedCount++;
                        if (joinedCount < limit) {
                            const waitTime = rdn(internalDelay * 1000, (internalDelay + 5) * 1000);
                            console.log(`[GROUP] ⏳ Chờ ${Math.round(waitTime/1000)}s ngụy trang người thật...`);
                            await delay(waitTime);
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
