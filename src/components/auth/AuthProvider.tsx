"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
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

    const isInitialized = useRef(false);
    const authCheckInProgress = useRef(false);

    const checkAuth = useCallback(async () => {
        if (authCheckInProgress.current) return;
        authCheckInProgress.current = true;
        try {
            console.log('[AuthProvider] checkAuth started');

            // 🚀 FAST PATH: Load from localStorage but DO NOT set isLoading(false) here
            // setting isLoading(false) here causes Guard to trigger before Role is confirmed from server
            if (typeof window !== "undefined") {
                const mockUserStr = localStorage.getItem("lyhu_user");
                if (mockUserStr) {
                    try {
                        const mockUser = JSON.parse(mockUserStr);
                        setUser(mockUser);
                        // Do NOT setRole or setIsLoading(false) yet to avoid mismatch
                        console.log('[AuthProvider] Pre-loaded local user data');
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
            authCheckInProgress.current = false;
            setIsLoading(false);
            isInitialized.current = true;
        }
    }, [user?.id]);

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

        if (!isInitialized.current) {
            checkAuth();
        }

        // Listen for Supabase changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
            if (session) {
                setSession(session);
                const userObj = {
                    id: session.user.id,
                    email: session.user.email,
                    ...(session.user.user_metadata || {})
                };

                // ✅ ONLY update user state if the ID or metadata actually changed
                setUser((prev: any) => {
                    if (prev?.id === userObj.id && JSON.stringify(prev) === JSON.stringify(userObj)) return prev;
                    return userObj;
                });

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

                const newRole = profile?.role ?? null;
                setRole(prev => {
                    if (prev === newRole) return prev;
                    return newRole;
                });
            } else {
                setSession(null);
                setUser(null);
                setRole(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [checkAuth, isInitialized]);

    // Initialize Presence ONCE when user ID changes (SINGLETON)
    useEffect(() => {
        if (user?.id) {
            useChatStore.getState().initPresence(user.id);

            // 🚀 REAL-TIME ROLE SYNC: Watch for profile updates
            console.log('[AuthProvider] Subscribing to profile changes for:', user.id);
            const channelName = `auth-profile-sync-${user.id}`;
            const profileSubscription = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`,
                    },
                    (payload: any) => {
                        console.log('[AuthProvider] Profile updated in Realtime:', payload.new);
                        const newSyncRole = payload.new.role;
                        // Avoid direct role dependency in useEffect to prevent loop
                        // instead use internal comparison inside setter
                        setRole(prev => {
                            if (newSyncRole && newSyncRole !== prev) {
                                console.log(`[AuthProvider] Role synced from ${prev} to ${newSyncRole}`);
                                // Update local storage too
                                const updatedUser = { ...user, role: newSyncRole };
                                localStorage.setItem("lyhu_user", JSON.stringify(updatedUser));
                                return newSyncRole;
                            }
                            return prev;
                        });
                    }
                )
                .subscribe();

            return () => {
                console.log('[AuthProvider] Cleanup profile sync channel:', channelName);
                supabase.removeChannel(profileSubscription);
            };
        }
        return () => {
            useChatStore.getState().cleanupPresence();
        };
    }, [user?.id]); // ❌ Removed 'role' from dependency to break re-subscription loop

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
