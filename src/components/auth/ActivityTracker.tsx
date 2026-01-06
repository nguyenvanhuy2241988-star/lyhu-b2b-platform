import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const ActivityTracker = () => {
    const { user } = useAuth();
    const pathname = usePathname();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user) return;

        const sendHeartbeat = async () => {
            // Optional: Check if document is hidden to stop tracking when tab is inactive
            // if (document.hidden) return; 

            try {
                // Determine simple device info
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                const deviceInfo = isMobile ? "Mobile" : "Desktop";
                const currentPath = window.location.pathname; // Or use pathname from hook

                await supabase.rpc('track_heartbeat', {
                    p_path: currentPath,
                    p_device: deviceInfo
                });
            } catch (error) {
                console.error("Heartbeat failed", error);
            }
        };

        // Initial call
        sendHeartbeat();

        // Set interval
        intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [user, pathname]); // Re-run/update closure when path changes (optional, but interval handles latest if refs used. Here simpler to just let it run)

    return null; // This component renders nothing
};
