"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function WebTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Initialize IDs
        let visitorId = localStorage.getItem("lyhu_visitor_id");
        if (!visitorId) {
            visitorId = uuidv4();
            localStorage.setItem("lyhu_visitor_id", visitorId);
        }

        let sessionId = sessionStorage.getItem("lyhu_session_id");
        if (!sessionId) {
            sessionId = uuidv4();
            sessionStorage.setItem("lyhu_session_id", sessionId);
        }

        // Send tracking data
        const trackPageView = async () => {
            try {
                // Determine full URL (handling client-side routing)
                const fullUrl = window.location.href;
                
                // Get referrer (only on first page load of the session, or from document.referrer)
                // In single page apps, document.referrer doesn't update on internal route changes.
                // For internal routing, we might want to track previous path, but Google Analytics
                // usually only cares about external referrers.
                let referrer = document.referrer;
                
                // If it's an internal referrer, we can keep it or null it. Let's send it anyway.

                await fetch("/api/analytics/track", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        visitor_id: visitorId,
                        session_id: sessionId,
                        url: fullUrl,
                        pathname: pathname,
                        referrer: referrer,
                        screen_width: window.innerWidth,
                    }),
                    // Keepalive ensures the request fires even if user navigates away quickly
                    keepalive: true 
                });
            } catch (error) {
                console.error("Failed to track page view:", error);
            }
        };

        // Don't track if we're inside the dashboard/admin to avoid skewing public traffic
        if (pathname && !pathname.startsWith('/admin') && !pathname.startsWith('/telesales') && !pathname.startsWith('/settings')) {
             trackPageView();
        }
        
    }, [pathname, searchParams]); // Re-run when path changes

    // This component renders nothing
    return null;
}
