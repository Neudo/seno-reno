import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";

function SessionResolution() {
  return <div className="min-h-svh bg-seno-50" aria-busy="true" />;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return <SessionResolution />;
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function RequireAuthentication({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return <SessionResolution />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

export function AuthEntryRedirect() {
  const { status } = useAuth();

  if (status === "loading") {
    return <SessionResolution />;
  }

  return (
    <Navigate
      to={status === "authenticated" ? "/dashboard" : "/signin"}
      replace
    />
  );
}
