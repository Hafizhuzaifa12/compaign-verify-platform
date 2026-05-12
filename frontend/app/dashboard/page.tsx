"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "./components/StatCard";
import { CampaignCard } from "./components/CampaignCard";
import { api, ApiError, type Campaign } from "@/lib/api-client";
import { useCurrentUser, getStoredToken } from "@/lib/auth";
import { formatRelative } from "@/lib/utils";

const timeAgo = (iso: string) => formatRelative(iso);

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(full?: string | null): string {
  if (!full) return "there";
  const part = full.trim().split(/\s+/)[0];
  return part || "there";
}

export default function DashboardOverview() {
  const { user } = useCurrentUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const list = await api.campaigns.list(token);
        if (cancelled) return;
        setCampaigns(list);
        setLoading(false);
        // keep refreshing while any campaign is still analyzing
        if (list.some((c) => c.status === "analyzing" || c.status === "pending")) {
          timer = window.setTimeout(load, 2000);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load campaigns.");
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const total = campaigns.length;
  const verified = campaigns.filter((c) => c.status === "verified").length;
  const flagged = campaigns.filter((c) => c.status === "flagged").length;
  const inFlight = campaigns.filter(
    (c) => c.status === "analyzing" || c.status === "pending"
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="primary" className="mb-3">
            <Sparkles className="h-3 w-3" /> Overview
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting()}, {firstName(user?.full_name)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here is what is happening across your verified campaigns today.
          </p>
        </div>
        <Link href="/campaigns/submit">
          <Button variant="gradient" size="lg">
            <Plus className="h-4 w-4" />
            Submit campaign
          </Button>
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total campaigns"
          value={total.toString()}
          delta={{ value: "+12%", direction: "up" }}
          icon={Activity}
          hint="vs. previous 30 days"
        />
        <StatCard
          label="Verified"
          value={verified.toString()}
          delta={{ value: "+8%", direction: "up" }}
          icon={ShieldCheck}
          hint="Avg score 95.1"
        />
        <StatCard
          label="Flagged"
          value={flagged.toString()}
          delta={{ value: "-2", direction: "down", tone: "good" }}
          icon={AlertTriangle}
          hint="Awaiting human review"
        />
        <StatCard
          label="In flight"
          value={inFlight.toString()}
          icon={Clock}
          hint="Analyzing & pending"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Verification volume</h2>
              <Badge variant="outline">Last 14 days</Badge>
            </div>
            <SparkChart />
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <Mini
                label="Avg authenticity"
                value={
                  campaigns.filter((c) => c.authenticity_score > 0).length > 0
                    ? (
                        campaigns
                          .filter((c) => c.authenticity_score > 0)
                          .reduce((s, c) => s + c.authenticity_score, 0) /
                        campaigns.filter((c) => c.authenticity_score > 0).length
                      ).toFixed(1)
                    : "—"
                }
                tone="good"
              />
              <Mini label="Median latency" value="780ms" />
              <Mini
                label="On-chain hits"
                value={
                  verified > 0
                    ? `${Math.round(
                        (campaigns.filter((c) => c.blockchain_tx).length /
                          verified) *
                          100
                      )}%`
                    : "—"
                }
                tone="good"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Activity</h2>
            {campaigns.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Activity will show up here once you submit your first campaign.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {campaigns.slice(0, 5).map((c) => {
                  const tone =
                    c.status === "verified"
                      ? "good"
                      : c.status === "flagged" || c.status === "rejected"
                        ? "warn"
                        : "info";
                  const meta =
                    c.status === "verified"
                      ? `${c.authenticity_score.toFixed(1)} score${c.blockchain_tx ? " · on-chain" : ""}`
                      : c.status === "flagged"
                        ? "Needs human review"
                        : c.status === "analyzing"
                          ? "Running AI checks"
                          : c.status === "rejected"
                            ? "Below authenticity threshold"
                            : "Awaiting media";
                  return (
                    <li key={c.id} className="flex items-start gap-3">
                      <Dot tone={tone as "good" | "warn" | "info"} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">
                          <span className="font-medium">
                            {c.brand} · {c.title}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {c.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {meta}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {timeAgo(c.submitted_at)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent campaigns
          </h2>
          <Link
            href="/dashboard/campaigns"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card/40 p-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your campaigns…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-sm text-danger">
            {error}
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">No campaigns yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Submit your first campaign and Verit will run AI verification and
                anchor it on-chain in under a minute.
              </p>
              <Link href="/campaigns/submit">
                <Button variant="gradient" size="sm">
                  <Plus className="h-4 w-4" /> Submit your first campaign
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.slice(0, 6).map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good";
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div
        className={
          tone === "good"
            ? "text-xl font-semibold gradient-text"
            : "text-xl font-semibold"
        }
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Dot({ tone }: { tone: "good" | "warn" | "info" }) {
  const cls =
    tone === "good"
      ? "bg-success/20 text-success"
      : tone === "warn"
        ? "bg-warning/20 text-warning"
        : "bg-primary/20 text-primary";
  return (
    <span
      className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${cls.split(" ")[0]}`}
    />
  );
}

function SparkChart() {
  const data = [12, 18, 14, 22, 20, 28, 26, 34, 30, 42, 38, 46, 52, 60];
  const max = Math.max(...data);
  const w = 640;
  const h = 160;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * (h - 20) - 6}`)
    .join(" ");
  const area = `M0,${h} L${points.split(" ").join(" L")} L${w},${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-40 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(262 83% 65%)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(262 83% 65%)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(262 83% 65%)" />
          <stop offset="100%" stopColor="hsl(160 84% 50%)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkArea)" />
      <polyline
        fill="none"
        stroke="url(#sparkLine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
