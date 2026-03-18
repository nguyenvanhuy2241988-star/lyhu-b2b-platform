import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const ActivityTracker = () => {
    const { user } = useAuth();
    const pathname = usePathname();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const ipRef = useRef<string | null>(null);

    // Fetch IP once on mount
    useEffect(() => {
        fetch('/api/ip')
            .then(res => res.json())
            .then(data => { ipRef.current = data.ip || null; })
            .catch(() => { ipRef.current = null; });
    }, []);

    useEffect(() => {
        if (!user) return;

        const sendHeartbeat = async () => {
            try {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                const deviceInfo = isMobile ? "Mobile" : "Desktop";
                const currentPath = window.location.pathname;

                await supabase.rpc('track_heartbeat', {
                    p_path: currentPath,
                    p_device: deviceInfo,
                    p_ip: ipRef.current || null
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
    }, [user, pathname]);

    return null;
};
