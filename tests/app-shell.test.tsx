// @vitest-environment jsdom
import type { ReactNode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/shared/components/app-shell/AppHeader";
import { AppSidebar } from "@/shared/components/app-shell/AppSidebar";
import {
  getAccountPresentation,
  getPageHeader,
} from "@/shared/config/page-header";
import { isNavigationPathActive } from "@/shared/lib/navigation-state";

const mocks = vi.hoisted(() => ({
  pathname: "/routine",
  user: {
    email: "account@example.test",
    user_metadata: {} as Record<string, unknown>,
  },
}));
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => unknown;
  }) => select({ location: { pathname: mocks.pathname } }),
  Link: ({ to, children, ...props }: { to: string; children?: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/auth/context/AuthProvider", () => ({
  useAuth: () => ({ user: mocks.user }),
}));
afterEach(cleanup);
beforeEach(() => {
  mocks.pathname = "/routine";
  mocks.user.user_metadata = {};
});

describe("Figma Make app shell", () => {
  it("uses the exact desktop widths and supports reducing the sidebar", () => {
    render(<AppSidebar isMobileOpen={false} onMobileClose={vi.fn()} />);
    const sidebar = screen.getByLabelText("Menu principal");
    expect(sidebar.className).toContain("w-[220px]");
    fireEvent.click(screen.getByRole("button", { name: "Réduire le menu" }));
    expect(sidebar.className).toContain("w-14");
    expect(
      screen.getByRole("link", { name: "Routine" }).getAttribute("href"),
    ).toBe("/routine");
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le menu" }));
    expect(sidebar.className).toContain("w-[220px]");
  });

  it("keeps the chantier entry active on a detail route", () => {
    mocks.pathname = "/chantiers/real-id";
    render(<AppSidebar isMobileOpen={false} onMobileClose={vi.fn()} />);
    expect(
      screen
        .getByRole("link", { name: "Chantiers" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(isNavigationPathActive("/chantiers-other", "/chantiers")).toBe(
      false,
    );
  });

  it("shows the actual subpage links in the selected group without restoring Base de prix", () => {
    mocks.pathname = "/tresorerie";
    render(<AppSidebar isMobileOpen={false} onMobileClose={vi.fn()} />);
    expect(
      screen.getByRole("link", { name: "Finances" }).getAttribute("href"),
    ).toBe("/finances");
    expect(
      screen
        .getByRole("link", { name: "Trésorerie" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.queryByText("Base de prix")).toBeNull();
  });

  it("preserves mobile navigation, closing after a link or Escape", () => {
    const close = vi.fn();
    render(<AppSidebar isMobileOpen onMobileClose={close} />);
    const mobile = screen.getByLabelText("Navigation mobile");
    fireEvent.click(within(mobile).getByRole("link", { name: "Routine" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("uses the correct header for the current page and the real account", () => {
    mocks.pathname = "/devis";
    const signOut = vi.fn();
    render(
      <AppHeader
        isMobileNavigationOpen={false}
        onMobileNavigationOpen={vi.fn()}
        onSignOut={signOut}
      />,
    );
    expect(screen.getByRole("heading", { name: "Devis" })).toBeTruthy();
    expect(screen.getByText("account@example.test")).toBeTruthy();
    expect(screen.queryByText("P.-E. Martin")).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Notifications indisponibles" })
        .hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("maps the retained routes to their Figma header groups", () => {
    expect(getPageHeader("/routine/parametres").title).toBe(
      "Personnalisation de la routine",
    );
    expect(getPageHeader("/prospection").title).toBe("Clients & prospects");
    expect(getPageHeader("/remboursements-pe").title).toBe("Finances");
    expect(getPageHeader("/generation-bdc").title).toBe("Génération BDC");
    expect(getPageHeader("/dashboard").title).toBe("Bonjour");
  });

  it("never substitutes the demonstration identity for a missing user profile", () => {
    expect(getAccountPresentation(null)).toEqual({
      displayName: "Mon compte",
      firstName: undefined,
      initials: "—",
    });
    expect(
      getAccountPresentation({ user_metadata: { full_name: "Prénom Nom" } }),
    ).toEqual({
      displayName: "Prénom Nom",
      firstName: "Prénom",
      initials: "PN",
    });
    expect(
      getAccountPresentation({
        email: "account@example.test",
        user_metadata: { full_name: 42 },
      }).displayName,
    ).toBe("account@example.test");
  });
});
