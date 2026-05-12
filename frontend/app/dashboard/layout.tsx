"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  ListChecks,
  BarChart3,
  Settings,
  Plus,
  Search,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCurrentUser, getInitials } from "@/lib/auth";
import { getUserAvatar } from "@/lib/settings-store";
import { NotificationBell } from "@/components/NotificationBell";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: ListChecks },
  { href: "/dashboard/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useCurrentUser();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  const displayName = user?.full_name || "Loading…";
  const orgLine = user?.organization || user?.email || "";
  const initial = getInitials(user?.full_name);
  const avatar = user ? getUserAvatar(user.id) : null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card/40 lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.7)]">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">Verit</span>
        </div>

        <div className="px-3 pt-4">
          <Link href="/campaigns/submit">
            <Button variant="gradient" className="w-full justify-start">
              <Plus className="h-4 w-4" /> New verification
            </Button>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? path === "/dashboard"
                : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] text-sm font-semibold text-white">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{displayName}</div>
              <div className="truncate text-xs text-muted-foreground">
                {orgLine}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 h-16 border-b border-border glass">
          <div className="flex h-full items-center gap-3 px-4 md:px-6">
            <div className="flex max-w-md flex-1 items-center">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns, verifiers, hashes…"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <Link href="/campaigns/submit" className="hidden md:inline-flex">
                <Button variant="gradient" size="sm">
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
