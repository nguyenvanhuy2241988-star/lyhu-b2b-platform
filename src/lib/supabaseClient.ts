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

// SEPARATE CLIENTS NO LONGER NEEDED - USE SINGLETON
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
    if (!supabaseInstance) {
        supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
}

// Client for Realtime and CRUD
export const supabase = getSupabase();

// Backward compatibility helper
export function getRealtimeClient() { return supabase; }
export function getCrudClient() { return supabase; }
export function createClient() { return supabase; }

export default supabase;
