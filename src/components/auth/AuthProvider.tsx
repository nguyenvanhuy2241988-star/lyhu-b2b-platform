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
    const [user, setUser] = useState<any | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

            // 1. Gọi Supabase KHÔNG TIMEOUT
            // Tháo bỏ hoàn toàn Promise.race để tránh lỗi "Auth Timeout" khi mạng chậm
            const { data: { session: currentSession }, error: authError } = await supabase.auth.getSession();

            if (authError) {
                console.warn('[AuthProvider] Supabase session fetch issue:', authError.message);
            }

            if (currentSession?.user) {
                setSession(currentSession);
                const userObj = {
                    id: currentSession.user.id,
                    email: currentSession.user.email,
                    ...(currentSession.user.user_metadata || {})
                };
                setUser(userObj);

                if (typeof window !== "undefined") {
                    localStorage.setItem("lyhu_user", JSON.stringify(userObj));
                    if (currentSession.access_token) {
                        localStorage.setItem("lyhu_access_token", currentSession.access_token);
                    }
                }

                // 2. Role fetch không timeout
                try {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", currentSession.user.id)
                        .maybeSingle();

                    setRole(profile?.role ?? "customer");
                } catch (roleErr) {
                    console.warn('[AuthProvider] Role fetch failed, using fallback');
                    setRole(prev => prev || "customer");
                }
            } else {
                // EXPLICIT null from getSession means logged out
                setUser(null);
                setRole(null);
                if (typeof window !== "undefined") {
                    localStorage.removeItem("lyhu_user");
                    localStorage.removeItem("lyhu_access_token");
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
                const userObj = {
                    id: session.user.id,
                    email: session.user.email,
                    ...(session.user.user_metadata || {})
                };
                setUser(userObj);

                // ✅ Set realtime auth token on auth state change
                if (session.access_token) {
                    console.log('[AuthProvider] Auth state change: SETTING REALTIME AUTH', session.access_token.substring(0, 10) + '...');
                    supabase.realtime.setAuth(session.access_token);
                    if (typeof window !== "undefined") {
                        localStorage.setItem("lyhu_user", JSON.stringify(userObj));
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
