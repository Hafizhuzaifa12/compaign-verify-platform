"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import apiClient, { API_BASE, clearTokens, getAccessToken } from "@/lib/api-client";
import type { UserMe } from "@/lib/types/user";
import { ShieldLogoIcon } from "@/components/icons/shield-logo";

/** Use same host as the API client so /uploads/... matches how you call the backend (localhost vs 127.0.0.1). */
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

const NAV_LOGGED_IN: { href: string; label: string; match?: (p: string) => boolean }[] = [
  { href: "/", label: "Home", match: (p) => p === "/" },
  { href: "/dashboard", label: "Dashboard", match: (p) => p === "/dashboard" || p.startsWith("/dashboard/") },
  {
    href: "/campaigns/submit",
    label: "Submit campaign",
    match: (p) => p.startsWith("/campaigns"),
  },
];

const NAV_GUEST: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/auth/login", label: "Login" },
  { href: "/auth/register", label: "Register" },
];

function NavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch
      onClick={onNavigate}
      className={`rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 sm:px-4 ${
        active
          ? "bg-[#F1F5F9] text-[#0F172A]"
          : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null | undefined>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    user &&
    (user.full_name?.trim() || user.display_name?.trim() || user.email);
  const secondaryHandle =
    user &&
    user.display_name?.trim() &&
    user.full_name?.trim() &&
    user.display_name.trim() !== user.full_name.trim()
      ? user.display_name.trim()
      : null;

  const headerTitle =
    primaryLabel && primaryLabel.length > 36
      ? `${primaryLabel.slice(0, 36)}…`
      : primaryLabel;

  const closeMobile = () => setMobileOpen(false);

  const renderNavLinks = (mode: "desktop" | "mobile") => (
    <div
      className={
        mode === "desktop"
          ? "flex flex-wrap items-center gap-2 md:gap-3"
          : "flex flex-col gap-1"
      }
      role="navigation"
      aria-label="Main"
    >
      {user === undefined ? (
        <span className="text-sm text-white/50" aria-live="polite">
          Loading…
        </span>
      ) : user ? (
        <>
          {NAV_LOGGED_IN.map(({ href, label, match }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              active={match ? match(pathname) : pathname === href}
              onNavigate={mode === "mobile" ? closeMobile : undefined}
            />
          ))}
        </>
      ) : (
        <>
          {NAV_GUEST.map(({ href, label }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              active={pathname === href || (href !== "/" && pathname.startsWith(href))}
              onNavigate={mode === "mobile" ? closeMobile : undefined}
            />
          ))}
        </>
      )}
    </div>
  );

  const renderUserBlock = (compact: boolean) =>
    user ? (
      <div
        className={`flex items-center gap-3 ${compact ? "flex-col items-stretch border-t border-white/15 pt-4 md:border-0 md:pt-0" : ""}`}
      >
        <Link
          href="/dashboard"
          onClick={closeMobile}
          className={`flex min-w-0 items-center gap-2 rounded-md py-1 text-white hover:bg-white/10 ${compact ? "justify-start" : ""}`}
        >
          {user.avatar_url ? (
            <img
              src={avatarSrc(user.avatar_url) ?? user.avatar_url}
              alt=""
              width={36}
              height={36}
              referrerPolicy="no-referrer"
              className="h-9 w-9 shrink-0 rounded-full border border-white/20 object-cover ring-2 ring-white/20"
            />
          ) : (
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white ring-2 ring-white/20"
              aria-hidden
            >
              {(primaryLabel || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">
            <span
              className="block truncate"
              title={
                secondaryHandle
                  ? `${primaryLabel ?? ""} (@${secondaryHandle})`
                  : primaryLabel || undefined
              }
            >
              {headerTitle}
            </span>
            {secondaryHandle ? (
              <span className="block truncate text-xs text-white/60" title={`@${secondaryHandle}`}>
                @
                {secondaryHandle.length > 20
                  ? `${secondaryHandle.slice(0, 20)}…`
                  : secondaryHandle}
              </span>
            ) : null}
          </span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="shrink-0 cursor-pointer text-sm font-medium text-[#2563EB] hover:underline"
        >
          Log out
        </button>
      </div>
    ) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--site-nav-bg)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <Link
          href="/"
          prefetch
          className="flex shrink-0 items-center gap-2 text-lg font-semibold text-white transition-opacity hover:opacity-90"
          style={{ fontFamily: "var(--font-sora), ui-sans-serif, system-ui, sans-serif" }}
          onClick={closeMobile}
        >
          <ShieldLogoIcon className="text-white" />
          Campaign Verify
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center px-4 md:flex">
          {renderNavLinks("desktop")}
        </div>

        <div className="hidden md:block">{user === undefined ? null : renderUserBlock(false)}</div>

        <button
          type="button"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-[var(--site-nav-bg)] px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-4">{renderNavLinks("mobile")}</div>
          {user ? <div className="mt-4">{renderUserBlock(true)}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
