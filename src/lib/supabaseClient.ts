'use client';

import { createBrowserClient } from '@supabase/ssr';

// Use dummy values if env vars are missing to prevent crash during Next.js build prerendering.
// These variable must be present in Vercel to work at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

const isConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const isServer = typeof window === 'undefined';

if (!isConfigured && !isServer) {
    console.warn("Supabase environment variables are missing. Please configure them in your .env file or Vercel dashboard.");
}

// SEPARATE CLIENTS NO LONGER NEEDED - USE SINGLETON
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

// No-op proxy for SSR: returns safe defaults for any chained method call
// This prevents 500 errors when Next.js tries to server-render pages
function createSSRProxy(): any {
    const handler: ProxyHandler<any> = {
        get(_target, prop) {
            // Common Supabase properties that return data
            if (prop === 'auth') return createSSRProxy();
            if (prop === 'data') return null;
            if (prop === 'error') return null;
            if (prop === 'count') return 0;
            // toJSON / toString for serialization
            if (prop === 'toJSON') return () => null;
            if (prop === 'then') return undefined; // Not a thenable
            // All other method calls return a chainable proxy
            return (..._args: any[]) => {
                const result = createSSRProxy();
                // Make it awaitable - resolve with { data: null, error: null }
                result.then = (resolve: any) => resolve({ data: null, error: null, count: 0 });
                return result;
            };
        }
    };
    return new Proxy({}, handler);
}

export function getSupabase() {
    // During SSR, return a no-op proxy to prevent crashes
    if (isServer) {
        return createSSRProxy() as ReturnType<typeof createBrowserClient>;
    }
    if (!supabaseInstance) {
        supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
}

// Client for Realtime and CRUD
export const supabase = getSupabase();

// Backward compatibility helper
export function getRealtimeClient() { return getSupabase(); }
export function getCrudClient() { return getSupabase(); }
export function createClient() { return getSupabase(); }

export default supabase;
