"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useChatStore } from "@/lib/chatStore";

interface AuthContextType {
    user: any | null; // Loosen type to allow Mock User
    session: Session | null;
    role: string | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("lyhu_user");
            try { return stored ? JSON.parse(stored) : null; } catch { return null; }
        }
        return null;
    });
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("lyhu_user");
            try { return stored ? JSON.parse(stored).role || "customer" : null; } catch { return null; }
        }
        return null;
    });
    const [isLoading, setIsLoading] = useState(() => {
        if (typeof window !== "undefined") {
            return !localStorage.getItem("lyhu_user"); // Only load if no local user
        }
        return true;
    });

    const checkAuth = async () => {
        try {
            console.log('[AuthProvider] checkAuth started');

            // 🚀 FAST PATH: Try local data first to unblock UI immediately
            if (typeof window !== "undefined") {
                const mockUserStr = localStorage.getItem("lyhu_user");
                if (mockUserStr) {
                    try {
                        const mockUser = JSON.parse(mockUserStr);
                        setUser(mockUser);
                        setRole(mockUser.role || "customer");
                        setIsLoading(false); // Unblock early if we have a trace of a user
                        console.log('[AuthProvider] Early unblock with local user');
                    } catch (e) { }
                }
            }

            let session = null;

            try {
                // 1. Try Supabase with a FAST timeout (3s)
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: null }, error: any }>((_, reject) =>
                    setTimeout(() => reject(new Error('Auth Timeout')), 3000)
                );

                const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
                session = result?.data?.session;
            } catch (authErr) {
                console.warn('[AuthProvider] Supabase session fetch issue:', authErr);
            }

            if (session?.user) {
                setSession(session);
                setUser(session.user);

                if (session.access_token && typeof window !== "undefined") {
                    localStorage.setItem("lyhu_access_token", session.access_token);
                }

                // 2. Quick role fetch with FASTER timeout (2s)
                try {
                    const { data: profile } = await Promise.race([
                        supabase
                            .from("profiles")
                            .select("role")
                            .eq("id", session.user.id)
                            .maybeSingle(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Role Fetch Timeout')), 2000))
                    ]) as any;

                    setRole(profile?.role ?? "customer");
                } catch (roleErr) {
                    console.warn('[AuthProvider] Role fetch timeout, using default or cache');
                    // If we already set a role from localStorage, keep it. Otherwise default to customer.
                    setRole(prev => prev || "customer");
                }
            } else {
                // If no session but we didn't have mock data, clear.
                // or if we had mock data but session is explicitly empty (logged out).
                if (!session) {
                    setUser(null);
                    setRole(null);
                }
            }
        } catch (err) {
            console.error('[AuthProvider] checkAuth catastrophic error:', err);
        } finally {
            setIsLoading(false);
            console.log('[AuthProvider] checkAuth finished');
        }
    };

    useEffect(() => {
        // One-time cleanup for legacy mock data in development
        if (typeof window !== "undefined") {
            const cleanupKeys = [
                "lyhu_all_orders",
                "lyhu_sales_leads_v1",
                "lyhu_telesales_tasks",
                "lyhu_recent_activities"
            ];
            cleanupKeys.forEach(key => localStorage.removeItem(key));
            console.log('[AuthProvider] Legacy mock data keys cleared');
        }

        checkAuth();

        // Listen for Supabase changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
            if (session) {
                setSession(session);
                setUser(session.user);

                // ✅ Set realtime auth token on auth state change
                if (session.access_token) {
                    supabase.realtime.setAuth(session.access_token);
                    if (typeof window !== "undefined") {
                        localStorage.setItem("lyhu_access_token", session.access_token);
                    }
                }

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();
                setRole(profile?.role ?? null);
            } else {
                // If Supabase signs out, check if we fell back to Mock?
                // Usually sign out means clear everything.
                // But let's re-check auth to be safe or just clear.
                // checkAuth(); // Might be recursive loop if not careful.
                // Better to just clear unless we have a "user-updated" event handling mock login.
                setSession(null);
                setUser(null);
                setRole(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Initialize Presence ONCE when user ID changes (SINGLETON)
    useEffect(() => {
        if (user?.id) {
            useChatStore.getState().initPresence(user.id);
        }
        return () => {
            useChatStore.getState().cleanupPresence();
        };
    }, [user?.id]);

    const signOut = async () => {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
            localStorage.removeItem("lyhu_user");
        }
        setUser(null);
        setSession(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, role, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
