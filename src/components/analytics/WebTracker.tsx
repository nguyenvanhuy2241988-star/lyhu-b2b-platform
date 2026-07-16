"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabaseClient";

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
                // Check if user is an internal staff member
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const role = session.user?.user_metadata?.role;
                    const internalRoles = ['admin', 'sale', 'telesale', 'marketing', 'media_creator', 'warehouse', 'accounting'];
                    if (role && internalRoles.includes(role)) {
                        console.log("Analytics: Internal user detected, tracking skipped.");
                        return;
                    }
                    // Thêm bảo mật phụ nếu họ dùng email nội bộ nhưng chưa gán role
                    if (session.user?.email?.endsWith('@lyhu.com.vn')) {
                        console.log("Analytics: Internal email detected, tracking skipped.");
                        return;
                    }
                }

                // Determine full URL (handling client-side routing)
                const fullUrl = window.location.href;
                
                // Get referrer (only on first page load of the session, or from document.referrer)
                // In single page apps, document.referrer doesn't update on internal route changes.
                // For internal routing, we might want to track previous path, but Google Analytics
                // usually only cares about external referrers.
                let referrer = document.referrer;
                
                // Calculate Load Time (only for initial hard loads)
                let loadTimeMs = null;
                if (isFirstRender.current) {
                    const navEntries = performance.getEntriesByType('navigation');
                    if (navEntries.length > 0) {
                        const navTiming = navEntries[0] as PerformanceNavigationTiming;
                        loadTimeMs = Math.round(navTiming.domContentLoadedEventEnd || performance.now());
                    } else {
                        loadTimeMs = Math.round(performance.now());
                    }
                }

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
                        load_time_ms: loadTimeMs,
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
        
        // Unconditionally mark first render as done, so subsequent client navigations don't log a huge performance.now()
        isFirstRender.current = false;
        
    }, [pathname, searchParams]); // Re-run when path changes

    // This component renders nothing
    return null;
}
