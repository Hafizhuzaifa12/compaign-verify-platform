"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import apiClient, { API_BASE, clearTokens, getAccessToken } from "@/lib/api-client";
import type { UserMe } from "@/lib/types/user";
import { ShieldLogoIcon } from "@/components/icons/shield-logo";
import { SiteFooter } from "@/components/site-footer";
import { SidebarNavIcon, type SidebarNavIconName } from "@/components/sidebar-nav-icons";
import { cn } from "@/lib/utils";

type NavDef = { href: string; label: string; icon: SidebarNavIconName; match: (p: string) => boolean };

function avatarSrc(url: string | null): string | null {
  if (!url) return null;
  try {
    const origin = new URL(API_BASE).origin;
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/uploads")) return url;
    return `${origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

const GUEST_NAV: NavDef[] = [
  { href: "/", label: "Home", icon: "home", match: (p) => p === "/" },
  { href: "/auth/login", label: "Login", icon: "login", match: (p) => p.startsWith("/auth/login") },
  { href: "/auth/register", label: "Register", icon: "register", match: (p) => p.startsWith("/auth/register") },
];

const AUTH_NAV: NavDef[] = [
  { href: "/", label: "Home", icon: "home", match: (p) => p === "/" },
  { href: "/dashboard", label: "Overview", icon: "overview", match: (p) => p === "/dashboard" },
  {
    href: "/dashboard/campaigns",
    label: "My Campaigns",
    icon: "campaigns",
    match: (p) => p === "/dashboard/campaigns" || p.startsWith("/dashboard/campaigns/"),
  },
  { href: "/campaigns/submit", label: "Submit Campaign", icon: "submit", match: (p) => p.startsWith("/campaigns/submit") },
  {
    href: "/dashboard/status",
    label: "Verification Status",
    icon: "status",
    match: (p) => p === "/dashboard/status" || p.startsWith("/dashboard/status/"),
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: "analytics",
    match: (p) => p === "/dashboard/analytics" || p.startsWith("/dashboard/analytics/"),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: "settings",
    match: (p) => p === "/dashboard/settings" || p.startsWith("/dashboard/settings/"),
  },
];

function AppSidebarNavLinks({
  items,
  pathname,
  narrow,
  onPick,
}: {
  items: NavDef[];
  pathname: string;
  narrow: boolean;
  onPick?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-2" aria-label="Main">
      {items.map(({ href, label, match, icon }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            prefetch
            title={label}
            onClick={onPick}
            className={cn(
              "flex items-center rounded-lg py-2.5 text-sm transition-colors duration-150 md:text-[14px]",
              narrow ? "justify-center px-2" : "gap-3 px-3",
              active ? "bg-white/15 font-medium text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
            )}
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            aria-current={active ? "page" : undefined}
          >
            <span className={cn("shrink-0", active ? "text-white" : "text-white/55")} aria-hidden>
              <SidebarNavIcon name={icon} />
            </span>
            {narrow ? <span className="sr-only">{label}</span> : <span className="min-w-0 truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function PublicSidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null | undefined>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    setUser(undefined);
    apiClient
      .get<UserMe>("/users/me")
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const onLogout = () => {
    clearTokens();
    setUser(null);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  };

  const primaryLabel =
    user && (user.full_name?.trim() || user.display_name?.trim() || user.email);

  const userFooter =
    user != null ? (
      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="flex flex-col gap-2 px-2">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-lg py-2 text-white/90 hover:bg-white/10",
              narrow ? "justify-center" : "px-2",
            )}
          >
            {user.avatar_url ? (
              <img
                src={avatarSrc(user.avatar_url) ?? user.avatar_url}
                alt=""
                width={32}
                height={32}
                referrerPolicy="no-referrer"
                className="h-8 w-8 shrink-0 rounded-full border border-white/20 object-cover ring-2 ring-white/20"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white ring-2 ring-white/20">
                {(primaryLabel || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            {!narrow ? (
              <span className="min-w-0 truncate text-sm font-medium text-white">{primaryLabel}</span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="cursor-pointer rounded-lg py-2 text-left text-sm font-medium text-[var(--brand-primary)] transition-colors hover:bg-white/5 hover:underline"
          >
            {narrow ? <span title="Log out">⎋</span> : "Log out"}
          </button>
        </div>
      </div>
    ) : !user && user !== undefined ? (
      <div className="mt-auto border-t border-white/10 px-3 py-4">
        {!narrow ? (
          <p className="text-xs leading-relaxed text-white/50" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Sign in to submit and track campaigns.
          </p>
        ) : null}
      </div>
    ) : (
      <div className="mt-auto border-t border-white/10 p-4 text-xs text-white/40">Loading…</div>
    );

  const sidebarInner = (opts: { narrow: boolean; onPick?: () => void }) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("mb-4 flex items-center", opts.narrow ? "flex-col gap-2 px-1" : "justify-between px-2")}>
        <Link
          href="/"
          onClick={opts.onPick}
          className={cn(
            "flex items-center gap-2 font-semibold text-white transition-opacity hover:opacity-90",
            opts.narrow && "justify-center",
          )}
          style={{ fontFamily: "var(--font-sora), ui-sans-serif, system-ui, sans-serif" }}
        >
          <ShieldLogoIcon className="shrink-0 text-white" />
          {!opts.narrow ? <span className="truncate">Campaign Verify</span> : null}
        </Link>
        <button
          type="button"
          onClick={() => setNarrow((n) => !n)}
          className="hidden cursor-pointer rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white md:block"
          aria-pressed={opts.narrow}
          title={opts.narrow ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M17 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {user != null ? (
        <AppSidebarNavLinks items={AUTH_NAV} pathname={pathname} narrow={opts.narrow} onPick={opts.onPick} />
      ) : user === null ? (
        <AppSidebarNavLinks items={GUEST_NAV} pathname={pathname} narrow={opts.narrow} onPick={opts.onPick} />
      ) : (
        <div className="px-2 py-4 text-sm text-white/50">…</div>
      )}

      {user !== undefined ? userFooter : null}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)] md:flex-row">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[var(--site-nav-bg)] px-3 md:hidden">
        <button
          type="button"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-white hover:bg-white/10"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 truncate text-base font-semibold text-white"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          <ShieldLogoIcon className="shrink-0 text-white" />
          <span className="truncate">Campaign Verify</span>
        </Link>
        <span className="w-10" />
      </div>

      <aside
        className={cn(
          "hidden shrink-0 border-r border-white/10 bg-[var(--site-nav-bg)] py-4 transition-[width] duration-200 ease-out md:flex md:flex-col",
          narrow ? "w-[72px]" : "w-[260px]",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{sidebarInner({ narrow })}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="animate-main-fade flex-1">{children}</main>
        <SiteFooter />
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(300px,90vw)] flex-col bg-[var(--site-nav-bg)] py-4 shadow-xl md:hidden">
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="text-sm font-semibold text-white/80" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
                Menu
              </span>
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white hover:bg-white/10"
                aria-label="Close"
                onClick={() => setMobileOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-1">{sidebarInner({ narrow: false, onPick: () => setMobileOpen(false) })}</div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
