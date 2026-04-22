const { launchBrowser, delay, rdn } = require('./setup_browser');
const { logAction } = require('./supabase_logger');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(dest); });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', (err) => { fs.unlink(dest, () => reject(err)); });
    });
}

function spinText(text) {
    if (!text) return "";
    return text.replace(/\{([^{}]*)\}/g, function (match, group) {
        const options = group.split('|');
        return options[Math.floor(Math.random() * options.length)];
    });
}

(async () => {
    let browser = null;
    let tempImagePaths = [];
    const debugDir = path.join(__dirname, '../../debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    
    try {
        const args = process.argv.slice(2);
        const categoryArg = args.find(a => !a.startsWith('--'));
        let category = categoryArg || "Mặc định";
        
        console.log(`[POST] Bắt đầu rà soát kho chứa: "${category}"...`);

        // 1. Kéo mồi từ Đám mây
        const { data, error } = await supabase.from('bot_contents').select('*').eq('category', category);
        if (error || !data || data.length === 0) {
            console.error(`[POST] Không tìm thấy bài đăng nào trong kho "${category}".`);
            await logAction('post', 'error', `Đăng Bài: Lỗi - Kho "${category}" trống`);
            process.exit(1);
        }

        const randomContent = data[Math.floor(Math.random() * data.length)];
        const finalMessage = spinText(randomContent.message_text);
        console.log(`[POST] Đã bốc thăm bài: "${finalMessage.substring(0, 30)}..."`);

        // 2. Tải ảnh/video đính kèm
        if (randomContent.doc_folder_id) {
            const { data: filesData } = await supabase.from('documents_files')
                .select('*')
                .eq('folder_id', randomContent.doc_folder_id)
                .eq('is_deleted', false);
            
            if (filesData && filesData.length > 0) {
                const validMediaFiles = filesData.filter(f => {
                    const ext = (f.original_name || '').split('.').pop().toLowerCase();
                    return ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'wmv'].includes(ext);
                });
                
                if (validMediaFiles.length > 0) {
                    const shuffled = validMediaFiles.sort(() => 0.5 - Math.random());
                    const takeCount = randomContent.media_count || 1;
                    const selectedFiles = shuffled.slice(0, takeCount);
                    
                    console.log(`[POST] Tiến hành tải ${selectedFiles.length} file Media từ Supabase...`);
                    for (let f = 0; f < selectedFiles.length; f++) {
                        const file = selectedFiles[f];
                        try {
                            const { data: signedData, error: signErr } = await supabase.storage.from('lyhu-docs').createSignedUrl(file.storage_path, 3600);
                            if (!signErr && signedData && signedData.signedUrl) {
                                const ext = (file.original_name || '').split('.').pop() || 'jpg';
                                const dest = path.join(__dirname, `../../temp_upload_${Date.now()}_${f}.${ext}`);
                                await downloadImage(signedData.signedUrl, dest);
                                tempImagePaths.push(dest);
                            }
                        } catch (downloadErr) {}
                    }
                    console.log(`[POST] Tải thành công ${tempImagePaths.length} file Media!`);
                }
            }
        } else if (randomContent.image_url) {
            const ext = randomContent.image_url.split('.').pop().split('?')[0] || 'jpg';
            const dest = path.join(__dirname, `../../temp_upload_${Date.now()}.${ext}`);
            console.log(`[POST] Đang tải 1 ảnh đính kèm...`);
            await downloadImage(randomContent.image_url, dest);
            tempImagePaths.push(dest);
            console.log(`[POST] Tải ảnh hoàn tất!`);
        }

        // 3. Khởi chạy Trình duyệt
        browser = await launchBrowser();
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();
        await logAction('post', 'info', `Tiến hành Đăng Bài lên Cá nhân...`);

        // ============================================================
        // BƯỚC 4: Vào Facebook và MỞ COMPOSER DIALOG
        // ============================================================
        // Vào TRANG CÁ NHÂN (không phải newsfeed!) 
        await page.goto("https://www.facebook.com/me", { waitUntil: 'domcontentloaded', timeout: 60000 });
        await delay(rdn(3000, 5000));
        
        // Debug: Chụp screenshot xem trang đang hiển thị gì
        const currentUrl = page.url();
        console.log(`[POST] Bước 1: Đã vào trang cá nhân. URL: ${currentUrl}`);
        await page.screenshot({ path: path.join(debugDir, 'step1_profile.png') });
        console.log("[POST] Screenshot step1 saved.");

        // Kiểm tra đã login chưa (nếu thấy nút login thì dừng)
        const isLoginPage = await page.evaluate(() => {
            return !!document.querySelector('input[name="email"]') || 
                   !!document.querySelector('#loginbutton');
        });
        if (isLoginPage) {
            throw new Error("Chưa đăng nhập Facebook! Chạy manual_login.js trước.");
        }

        // BƯỚC 4a: Chờ page load đầy đủ, scroll lên đầu
        console.log("[POST] Bước 2: Chờ page load xong + scroll lên đầu (mạng chậm chờ lâu hơn)...");
        await delay(rdn(8000, 12000)); // Tăng từ 5-7s lên 8-12s
        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(3000);
        
        // Đóng popup nhẹ nhàng (chỉ 1 Escape, tránh đóng mất element)
        await page.keyboard.press('Escape');
        await delay(1000);
        
        // TÌM + CLICK COMPOSER VỚI RETRY (tối đa 5 lần)
        console.log("[POST] Tìm ô 'Bạn đang nghĩ gì?'...");
        let composerClicked = false;
        let composerInfo = { found: false };
        
        for (let retry = 0; retry < 5; retry++) {
            const currentInfo = await page.evaluate(() => {
                // Hàm tìm composer element
                function findComposer() {
                    // Chiến lược 1: Tìm SPAN/DIV chứa text "Bạn đang nghĩ gì?"
                    const allElements = Array.from(document.querySelectorAll('div[role="button"], span'));
                    let el = allElements.find(b => {
                        const txt = (b.innerText || '').trim();
                        const rect = b.getBoundingClientRect();
                        return rect.width > 200 && rect.height > 10 && 
                               txt.length > 5 && txt.length < 50 && (
                            txt.includes("Bạn đang nghĩ gì") || 
                            txt.includes("What's on your mind")
                        );
                    });
                    if (el) return { el, strategy: 'text' };
                    
                    // Chiến lược 2: Tìm div[aria-placeholder] chứa "nghĩ gì"
                    const placeholders = Array.from(document.querySelectorAll('div[aria-placeholder]'));
                    let textbox = placeholders.find(p => {
                        const ph = (p.getAttribute('aria-placeholder') || '').toLowerCase();
                        return (ph.includes('nghĩ gì') || ph.includes('on your mind')) &&
                               !ph.includes('bình luận') && !ph.includes('comment');
                    });
                    if (textbox) {
                        let parent = textbox.parentElement;
                        for (let i = 0; i < 5 && parent; i++) {
                            const rect = parent.getBoundingClientRect();
                            if (rect.width > 200 && rect.height > 20) {
                                return { el: parent, strategy: 'placeholder-parent' };
                            }
                            parent = parent.parentElement;
                        }
                        return { el: textbox, strategy: 'placeholder' };
                    }
                    return null;
                }
                
                const result = findComposer();
                if (!result) return { found: false };
                
                // QUAN TRỌNG: Scroll element vào giữa viewport TRƯỚC
                result.el.scrollIntoView({ block: 'center', behavior: 'instant' });
                
                // Lấy tọa độ SAU KHI scroll
                const rect = result.el.getBoundingClientRect();
                return { 
                    found: true, 
                    x: rect.x + rect.width / 2, 
                    y: rect.y + rect.height / 2, 
                    w: rect.width, 
                    h: rect.height, 
                    strategy: result.strategy 
                };
            });
            
            if (currentInfo.found) {
                composerInfo = currentInfo;
                console.log(`[POST] Tìm thấy composer (${composerInfo.strategy}) tại (${Math.round(composerInfo.x)}, ${Math.round(composerInfo.y)}), size ${Math.round(composerInfo.w)}x${Math.round(composerInfo.h)}`);
                await delay(500); // Chờ scroll xong
                await page.mouse.click(composerInfo.x, composerInfo.y);
                console.log("[POST] Đã click vào ô compose.");
                composerClicked = true;
                break;
            }
            
            console.log(`[POST] Chưa tìm thấy composer, chờ thêm... (${retry + 1}/5)`);
            await delay(3000);
            // Scroll lại lên đầu (phòng trường hợp bị scroll)
            await page.evaluate(() => window.scrollTo(0, 0));
        }
        
        // FALLBACK: Nếu vẫn không tìm thấy, thử click vào vị trí gần đúng
        if (!composerClicked) {
            console.log("[POST] ⚠ Không tìm thấy composer bằng selector, thử click vào vị trí ước lượng...");
            // Vị trí composer trên profile page thường ở khoảng (650, 260)
            await page.mouse.click(650, 260);
            await delay(1000);
        }
        
        // Chờ composer dialog "Tạo bài viết" xuất hiện
        console.log("[POST] Bước 3: Chờ composer dialog 'Tạo bài viết' tải lên (mạng chậm)...");
        await delay(rdn(4000, 6000)); // Tăng từ 2-3s lên 4-6s
        
        await page.screenshot({ path: path.join(debugDir, 'step2_after_click.png') });
        console.log("[POST] Screenshot step2 saved.");
        
        // Xác nhận dialog "Tạo bài viết" - TÌM TẤT CẢ dialog, thử tối đa 5 lần (khoảng 15-20s)
        let dialogOpened = false;
        for (let attempt = 0; attempt < 5; attempt++) {
            const dialogCheck = await page.evaluate(() => {
                // Tìm TẤT CẢ dialog trên trang (có thể có Thông báo + Composer cùng lúc)
                const allDialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
                
                for (const dialog of allDialogs) {
                    const text = dialog.innerText || '';
                    const isCreatePost = text.includes('Tạo bài viết') || 
                                        text.includes('Create post') || 
                                        text.includes('Create Post');
                    const hasTextbox = !!dialog.querySelector('div[role="textbox"][contenteditable="true"]');
                    
                    if (isCreatePost) {
                        return { found: true, isCreatePost: true, hasTextbox, dialogCount: allDialogs.length };
                    }
                }
                
                // Không tìm thấy dialog "Tạo bài viết"
                return { 
                    found: allDialogs.length > 0, 
                    isCreatePost: false, 
                    dialogCount: allDialogs.length,
                    titles: allDialogs.map(d => (d.innerText || '').substring(0, 30))
                };
            });
            
            console.log(`[POST] Dialog check: ${JSON.stringify(dialogCheck)}`);
            
            if (dialogCheck.isCreatePost) {
                dialogOpened = true;
                console.log("[POST] ✅ Dialog 'Tạo bài viết' đã mở!");
                break;
            }
            
            // Nếu tìm thấy dialog SAI (VD: Thông báo) → đóng nó rồi click lại composer
            if (dialogCheck.found && !dialogCheck.isCreatePost) {
                console.log("[POST] Phát hiện dialog sai (Thông báo?), đóng bằng Escape...");
                await page.keyboard.press('Escape');
                await delay(2000);
                
                // Click lại composer
                const reComposer = await page.evaluateHandle(() => {
                    const els = Array.from(document.querySelectorAll('div[role="button"], span'));
                    return els.find(b => {
                        const txt = (b.innerText || '').trim();
                        const rect = b.getBoundingClientRect();
                        return rect.width > 200 && rect.height > 10 && 
                               txt.includes("Bạn đang nghĩ gì");
                    }) || null;
                });
                const reEl = reComposer.asElement();
                if (reEl) {
                    const reBox = await reEl.boundingBox();
                    if (reBox) {
                        await page.mouse.click(reBox.x + reBox.width / 2, reBox.y + reBox.height / 2);
                        console.log("[POST] Đã click lại ô compose.");
                    }
                }
                await reComposer.dispose();
                await delay(3000);
            } else {
                console.log(`[POST] Dialog chưa mở, thử lại... (${attempt + 1}/5)`);
                
                // Nếu tọa độ lần trước tìm được thì dùng lại
                if (composerInfo && composerInfo.found) {
                     await page.mouse.click(composerInfo.x, composerInfo.y);
                }
                
                // Thêm một cú hích click ẩn bằng Javascript cho chắc chắn
                await page.evaluate(() => {
                    const allElements = Array.from(document.querySelectorAll('div[role="button"], span'));
                    const el = allElements.find(b => {
                        const txt = (b.innerText || '').trim();
                        return (txt.includes("Bạn đang nghĩ gì") || txt.includes("What's on your mind")) && txt.length < 50;
                    });
                    if (el) el.click();
                });
                
                await delay(3000); // Tăng thời gian chờ lên 3s mỗi lần thử
            }
        }

        if (!dialogOpened) {
            await page.screenshot({ path: path.join(debugDir, 'step2_failed.png') });
            throw new Error("Không thể mở Composer Dialog. Xem debug/step2_failed.png");
        }

        // ============================================================
        // BƯỚC 5: GÕ NỘI DUNG
        // ============================================================
        console.log("[POST] Bước 4: Gõ nội dung...");
        if (finalMessage) {
            // Tìm textbox TRONG dialog "Tạo bài viết" và CLICK bằng mouse (isTrusted!)
            const textboxInfo = await page.evaluate(() => {
                const allDialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
                let targetDialog = null;
                for (const d of allDialogs) {
                    const text = d.innerText || '';
                    if (text.includes('Tạo bài viết') || text.includes('Create post') || text.includes('Create Post')) {
                        targetDialog = d;
                        break;
                    }
                }
                
                let textbox = null;
                if (targetDialog) {
                    textbox = targetDialog.querySelector('div[role="textbox"][contenteditable="true"]');
                }
                if (!textbox) {
                    textbox = document.querySelector('div[role="textbox"][contenteditable="true"]');
                }
                if (textbox) {
                    textbox.scrollIntoView({ block: 'center' });
                    const rect = textbox.getBoundingClientRect();
                    return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                }
                return { found: false };
            });
            
            if (textboxInfo.found) {
                // Click vào textbox bằng mouse (isTrusted: true) → React bắt event đúng
                await page.mouse.click(textboxInfo.x, textboxInfo.y);
                
                // FB load bộ gõ rất chậm trên mạng yếu. Chờ hẳn 8-10 giây cho chắc ăn.
                console.log("[POST] Đang chờ ô nhập liệu load xong hoàn toàn...");
                await delay(rdn(8000, 10000));
                
                // Click lại lần nữa để đảm bảo focus không bị mất trong lúc FB load
                await page.mouse.click(textboxInfo.x, textboxInfo.y);
                await delay(1000);
                
                // "Warm up" input: gõ space rồi xóa → kích hoạt React listener
                await page.keyboard.press('Space');
                await delay(1000);
                await page.keyboard.press('Backspace');
                await delay(1000);
                
                // Gõ nội dung thật chậm như người để tránh Checkpoint
                // CHÚ Ý: Gõ từng dòng để chặn lỗi Facebook tự động nhận diện tag Nhóm/Người khi gõ Enter
                console.log("[POST] Bắt đầu gõ chữ như người thật...");
                const lines = finalMessage.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    // Gõ nội dung của dòng hiện tại
                    if (lines[i].length > 0) {
                        await page.keyboard.type(lines[i], { delay: rdn(30, 50) });
                    }
                    
                    // Nếu chưa phải dòng cuối cùng, ta cần gõ Enter để xuống dòng
                    if (i < lines.length - 1) {
                        // 1. Bấm Escape để tắt triệt để mọi popup gợi ý tag của Facebook
                        await page.keyboard.press('Escape');
                        await delay(100);
                        
                        // 2. Bấm Shift + Enter để xuống dòng an toàn (bảo vệ kép không cho dính tag)
                        await page.keyboard.down('Shift');
                        await page.keyboard.press('Enter');
                        await page.keyboard.up('Shift');
                        await delay(200);
                    }
                }
                console.log("[POST] ✅ Đã gõ xong nội dung bài viết.");
            } else {
                console.log("[POST] ⚠ Không thể focus textbox.");
            }
            await delay(rdn(2000, 3000));
        }

        // ============================================================
        // BƯỚC 6: UPLOAD ẢNH (trong dialog đã mở)
        // ============================================================
        if (tempImagePaths.length > 0) {
            console.log("[POST] Bước 5: Upload ảnh...");
            
            // 1. CLICK NÚT "Thêm Ảnh/Video" ĐỂ FACEBOOK TẠO THẺ <INPUT TYPE="FILE">
            const addPhotoBtn = await page.evaluateHandle(() => {
                const dialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
                let targetDialog = dialogs.find(d => (d.innerText || '').includes('Tạo bài viết')) || document.body;
                
                const btns = Array.from(targetDialog.querySelectorAll('div[role="button"]'));
                return btns.find(b => {
                    const label = (b.getAttribute('aria-label') || '').toLowerCase();
                    return label.includes('ảnh') || label.includes('photo') || label.includes('video');
                }) || null;
            });
            
            const photoEl = addPhotoBtn.asElement();
            if (photoEl) {
                console.log("[POST] Đang click nút Ảnh/Video để gọi khung upload...");
                const box = await photoEl.boundingBox();
                if (box) {
                    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                    await delay(3000); // Chờ khung upload hiện ra
                }
            }
            await addPhotoBtn.dispose();

            // 2. TÌM INPUT FILE VÀ UPLOAD
            const dialogFileInput = await page.$('div[role="dialog"] input[type="file"]');
            const anyFileInput = await page.$('input[type="file"]');
            const fileInput = dialogFileInput || anyFileInput;
            
            if (fileInput) {
                await fileInput.uploadFile(...tempImagePaths);
                console.log("[POST] ✅ Đã đẩy file ảnh/video vào trình duyệt.");
                
                const isVideo = tempImagePaths.some(p => p.match(/\.(mp4|mov|avi|wmv)$/i));
                if (isVideo) {
                    console.log("[POST] Phát hiện Video! Chờ upload (30-60s)...");
                    await delay(rdn(30000, 60000));
                } else {
                    console.log("[POST] Chờ ảnh tải lên (7-10s)...");
                    await delay(rdn(7000, 10000));
                }
            } else {
                console.log("[POST] ⚠ KHÔNG tìm thấy input file. Bỏ qua upload ảnh.");
            }
        }

        // ============================================================
        // BƯỚC 7: CLICK NÚT ĐĂNG
        // ============================================================
        console.log("[POST] Bước 6: Tìm và click nút Đăng...");
        await delay(rdn(2000, 4000));
        
        // Debug screenshot trước khi submit
        await page.screenshot({ path: path.join(debugDir, 'step3_before_submit.png') });
        
        // Tìm nút Đăng - trong ĐÚNG dialog "Tạo bài viết"
        const postBtnHandle = await page.evaluateHandle(() => {
            // Tìm đúng dialog "Tạo bài viết" trong tất cả dialog
            const allDialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
            let createPostDialog = null;
            for (const d of allDialogs) {
                const text = d.innerText || '';
                if (text.includes('Tạo bài viết') || text.includes('Create post') || text.includes('Create Post')) {
                    createPostDialog = d;
                    break;
                }
            }
            
            // Chiến lược 1: Tìm theo aria-label TRONG dialog đúng
            if (createPostDialog) {
                let btn = createPostDialog.querySelector('div[aria-label="Đăng"][role="button"]') ||
                          createPostDialog.querySelector('div[aria-label="Post"][role="button"]');
                if (btn) return btn;
                
                // Chiến lược 2: Tìm theo text content TRONG dialog đúng
                const allBtns = Array.from(createPostDialog.querySelectorAll('div[role="button"]'));
                btn = allBtns.find(b => {
                    const txt = (b.innerText || '').trim();
                    return txt === 'Đăng' || txt === 'Post';
                });
                if (btn) return btn;
            }
            
            // Chiến lược 3 (toàn trang): Tìm nút visible có text "Đăng"
            const allButtons = Array.from(document.querySelectorAll('div[role="button"], button'));
            let btn = allButtons.find(b => {
                const txt = (b.innerText || '').trim();
                const label = (b.getAttribute('aria-label') || '').trim();
                return (txt === 'Đăng' || txt === 'Post' || label === 'Đăng' || label === 'Post') &&
                       b.offsetParent !== null;
            });
            return btn || null;
        });
        
        const postBtnElement = postBtnHandle.asElement();
        let posted = false;
        
        if (postBtnElement) {
            // Chờ nút enable (Chờ tối đa 30 giây để xử lý ảnh nặng)
            for (let i = 0; i < 20; i++) {
                const isDisabled = await page.evaluate(el => el.getAttribute('aria-disabled'), postBtnElement);
                if (isDisabled !== 'true') {
                    console.log("[POST] Nút Đăng đã active!");
                    break;
                }
                console.log(`[POST] Đợi tải ảnh/xử lý, Nút Đăng chưa active... (${i+1}/20)`);
                await delay(1500);
            }
            
            const box = await postBtnElement.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
                console.log(`[POST] Click nút Đăng tại (${Math.round(box.x + box.width/2)}, ${Math.round(box.y + box.height/2)})`);
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                await delay(1000);
                // Fallback: Ép click bằng Javascript phòng trường hợp tọa độ bị lệch
                await page.evaluate(el => el.click(), postBtnElement);
                posted = true;
            } else {
                console.log("[POST] Nút Đăng có size 0, thử click bằng JS...");
                try { 
                    await page.evaluate(el => el.click(), postBtnElement); 
                    posted = true; 
                } catch(e) {}
            }
            await postBtnHandle.dispose();
        } else {
            await postBtnHandle.dispose();
            console.log("[POST] ⚠ Không tìm thấy nút Đăng.");
        }

        if (posted) {
            console.log("[POST] ⏳ Đang chờ Facebook xử lý đăng bài (đợi cửa sổ đóng)...");
            // Chờ tối đa 30 giây cho Nút Đăng biến mất (tức là hộp thoại đã đóng)
            let actuallyPosted = false;
            for (let i = 0; i < 30; i++) {
                const isBtnGone = await page.evaluate(() => {
                    // Nếu không còn tìm thấy nút Đăng nào trên màn hình -> đã đóng
                    const btns = Array.from(document.querySelectorAll('div[role="button"]'));
                    const postBtn = btns.find(b => {
                        const txt = (b.innerText || '').trim();
                        const label = (b.getAttribute('aria-label') || '').trim();
                        return txt === 'Đăng' || txt === 'Post' || label === 'Đăng' || label === 'Post';
                    });
                    return !postBtn;
                });
                
                if (isBtnGone) {
                    console.log("[POST] 🟢 Cửa sổ đăng bài đã đóng! Bài viết đã lên sóng.");
                    actuallyPosted = true;
                    break;
                }
                await delay(1000);
            }
            
            await delay(3000); // Nghỉ 3s cuối cùng cho chắc
            await page.screenshot({ path: path.join(debugDir, 'step4_after_submit.png') });
            
            if (actuallyPosted) {
                console.log("[POST] 🟢 Hoàn thành toàn bộ quy trình!");
                await logAction('post', 'success', `Thành công: Đã đăng 1 Status Cá Nhân (Kho: ${category})`);
            } else {
                console.log("[POST] ❌ Nút Đăng vẫn còn trên màn hình, Facebook từ chối bài viết hoặc click trượt!");
                throw new Error("Lỗi: Không thể đăng bài (Nút đăng không phản hồi).");
            }
        } else {
            await page.screenshot({ path: path.join(debugDir, 'step3_submit_failed.png') });
            throw new Error("Không thể bấm nút Đăng. Xem debug/ để biết chi tiết.");
        }

    } catch (e) {
        console.error("[POST_ERROR]", e);
        await logAction('post', 'error', `Lỗi đăng bài: ${e.message}`);
    } finally {
        if (browser) await browser.close();
        for (const p of tempImagePaths) {
            if (fs.existsSync(p)) {
                try { fs.unlinkSync(p); } catch (err) {}
            }
        }
        process.exit(0);
    }
})();
