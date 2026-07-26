"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase credentials not configured in .env.local");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) {
      toast.error(`Google Sign In failed: ${error.message}`);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase credentials not configured in .env.local");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) {
      toast.error(`Login failed: ${error.message}`);
      throw error;
    }
    toast.success("Successfully signed in");
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase credentials not configured in .env.local");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) {
      toast.error(`Registration failed: ${error.message}`);
      throw error;
    }
    toast.success("Registration email sent! Please check your inbox.");
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Sign out error: ${error.message}`);
    } else {
      toast.success("Signed out");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
