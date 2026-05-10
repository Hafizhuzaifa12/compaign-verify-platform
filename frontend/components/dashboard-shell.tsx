"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import apiClient, { API_BASE, clearTokens, getAccessToken } from "@/lib/api-client";
import type { UserMe } from "@/lib/types/user";
import { ShieldLogoIcon } from "@/components/icons/shield-logo";
import { SidebarNavIcon, type SidebarNavIconName } from "@/components/sidebar-nav-icons";

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

const NAV: { href: string; label: string; icon: SidebarNavIconName; match: (p: string) => boolean }[] = [
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

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    apiClient
      .get<UserMe>("/users/me")
      .then((res) => {
        if (cancelled) return;
        if (res.data.needs_profile_completion) {
          router.replace("/auth/complete-profile");
          return;
        }
        setUser(res.data);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) router.replace("/auth/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  useEffect(() => {
    setMobileNav(false);
  }, [pathname]);

  const onLogout = () => {
    clearTokens();
    router.push("/");
    router.refresh();
  };

  const primaryLabel =
    user && (user.full_name?.trim() || user.display_name?.trim() || user.email);
  const secondaryHandle =
    user &&
    user.display_name?.trim() &&
    user.full_name?.trim() &&
    user.display_name.trim() !== user.full_name.trim()
      ? user.display_name.trim()
      : null;

  const renderUserBlock = () =>
    user ? (
      <div className="flex max-w-[min(52vw,220px)] items-center gap-2 sm:max-w-xs md:max-w-none md:gap-3">
        <Link
          href="/dashboard"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 text-white/90 hover:bg-white/10"
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
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white ring-2 ring-white/20"
              aria-hidden
            >
              {(primaryLabel || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm font-medium text-white">{primaryLabel}</span>
            {secondaryHandle ? (
              <span className="block truncate text-xs text-white/60">@{secondaryHandle}</span>
            ) : null}
          </span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="shrink-0 cursor-pointer whitespace-nowrap text-sm font-medium text-sky-200 underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          Log out
        </button>
      </div>
    ) : null;

  const sidebarNav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {NAV.map(({ href, label, match, icon }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            prefetch
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 md:text-[14px] ${
              active
                ? "bg-white/15 font-medium text-white"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            aria-current={active ? "page" : undefined}
          >
            <span className={active ? "text-white" : "text-white/55"} aria-hidden>
              <SidebarNavIcon name={icon} />
            </span>
            <span className="min-w-0 truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  if (!ready || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[var(--surface-page)] text-sm text-[var(--text-muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <header className="sticky top-0 z-50 flex h-[60px] shrink-0 items-center justify-between border-b border-white/10 bg-[var(--site-nav-bg)] px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-white transition-all duration-200 hover:bg-white/10 md:hidden"
            aria-expanded={mobileNav}
            aria-label={mobileNav ? "Close menu" : "Open menu"}
            onClick={() => setMobileNav((o) => !o)}
          >
            {mobileNav ? (
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
            href="/dashboard"
            className="flex min-w-0 items-center gap-2 text-lg font-semibold text-white transition-opacity hover:opacity-90"
            style={{ fontFamily: "var(--font-sora), ui-sans-serif, system-ui, sans-serif" }}
          >
            <ShieldLogoIcon className="shrink-0 text-white" />
            <span className="truncate">Campaign Verify</span>
          </Link>
        </div>
        <div className="flex min-w-0 items-center justify-end">{renderUserBlock()}</div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className="sticky top-[60px] hidden h-[calc(100vh-60px)] w-[240px] shrink-0 overflow-y-auto border-r border-white/10 bg-[var(--site-nav-bg)] px-3 py-4 md:block"
          aria-label="Sidebar"
        >
          {sidebarNav()}
        </aside>

        <main className="animate-main-fade min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>

      {mobileNav ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] flex-col bg-[var(--site-nav-bg)] px-3 py-4 shadow-xl md:hidden">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-white/80" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
                Menu
              </span>
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white hover:bg-white/10"
                aria-label="Close"
                onClick={() => setMobileNav(false)}
              >
                ✕
              </button>
            </div>
            {sidebarNav(() => setMobileNav(false))}
          </aside>
        </>
      ) : null}
    </div>
  );
}
