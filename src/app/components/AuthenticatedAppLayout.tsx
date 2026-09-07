import { Outlet } from "@tanstack/react-router";

import { useAuth } from "@/features/auth/context/AuthProvider";
import { AppHeader } from "@/shared/components/app-shell/AppHeader";
import { AppSidebar } from "@/shared/components/app-shell/AppSidebar";

export function AuthenticatedAppLayout() {
  const { signOut } = useAuth();

  return (
    <div className="flex h-svh overflow-hidden">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onSignOut={() => void signOut()} />
        <Outlet />
      </div>
    </div>
  );
}
