"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthProvider";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const ActivityTracker = () => {
    const { user } = useAuth();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user) return;

        const sendHeartbeat = async () => {
            // Optional: Check if document is hidden to stop tracking when tab is inactive
            // if (document.hidden) return; 

            try {
                await supabase.rpc('track_heartbeat');
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
    }, [user]);

    return null; // This component renders nothing
};
