import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  isSupabaseConfigured,
  supabase,
} from "@/features/auth/api/supabase-client";

type AuthStatus =
  "loading" | "authenticated" | "unauthenticated" | "unconfigured";

type AuthContextValue = {
  session: Session | null;
  status: AuthStatus;
  user: User | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const setCurrentSession = (nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    };

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setCurrentSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      setCurrentSession(sessionData.session);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      user: session?.user ?? null,
      async signInWithPassword(email, password) {
        if (!supabase) {
          throw new Error(
            "L'authentification Supabase n'est pas encore configurée.",
          );
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error("Identifiants invalides ou accès non autorisé.");
        }
      },
      async signOut() {
        if (!supabase) {
          return;
        }

        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }
      },
    }),
    [session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider.");
  }

  return context;
}
