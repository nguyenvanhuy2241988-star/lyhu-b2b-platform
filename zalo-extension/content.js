console.log("%c LYHU ZALO SYNC STARTED V17 ", "background: #222; color: #ff00ff; font-size: 20px");

const SYNC_API_URL = "https://lyhu-b2b-platform.vercel.app/api/zalo/sync";
const CONTACTS_API_URL = "https://lyhu-b2b-platform.vercel.app/api/zalo/contacts";

// STARTUP: Reset ALL sync flags when Extension first loads
console.log("LYHU Sync: Resetting all sync flags on startup...");
document.querySelectorAll('[data-lyhu-synced]').forEach(el => {
    delete el.dataset.lyhuSynced;
});
document.querySelectorAll('[data-lyhu-contact-synced]').forEach(el => {
    delete el.dataset.lyhuContactSynced;
});
window.lastPartnerName = null;

// 1. Health Check Loops (Message sync every 3 seconds)
setInterval(() => {
    scanAndSync();
}, 3000);

// 2. Sidebar Scan Loop (Every 10 seconds)
setInterval(() => {
    scanSidebar();
}, 10000);

// Initial scans after page loads
setTimeout(() => {
    console.log("LYHU Sync: Running initial sync...");
    scanAndSync();
    scanSidebar();
}, 1500);

// ========== AUTO-SYNC ALL (Keyboard: Ctrl+Shift+S) ==========
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        console.log("%c LYHU AUTO-SYNC STARTED ", "background: #ff6600; color: white; font-size: 16px");
        autoSyncAll();
    }
});

// State for auto-sync
window.lyhuAutoSyncRunning = false;

async function autoSyncAll() {
    if (window.lyhuAutoSyncRunning) {
        console.log("LYHU Auto-Sync: Already running, skipping...");
        return;
    }
    window.lyhuAutoSyncRunning = true;

    try {
        // Step 1: Auto-scroll sidebar to load all contacts
        console.log("LYHU Auto-Sync: Step 1 - Scrolling sidebar to load all contacts...");
        await autoScrollSidebar();

        // Step 2: Collect all visible contacts
        console.log("LYHU Auto-Sync: Step 2 - Collecting all contacts...");
        const contactElements = collectContactElements();
        console.log(`LYHU Auto-Sync: Found ${contactElements.length} contacts to sync`);

        // Step 3: Click through each contact to sync messages
        console.log("LYHU Auto-Sync: Step 3 - Clicking through contacts to sync messages...");
        for (let i = 0; i < contactElements.length; i++) {
            const el = contactElements[i];
            const name = el.innerText?.split('\n')[0] || `Contact ${i + 1}`;

            console.log(`LYHU Auto-Sync: [${i + 1}/${contactElements.length}] Opening "${name}"...`);

            // Click the contact
            el.click();

            // Wait 2-4 seconds (random to appear human)
            const waitTime = 2000 + Math.random() * 2000;
            await sleep(waitTime);

            // Sync messages from this chat
            scanAndSync();

            // Small extra delay
            await sleep(500);
        }

        console.log("%c LYHU AUTO-SYNC COMPLETE ", "background: #00cc00; color: white; font-size: 16px");
        console.log(`LYHU Auto-Sync: Synced ${contactElements.length} contacts`);

    } catch (err) {
        console.error("LYHU Auto-Sync Error:", err);
    } finally {
        window.lyhuAutoSyncRunning = false;
    }
}

async function autoScrollSidebar() {
    // Find the sidebar scrollable container
    const sidebar = document.querySelector('.conv-list, .conversation-list, [role="listbox"], .left-panel')
        || document.querySelector('div[style*="overflow"]');

    if (!sidebar) {
        // Fallback: find scrollable div in left area
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
            const rect = div.getBoundingClientRect();
            if (rect.left < 50 && rect.width > 200 && rect.width < 400 && div.scrollHeight > div.clientHeight) {
                await scrollContainer(div);
                return;
            }
        }
        console.log("LYHU Auto-Sync: Could not find sidebar to scroll");
        return;
    }

    await scrollContainer(sidebar);
}

async function scrollContainer(container) {
    const maxScrollAttempts = 20;
    let prevScrollTop = -1;

    for (let i = 0; i < maxScrollAttempts; i++) {
        container.scrollTop = container.scrollHeight;
        await sleep(800 + Math.random() * 400);

        // Scan new contacts after each scroll
        scanSidebar();

        // Check if we've reached the bottom
        if (container.scrollTop === prevScrollTop) {
            console.log("LYHU Auto-Sync: Reached bottom of sidebar");
            break;
        }
        prevScrollTop = container.scrollTop;
    }

    // Scroll back to top
    container.scrollTop = 0;
}

function collectContactElements() {
    const elements = [];
    const allDivs = document.querySelectorAll('div');

    for (const div of allDivs) {
        const rect = div.getBoundingClientRect();

        // Contact items in sidebar: left position, reasonable size, has avatar
        if (rect.left < 400 && rect.width > 100 && rect.width < 400 &&
            rect.height > 40 && rect.height < 100) {

            const img = div.querySelector('img');
            const text = div.innerText?.trim();

            if (img && text && text.length > 2 && text.length < 200) {
                // Avoid duplicates and non-contact items
                if (!text.includes("Tìm kiếm") && !text.includes("Zalo")) {
                    elements.push(div);
                }
            }
        }
    }

    // Remove duplicates by checking if parent contains child
    const unique = elements.filter((el, idx) => {
        return !elements.some((other, otherIdx) =>
            otherIdx !== idx && other.contains(el)
        );
    });

    return unique.slice(0, 50); // Limit to 50 contacts per run
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// ========== SIDEBAR SCRAPING V17 (Refined Geometry) ==========
function scanSidebar() {
    try {
        console.log("LYHU Sync: Scanning Sidebar (V17 Geometry)...");

        const allDivs = document.body.querySelectorAll('div');
        const potentialContacts = [];
        let rawCandidates = 0;

        for (const div of allDivs) {
            const rect = div.getBoundingClientRect();

            // STRICT SIDEBAR ZONE:
            // V17 Update: Adjusted Left < 150 (was < 50) to account for Nav Bar width (~64px)
            // Width 200px - 350px
            if (rect.left < 150 && rect.width > 200 && rect.width < 350 && rect.height > 50 && rect.height < 120) {
                rawCandidates++;

                const text = div.innerText?.trim();
                const img = div.querySelector('img');

                if (text && text.length > 2 && text.length < 100 && img) {
                    // Clean up name
                    const lines = text.split('\n');
                    const name = lines[0].trim();

                    // Filter junk
                    if (name.includes("Tìm kiếm") || name.includes("Phân loại") || name.includes("Zalo")) continue;
                    if (name.match(/^\d+$/)) continue; // Skip numbers

                    // Avoid duplicates
                    if (potentialContacts.some(c => c.name === name)) continue;

                    console.log(`LYHU Sync Debug: Found Sidebar Contact -> ${name}`);

                    const lastMessage = lines.length > 1 ? lines[1].trim().substring(0, 100) : "";

                    potentialContacts.push({
                        name: name,
                        avatar: img.src,
                        lastMessage: lastMessage,
                        lastSeen: new Date().toISOString()
                    });

                    div.dataset.lyhuContactSynced = "true";
                }
            }
        }

        console.log(`LYHU Sync: Geometry Scan found ${rawCandidates} raw elements, ${potentialContacts.length} valid contacts.`);

        if (potentialContacts.length > 0) {
            // Send to backend
            fetch(CONTACTS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contacts: potentialContacts,
                    accountId: "default_staff"
                })
            })
                .then(res => res.json())
                .then(data => console.log("LYHU Sync: Contacts Sent. Response:", data))
                .catch(err => console.error("LYHU Sync: Contacts Send Error:", err));
        }

    } catch (e) {
        console.error("LYHU Sync: Sidebar Scan Error:", e);
    }
}


function getActiveConversationInfo() {
    try {
        // Candidates: h4, div, span, specific Zalo classes
        const candidates = document.querySelectorAll('header div, header span, header h4, .header-title, .title, .font-600');
        let bestCandidate = null;
        let maxScore = 0;

        for (let el of candidates) {
            const rect = el.getBoundingClientRect();
            // FILTER: Must be in Top Left/Center Zone
            if (rect.top >= 0 && rect.bottom < 150 && rect.left < window.innerWidth * 0.7) {
                const text = el.innerText ? el.innerText.trim() : "";
                // FILTER: Valid Name Quality
                if (text.length > 0 && text.length < 50 && !text.includes("Truy cập") && !text.includes("Online")) {
                    // SCORE: Font Size
                    const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
                    const score = fontSize;
                    if (score > maxScore) {
                        maxScore = score;
                        bestCandidate = { name: text, el: el };
                    }
                }
            }
        }

        if (bestCandidate) {
            // Try to find avatar near this name
            let avatarSrc = "";
            const headerContainer = bestCandidate.el.closest('header, .header-wrapper') || document.body;
            if (headerContainer) {
                const imgs = headerContainer.querySelectorAll('img');
                for (let img of imgs) {
                    const r = img.getBoundingClientRect();
                    if (r.bottom < 150 && Math.abs(r.left - bestCandidate.el.getBoundingClientRect().left) < 300) {
                        if (img.width > 20 && img.height > 20) {
                            avatarSrc = img.src;
                            break;
                        }
                    }
                }
            }
            return { name: bestCandidate.name, avatar: avatarSrc };
        }
    } catch (e) {
        console.log("Error getting header info:", e);
    }
    return { name: "Unknown", avatar: "" };
}

function scanAndSync() {
    // 1. Check for "Welcome" Screen
    const welcomeText = document.body.innerText;
    if (welcomeText.includes("Chào mừng đến với Zalo PC") || welcomeText.includes("Khám phá những tiện ích")) {
        return;
    }

    const partnerInfo = getActiveConversationInfo();

    // 2. Safety Check: Unknown Partner
    if (!partnerInfo || partnerInfo.name === "Unknown") {
        return;
    }

    if (window.lastPartnerName && window.lastPartnerName !== partnerInfo.name) {
        console.log(`LYHU Sync: Conversation changed to "${partnerInfo.name}". Resetting flags.`);
        document.querySelectorAll('[data-lyhu-synced="true"]').forEach(el => {
            el.dataset.lyhuSynced = "false";
        });
    }
    window.lastPartnerName = partnerInfo.name;

    // ========== V12: ROBUST GLOBAL SEARCH ==========
    const elements = document.querySelectorAll(
        'span.text, ' +
        'div.text, ' +
        'div.card--text, ' +
        'div.bubble-content, ' +
        'div[class*="message"] span, ' +
        'div[class*="content"] span, ' +
        '[data-id] span'
    );

    // Filter elements
    const validElements = Array.from(elements).filter(el => {
        const text = el.innerText?.trim();
        if (!text || text.length === 0) return false;
        if (text.length > 1000) return false;

        const rect = el.getBoundingClientRect();

        // 1. LEFT SIDEBAR FILTER (Strict)
        if (rect.left < 310) return false;

        // 2. RIGHT SIDEBAR FILTER (Info Panel - V17 Expanded)
        // Expanded to 400px to avoid leakage
        if (rect.left > window.innerWidth - 400) return false;

        // 3. CONTENT FILTER (V17 Aggressive Blacklist)
        const contentBlacklist = [
            "Ảnh/Video", "File", "Link", "Thiết lập bảo mật", "Danh sách nhắc hẹn",
            "Tin nhắn tự xóa", "Ẩn trò chuyện", "Báo xấu", "Quản lý nhóm",
            "Xem thành viên", "Bảng tin nhóm", "Ảnh", "Video", "Kho media",
            "Tắt thông báo", "Ghim hội thoại", "Tạo nhóm trò chuyện",
            "Thông tin hội thoại", "Xem tất cả", "nhóm chung", "của bạn"
        ];

        // Exact match check
        if (contentBlacklist.some(s => text === s)) return false;

        // Partial match for aggressive junk
        if (text.includes("nhóm chung") || text.includes("Xem tất cả")) return false;

        // Skip quote replies
        if (el.closest('.quote-banner') || el.closest('.quote-view') || el.closest('.quote-content')) return false;

        // Skip sidebar preview patterns
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length >= 2 && lines.length <= 5) {
            if (rect.left < 400 && lines.some(l => l.match(/^\d+\s*(phút|giờ|ngày)/))) return false;
        }

        return true;
    });

    if (validElements.length === 0) return;

    const messages = [];

    validElements.forEach(el => {
        try {
            if (el.dataset.lyhuSynced === "true") return;

            let content = el.innerText;
            if (!content || content.trim().length < 1) return;

            const cardElement = el.closest('.card');
            const isMe = el.classList.contains('me') ||
                (cardElement && cardElement.classList.contains('me')) ||
                el.closest('.k-message-sent') !== null ||
                el.closest('.me') !== null;

            let originalId = el.getAttribute('id') || el.getAttribute('data-id');
            const id = originalId ? `zalo_${originalId}` : "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

            if (content.length < 20 && (content.includes("Hôm nay") || content.includes("Hôm qua"))) return;

            let senderId = isMe ? "me" : partnerInfo.name;
            let senderName = isMe ? "Nhân viên" : partnerInfo.name;

            messages.push({
                msgId: id,
                senderId: senderId,
                senderName: senderName,
                senderAvatar: isMe ? "" : partnerInfo.avatar,
                receiverId: isMe ? partnerInfo.name : "me",
                receiverName: isMe ? partnerInfo.name : "Nhân viên",
                content: content,
                msgType: 'text',
                isMe: isMe,
                timestamp: new Date().toISOString()
            });
            el.dataset.lyhuSynced = "true";
        } catch (e) {
            console.error("Msg Parse Error", e);
        }
    });

    if (messages.length > 0) {
        console.log(`LYHU Sync: Sending ${messages.length} messages.`);
        fetch(SYNC_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentAccount: { id: "default_staff", name: "Staff Zalo", avatar: "" },
                messages: messages
            })
        }).catch(err => {
            console.log("Sync Error:", err);
            validElements.forEach(el => { el.dataset.lyhuSynced = "false"; });
        });
    }
}
