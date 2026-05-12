"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatRelative } from "@/lib/utils";
import { api, type Campaign } from "@/lib/api-client";
import { getStoredToken, useCurrentUser } from "@/lib/auth";
import {
  getLastSeenAt,
  getNotificationPrefs,
  markAllNotificationsSeen,
  type NotificationKey,
} from "@/lib/settings-store";

interface Notification {
  id: string;
  campaign_id: string;
  prefKey: NotificationKey;
  title: string;
  description: string;
  ts: number;
  tone: "good" | "warn" | "bad" | "info";
  Icon: typeof ShieldCheck;
}

const STATUS_TO_NOTIFICATION: Record<
  string,
  {
    prefKey: NotificationKey;
    title: (c: Campaign) => string;
    tone: "good" | "warn" | "bad" | "info";
    Icon: typeof ShieldCheck;
  } | undefined
> = {
  verified: {
    prefKey: "verification_completed",
    title: (c) => `${c.brand} · ${c.title} was verified`,
    tone: "good",
    Icon: ShieldCheck,
  },
  flagged: {
    prefKey: "campaign_flagged",
    title: (c) => `${c.brand} · ${c.title} was flagged`,
    tone: "warn",
    Icon: AlertTriangle,
  },
  rejected: {
    prefKey: "campaign_rejected",
    title: (c) => `${c.brand} · ${c.title} was rejected`,
    tone: "bad",
    Icon: XCircle,
  },
};

export function NotificationBell() {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lastSeen, setLastSeen] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setLastSeen(getLastSeenAt(user.id));
    const token = getStoredToken();
    if (!token) return;
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const list = await api.campaigns.list(token);
        if (cancelled) return;
        setCampaigns(list);
        if (list.some((c) => c.status === "analyzing" || c.status === "pending")) {
          timer = window.setTimeout(load, 3000);
        }
      } catch {
        /* silent — bell is non-critical */
      }
    };
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const notifications = useMemo<Notification[]>(() => {
    if (!user) return [];
    const prefs = getNotificationPrefs(user.id);
    const list: Notification[] = [];
    for (const c of campaigns) {
      const meta = STATUS_TO_NOTIFICATION[c.status];
      if (!meta) continue;
      // respect user's in_app pref
      if (!prefs[meta.prefKey]?.in_app) continue;
      const eventTs = c.verified_at
        ? new Date(c.verified_at).getTime()
        : new Date(c.submitted_at).getTime();
      list.push({
        id: `${c.id}:${c.status}`,
        campaign_id: c.id,
        prefKey: meta.prefKey,
        title: meta.title(c),
        description:
          c.status === "verified"
            ? `Authenticity ${c.authenticity_score.toFixed(1)}${c.blockchain_tx ? " · anchored on-chain" : ""}`
            : c.status === "flagged"
              ? `Risk ${c.deepfake_score.toFixed(1)} — needs human review`
              : `Below authenticity threshold (${c.authenticity_score.toFixed(1)})`,
        ts: eventTs,
        tone: meta.tone,
        Icon: meta.Icon,
      });
    }
    // also surface analyzing as info if user has any in-app pref on
    for (const c of campaigns) {
      if (c.status === "analyzing") {
        list.push({
          id: `${c.id}:analyzing`,
          campaign_id: c.id,
          prefKey: "verification_completed",
          title: `${c.brand} · ${c.title} is analyzing`,
          description: "AI signals running — this usually takes a few seconds.",
          ts: new Date(c.submitted_at).getTime(),
          tone: "info",
          Icon: Clock,
        });
      }
    }
    return list.sort((a, b) => b.ts - a.ts).slice(0, 20);
  }, [campaigns, user]);

  const unread = useMemo(
    () => notifications.filter((n) => n.ts > lastSeen).length,
    [notifications, lastSeen]
  );

  const handleOpen = () => {
    setOpen((o) => {
      const next = !o;
      // mark seen when opening
      if (next && user && notifications.length > 0) {
        const newest = Math.max(...notifications.map((n) => n.ts));
        markAllNotificationsSeen(user.id, newest);
        setLastSeen(newest);
      }
      return next;
    });
  };

  const handleMarkAllRead = () => {
    if (!user || notifications.length === 0) return;
    const newest = Math.max(...notifications.map((n) => n.ts));
    markAllNotificationsSeen(user.id, newest);
    setLastSeen(newest);
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        onClick={handleOpen}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] px-1 text-[10px] font-semibold text-white shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.8)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Notifications</span>
              {unread > 0 ? (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {unread} new
                </span>
              ) : null}
            </div>
            {notifications.length > 0 ? (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium">You are all caught up</p>
                <p className="text-xs text-muted-foreground">
                  Campaign events you have enabled in Settings → Notifications
                  will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n) => {
                  const isUnread = n.ts > lastSeen;
                  return (
                    <li key={n.id}>
                      <Link
                        href={`/campaigns/${n.campaign_id}`}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                          isUnread && "bg-primary/[0.04]"
                        )}
                      >
                        <ToneIcon tone={n.tone} Icon={n.Icon} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-medium leading-snug">
                              {n.title}
                            </div>
                            {isUnread ? (
                              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {n.description}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatRelative(new Date(n.ts).toISOString())}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border bg-muted/30 px-4 py-2 text-center">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Notification preferences
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToneIcon({
  tone,
  Icon,
}: {
  tone: "good" | "warn" | "bad" | "info";
  Icon: typeof ShieldCheck;
}) {
  const cls =
    tone === "good"
      ? "bg-success/15 text-success"
      : tone === "warn"
        ? "bg-warning/15 text-warning"
        : tone === "bad"
          ? "bg-danger/15 text-danger"
          : "bg-primary/15 text-primary";
  return (
    <div
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
        cls
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}
