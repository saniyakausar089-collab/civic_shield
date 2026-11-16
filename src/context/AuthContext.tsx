import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import {
  supabase,
  getProfile,
  upsertProfile,
  hasStoredSession,
  type Profile,
  type UserRole,
} from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: { fullName?: string; role?: UserRole; organization?: string }
  ) => Promise<{ error: Error | null; user?: User | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // If no auth token is stored in localStorage, immediately start as false (no waiting)
  const [isLoading, setIsLoading] = useState<boolean>(() => hasStoredSession());

  // Helper to load profile
  const fetchAndSetProfile = useCallback(async (currentUser: User) => {
    try {
      const p = await getProfile(currentUser.id);
      if (p) {
        setProfile(p);
      } else {
        // Fallback default profile from user metadata if table row doesn't exist yet
        const meta = currentUser.user_metadata || {};
        const fallbackProfile: Profile = {
          id: currentUser.id,
          email: currentUser.email || "",
          full_name: meta.full_name || currentUser.email?.split("@")[0] || "Operator",
          role: (meta.role as UserRole) || "analyst",
          organization: meta.organization || "Civic Infrastructure Command",
          created_at: currentUser.created_at,
        };
        setProfile(fallbackProfile);
      }
    } catch (e) {
      console.warn("Could not load user profile:", e);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Ensure isLoading NEVER gets stuck if network stalls
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 1200);

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Supabase getSession notice:", error.message);
        }
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await fetchAndSetProfile(initialSession.user);
          }
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchAndSetProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAndSetProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { error };

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchAndSetProfile(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: { fullName?: string; role?: UserRole; organization?: string }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: metadata?.fullName || "",
            role: metadata?.role || "analyst",
            organization: metadata?.organization || "Civic Infrastructure Command",
          },
        },
      });

      if (error) return { error, user: null };

      if (data.user) {
        setUser(data.user);
        setSession(data.session);

        // Also proactively write/upsert to profiles table
        await upsertProfile({
          id: data.user.id,
          email: data.user.email || email,
          full_name: metadata?.fullName || email.split("@")[0],
          role: metadata?.role || "analyst",
          organization: metadata?.organization || "Civic Infrastructure Command",
        });

        await fetchAndSetProfile(data.user);
      }

      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err, user: null };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut notice:", e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchAndSetProfile(user);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: Boolean(user),
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

