// content.js - DEBUG VERSION
console.log("%c LYHU ZALO SYNC STARTED ", "background: #222; color: #bada55; font-size: 20px");

const SYNC_API_URL = "https://lyhu-b2b-platform.vercel.app/api/zalo/sync";

// 1. Basic Health Check Loop
setInterval(() => {
    console.log("LYHU Sync is alive. Scanning for messages...");
    scanAndSync();
}, 5000);

function scanAndSync() {
    // Strategy: Look for ANYTHING that looks like a message bubble
    // Zalo often uses 'div' with specific attributes or nested text
    // We will look for deep text nodes

    // Attempt 1: Look for common Zalo class fragments
    // .card--text is common for text messages
    // .msg-view is the container

    // We query for a broad range to be safe
    const elements = document.querySelectorAll('.card--text, .card-text, .bubble-content, [data-id], .text');

    if (elements.length === 0) {
        console.log("LYHU Sync: No message elements found (yet).");
        return;
    }

    console.log(`LYHU Sync: Found ${elements.length} potential elements.`);

    const messages = [];
    elements.forEach(el => {
        try {
            const text = el.innerText;
            if (!text || text.length < 1) return;

            // Simple heuristic to determine sender (Right side = Me, Left side = Customer)
            // Zalo puts my messages in a container with class 'me'
            const isMe = el.closest('.me') !== null;

            // Generate a unique ID (Timestamp + Random) to ensure every message is captured
            const id = "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

            messages.push({
                msgId: id,
                senderId: isMe ? "me" : "customer",
                receiverId: isMe ? "customer" : "me",
                content: text,
                msgType: 'text',
                timestamp: new Date().toISOString()
            });
        } catch (e) { console.error(e); }
    });

    if (messages.length > 0) {
        console.log(`LYHU Sync: Sending ${messages.length} messages to CRM...`);
        try {
            chrome.runtime.sendMessage({
                action: "sync_messages",
                data: {
                    currentAccount: { id: "unknown", name: "Staff Zalo", avatar: "" },
                    messages: messages
                }
            }, (response) => {
                // Callback from Background
                if (chrome.runtime.lastError) {
                    console.error("LYHU Sync: Extension Error:", chrome.runtime.lastError.message);
                } else if (response && response.success) {
                    console.log("%c LYHU Sync: SUCCESS! saved to DB.", "color: green; font-weight: bold;");
                } else {
                    console.error("LYHU Sync: API FAILED.", response);
                }
            });
        } catch (e) { console.error("Send Message Error", e); }
    }
}
