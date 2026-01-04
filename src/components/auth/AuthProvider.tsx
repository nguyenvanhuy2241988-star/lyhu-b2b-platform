"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useChatStore } from "@/lib/chatStore";
import { toast } from "sonner"; // Optional: Notify user on timeout

interface AuthContextType {
    user: any | null;
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

const AUTH_TIMEOUT_MS = 15000; // 15 seconds max wait

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

        console.log('[AuthProvider] checkAuth started');

        // 🚀 FAST PATH: Optimistic UI from localStorage
        // Allows rendering UI immediately while background verification happens
        if (typeof window !== "undefined") {
            const mockUserStr = localStorage.getItem("lyhu_user");
            if (mockUserStr) {
                try {
                    const mockUser = JSON.parse(mockUserStr);
                    setUser(mockUser);
                    // FIXED: Also load role from cache so we don't fall back to 'customer' on timeout
                    if (mockUser.role) {
                        console.log('[AuthProvider] Restore cached role:', mockUser.role);
                        setRole(mockUser.role);
                    }
                    // Note: We don't set isLoading(false) here yet to allow 
                    // the real check to confirm valid session, OR timeout to occur.
                } catch (e) { }
            }
        }

        try {
            // 🛑 TIMEOUT PROTECTION 
            // Race between Supabase and a 15s timer.
            const timeoutPromise = new Promise<{ data: { session: null }, error: any }>((_, reject) =>
                setTimeout(() => reject(new Error("Auth Timeout")), AUTH_TIMEOUT_MS)
            );

            // Fetch Session with Timeout
            const { data: { session: currentSession }, error: authError } = await Promise.race([
                supabase.auth.getSession(),
                timeoutPromise
            ]) as any;

            if (authError) {
                console.warn('[AuthProvider] Session fetch error:', authError.message);
                if (authError.message === "Auth Timeout") {
                    toast.warning("Kết nối chậm, đang thử lại...");
                    // Don't throw, just let it settle as null/guest so app doesn't hang
                }
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

                // Fetch Role (Also with simple fallback, no strict timeout needed as it's secondary)
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
                // Not logged in or Error
                setUser(null);
                setRole(null);
                if (typeof window !== "undefined") {
                    localStorage.removeItem("lyhu_user");
                    localStorage.removeItem("lyhu_access_token");
                }
            }
        } catch (err: any) {
            console.error('[AuthProvider] Auth Check Fatal:', err);
            // If it was a timeout that threw up to here
            if (err.message === "Auth Timeout") {
                toast.error("Không thể kết nối đến máy chủ xác thực.");
            }
        } finally {
            authCheckInProgress.current = false;
            setIsLoading(false); // ✅ GUARANTEED to run
            isInitialized.current = true;
        }
    }, []);

    useEffect(() => {
        if (!isInitialized.current) {
            checkAuth();
        }

        // Listen for Supabase changes (Login/Logout events)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
            if (session) {
                setSession(session);
                const userObj = {
                    id: session.user.id,
                    email: session.user.email,
                    ...(session.user.user_metadata || {})
                };

                setUser((prev: any) => {
                    if (prev?.id === userObj.id && JSON.stringify(prev) === JSON.stringify(userObj)) return prev;
                    return userObj;
                });

                if (session.access_token) {
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
                setRole(prev => (prev === newRole ? prev : newRole));
            } else {
                setSession(null);
                setUser(null);
                setRole(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [checkAuth]);

    // Initialize Presence & Role Sync
    useEffect(() => {
        // IMPORTANT: Only start Realtime if we have a valid confirmed SESSION.
        // Starting it with just 'user' (from localStorage) can race with initial auth check
        // and cause the HTTP request to hang/timeout.
        if (user?.id && session) {
            useChatStore.getState().initPresence(user.id);

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
                        const newSyncRole = payload.new.role;
                        setRole(prev => {
                            if (newSyncRole && newSyncRole !== prev) {
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
                supabase.removeChannel(profileSubscription);
            };
        }
    }, [user]);

    const signOut = async () => {
        setIsLoading(true);
        try {
            await supabase.auth.signOut();
        } catch (e) { console.error(e) }

        if (typeof window !== "undefined") {
            localStorage.removeItem("lyhu_user");
            localStorage.removeItem("lyhu_access_token");
        }
        setUser(null);
        setSession(null);
        setRole(null);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, session, role, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
