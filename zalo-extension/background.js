// background.js - FIXED ASYNC
console.log("LYHU Background Worker Started");

// DOUBLE CHECK THIS URL - Ensure it matches the user's actual deployed domain
const API_URL = "https://lyhu-b2b-platform.vercel.app/api/zalo/sync";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "sync_messages") {
        const payload = request.data;
        console.log("Background: Received sync request for", payload.messages.length, "messages");

        // Perform the API call
        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(res => {
                console.log("API Status:", res.status);
                return res.json().then(data => ({ status: res.status, body: data }));
            })
            .then(result => {
                console.log("API Success:", result);
                sendResponse({ success: true, result: result });
            })
            .catch(err => {
                console.error("API Error:", err);
                sendResponse({ success: false, error: err.toString() });
            });

        // IMPORTANT: Return true to indicate we will sendResponse asynchronously
        return true;
    }
});
