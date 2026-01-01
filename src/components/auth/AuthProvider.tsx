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
            setIsLoading(true);

            // 1. Try Supabase
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('[AuthProvider] getSession result:', session ? 'Session found' : 'No session', sessionError);

            if (session?.user) {
                setSession(session);
                setUser(session.user);

                // ✅ IMPORTANT: set realtime auth token for postgres_changes
                if (session.access_token) {
                    supabase.realtime.setAuth(session.access_token);
                    if (typeof window !== "undefined") {
                        localStorage.setItem("lyhu_access_token", session.access_token);
                    }
                }

                console.log('[AuthProvider] Fetching profile for:', session.user.id);

                // Fetch role from profiles
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();

                console.log('[AuthProvider] Profile fetch result:', profile, profileError);
                setRole(profile?.role ?? null);
            } else {
                // 2. Fallback to localStorage mock user
                if (typeof window !== "undefined") {
                    const mockUserStr = localStorage.getItem("lyhu_user");
                    if (mockUserStr) {
                        try {
                            const mockUser = JSON.parse(mockUserStr);
                            setUser(mockUser);
                            setRole(mockUser.role ?? null);
                            console.log('[AuthProvider] Mock user loaded:', mockUser.role);
                        } catch (e) {
                            console.error("[AuthProvider] Failed to parse mock user:", e);
                            setUser(null);
                            setRole(null);
                        }
                    } else {
                        setSession(null);
                        setUser(null);
                        setRole(null);
                    }
                } else {
                    setSession(null);
                    setUser(null);
                    setRole(null);
                }
            }
        } catch (err) {
            console.error('[AuthProvider] checkAuth CRASHED:', err);
        } finally {
            console.log('[AuthProvider] checkAuth finished, setting isLoading = false');
            setIsLoading(false);
        }
    };

    useEffect(() => {
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
