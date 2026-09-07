import { Outlet } from "@tanstack/react-router";
import { useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import { AppHeader } from "@/shared/components/app-shell/AppHeader";
import { AppSidebar } from "@/shared/components/app-shell/AppSidebar";

export function AuthenticatedAppLayout() {
  const { signOut } = useAuth();
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);

  return (
    <div className="flex h-svh overflow-hidden">
      <AppSidebar
        isMobileOpen={isMobileNavigationOpen}
        onMobileClose={() => setIsMobileNavigationOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          isMobileNavigationOpen={isMobileNavigationOpen}
          onMobileNavigationOpen={() => setIsMobileNavigationOpen(true)}
          onSignOut={() => void signOut()}
        />
        <Outlet />
      </div>
    </div>
  );
}
