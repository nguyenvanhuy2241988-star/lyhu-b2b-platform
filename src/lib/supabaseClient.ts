'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    // Not throwing error to allow app to load for debugging/setup
}

// =====================================================
// SEPARATE CLIENTS TO AVOID CONFLICTS
// =====================================================

// Client for Realtime subscriptions ONLY
// This client maintains the WebSocket connection
let realtimeClientInstance: ReturnType<typeof createBrowserClient> | null = null;
export function getRealtimeClient() {
    if (!realtimeClientInstance) {
        realtimeClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return realtimeClientInstance;
}

// Client for CRUD operations (REST API calls)
// Creates a fresh client each time to avoid state conflicts
export function getCrudClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Legacy exports for backward compatibility
export function createClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = getRealtimeClient();

export default createClient;
