"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function AffiliateTracker() {
    const searchParams = useSearchParams();
    const hasTracked = useRef(false);

    useEffect(() => {
        const ref = searchParams?.get("ref");
        
        if (ref && !hasTracked.current) {
            hasTracked.current = true;
            
            // Call API to track click in background
            fetch("/api/affiliate/track-click", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ref: ref,
                    url: window.location.href,
                    userAgent: navigator.userAgent
                }),
            }).catch(e => console.error("Failed to track affiliate click", e));
        }
    }, [searchParams]);

    return null;
}
