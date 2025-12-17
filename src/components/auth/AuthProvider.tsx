"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/auth"; // Hybrid helper

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
        setIsLoading(true);
        // 1. Try Supabase
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            setSession(session);
            setUser(session.user);

            // Fetch role from profiles
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", session.user.id)
                .single();
            setRole(profile?.role ?? null);
        } else {
            // 2. Try Mock/Local
            const mockUser = await getCurrentUser(); // This checks Supabase then Local
            // getCurrentUser already returns Supabase user if exists, or Mock user
            // If session is null but getCurrentUser returns something, it must be Mock (or we just missed the session)

            if (mockUser && !mockUser.app_metadata) {
                // It's a Mock User (User interface from usersStore)
                // Map to something usable
                setUser(mockUser);
                setSession(null);
                setRole(mockUser.role);
            } else {
                setSession(null);
                setUser(null);
                setRole(null);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        checkAuth();

        // Listen for Supabase changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                setSession(session);
                setUser(session.user);
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

        // Listen for Mock Login changes
        const handleMockUpdate = () => {
            checkAuth();
        };
        window.addEventListener("user-updated", handleMockUpdate);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener("user-updated", handleMockUpdate);
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
            localStorage.removeItem("lyhu_user");
            window.dispatchEvent(new Event("user-updated"));
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
