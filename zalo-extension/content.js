console.log("%c LYHU ZALO SYNC STARTED V2 ", "background: #222; color: #00ff00; font-size: 20px");

const SYNC_API_URL = "https://lyhu-b2b-platform.vercel.app/api/zalo/sync";

// 1. Basic Health Check Loop
setInterval(() => {
    scanAndSync();
}, 3000);

function getActiveConversationInfo() {
    try {
        // Strategy V6: GEOMETRIC ANCHOR (The Sniper)
        // We focus ONLY on the top 150px of the screen (Where the Header lives)
        // We look for the largest text element in that zone.

        console.log("LYHU Sync: Scanning Header Zone (Top 150px)...");

        // 1. Get all potential Name candidates in the Top Zone
        // Candidates: h4, div, span, specific Zalo classes
        const candidates = document.querySelectorAll('header div, header span, header h4, .header-title, .title, .font-600');

        let bestCandidate = null;
        let maxScore = 0;

        for (let el of candidates) {
            const rect = el.getBoundingClientRect();

            // FILTER: Must be in Top Left/Center Zone
            // Top < 150px (Header height is usually 64px)
            // Left < 70% width (Avoid right sidebar controls)
            if (rect.top >= 0 && rect.bottom < 150 && rect.left < window.innerWidth * 0.7) {

                const text = el.innerText ? el.innerText.trim() : "";

                // FILTER: Valid Name Quality
                if (text.length > 0 && text.length < 50 && !text.includes("Truy cập") && !text.includes("Online")) {

                    // SCORE: Formula = Font Size * position weight
                    // We prefer larger text that is closer to the left
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
            console.log(`LYHU Sync: Found Header Name (Geo-Scan): "${bestCandidate.name}"`);

            // Try to find avatar near this name (in the same header block)
            let avatarSrc = "";
            // Look for img in the same header container
            const headerContainer = bestCandidate.el.closest('header, .header-wrapper') || document.body; // Fallback to body scope if strict parent fails, but constrained by rect later

            if (headerContainer) {
                const imgs = headerContainer.querySelectorAll('img');
                for (let img of imgs) {
                    const r = img.getBoundingClientRect();
                    // Avatar must be close to the name and in the top zone
                    if (r.bottom < 150 && Math.abs(r.left - bestCandidate.el.getBoundingClientRect().left) < 300) {
                        if (img.width > 20 && img.height > 20) {
                            avatarSrc = img.src;
                            break; // Take first valid image
                        }
                    }
                }
            }

            return { name: bestCandidate.name, avatar: avatarSrc };
        }

        // Fallback: Check Right Sidebar if Header failed
        const infoPanel = document.querySelector('[data-id="info_panel"], aside');
        if (infoPanel) {
            const nameEl = infoPanel.querySelector('.font-600.text-15, h4');
            if (nameEl) return { name: nameEl.innerText.trim(), avatar: "" };
        }

    } catch (e) {
        console.log("Error getting header info:", e);
    }

    console.log("LYHU Sync: FAILED to find name. Keeping 'Unknown'.");
    return { name: "Unknown", avatar: "" };
}

function scanAndSync() {
    const partnerInfo = getActiveConversationInfo();

    // Standard Selectors (Updated with common Zalo patterns)
    // trying data-id which is very common
    const elements = document.querySelectorAll('.card--text, .card-text, .bubble-content, div[id^="msg-"], div[id^="before-msg-"], div[data-id], .z-message');

    // Filter elements that are likely messages (must have text)
    const validElements = Array.from(elements).filter(el => {
        // Must have some text
        if (!el.innerText || el.innerText.trim().length === 0) return false;
        // Must not be the whole page or huge container
        if (el.tagName === 'DIV' && el.offsetHeight > 500) return false;
        // Check for message-like attributes if using generic selector
        if (el.hasAttribute('data-id') && !el.className.includes('msg')) {
            // Zalo data-id for messages usually looks like "local_..." or "msg_..." or long number
            const did = el.getAttribute('data-id');
            if (did.length < 5) return false;
        }
        return true;
    });

    console.log(`LYHU Sync Debug: Found ${validElements.length} potential message candidates.`);

    if (validElements.length === 0) return;

    const messages = [];
    validElements.forEach(el => {
        try {
            if (el.dataset.lyhuSynced === "true") return;

            let content = el.innerText;
            // cleanup if needed

            if (!content || content.trim().length < 1) return;

            const isMe = el.classList.contains('me') || el.closest('.me, .card-me') !== null;
            let originalId = el.getAttribute('id') || el.getAttribute('data-id');
            const id = originalId ? `zalo_${originalId}` : "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

            // Only sync if it looks like a real message (heuristics)
            // 1. Not "Today", "Yesterday" labels
            if (content.length < 20 && (content.includes("Hôm nay") || content.includes("Hôm qua"))) return;

            // Robust Sender Name
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
        console.log(`LYHU Sync: Sending ${messages.length} messages. Partner: ${partnerInfo.name}`);
        try {
            chrome.runtime.sendMessage({
                action: "sync_messages",
                data: {
                    currentAccount: { id: "default_staff", name: "Staff Zalo", avatar: "" },
                    messages: messages
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("Runtime Error (Connect):", chrome.runtime.lastError.message);
                } else {
                    console.log("Sync Response:", response);
                }
            });
        } catch (e) { }
    }
}
