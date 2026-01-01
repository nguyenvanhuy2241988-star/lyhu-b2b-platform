'use client';

import { createBrowserClient } from '@supabase/ssr';

// Use dummy values if env vars are missing to prevent crash during Next.js build prerendering.
// These variable must be present in Vercel to work at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

const isConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!isConfigured && typeof window !== 'undefined') {
    console.warn("Supabase environment variables are missing. Please configure them in your .env file or Vercel dashboard.");
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

// Export a singleton instance. 
// Note: During build/prerender, this will use placeholder values.
export const supabase = getRealtimeClient();

export default createClient;
