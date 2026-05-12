"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Activity,
  Sparkles,
  ArrowRight,
  Hash,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "../components/StatCard";
import { formatRelative, truncateAddress, cn } from "@/lib/utils";
import { api, ApiError, type Campaign, type VerificationStatus } from "@/lib/api-client";
import { getStoredToken } from "@/lib/auth";

type Tab = "all" | VerificationStatus;
type Range = "1d" | "2d" | "3d";

const RANGES: { key: Range; label: string; hours: number }[] = [
  { key: "1d", label: "1 day", hours: 24 },
  { key: "2d", label: "2 days", hours: 48 },
  { key: "3d", label: "3 days", hours: 72 },
];

const STATUS_META: Record<
  VerificationStatus,
  { label: string; tone: "good" | "warn" | "bad" | "info"; Icon: typeof ShieldCheck }
> = {
  verified: { label: "Verified", tone: "good", Icon: CheckCircle2 },
  flagged: { label: "Flagged", tone: "warn", Icon: AlertTriangle },
  rejected: { label: "Rejected", tone: "bad", Icon: XCircle },
  analyzing: { label: "Analyzing", tone: "info", Icon: Clock },
  pending: { label: "Pending", tone: "info", Icon: Clock },
};

export default function VerificationsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [range, setRange] = useState<Range>("3d");
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
        if (list.some((c) => c.status === "analyzing" || c.status === "pending")) {
          timer = window.setTimeout(load, 2000);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load verifications.");
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const inRange = useMemo(() => {
    const cutoff = Date.now() - RANGES.find((r) => r.key === range)!.hours * 3600 * 1000;
    return campaigns.filter((c) => new Date(c.submitted_at).getTime() >= cutoff);
  }, [campaigns, range]);

  const filtered = useMemo(
    () => (tab === "all" ? inRange : inRange.filter((e) => e.status === tab)),
    [tab, inRange]
  );

  const stats = useMemo(() => {
    const total = inRange.length;
    const verified = inRange.filter((c) => c.status === "verified").length;
    const flagged = inRange.filter((c) => c.status === "flagged").length;
    const rejected = inRange.filter((c) => c.status === "rejected").length;
    const scored = inRange.filter((c) => c.authenticity_score > 0);
    const avgScore = scored.length
      ? scored.reduce((s, c) => s + c.authenticity_score, 0) / scored.length
      : 0;
    const onChain = inRange.filter((c) => c.blockchain_tx).length;
    const latencies = inRange
      .filter((c) => c.verified_at)
      .map(
        (c) =>
          new Date(c.verified_at!).getTime() - new Date(c.submitted_at).getTime()
      )
      .sort((a, b) => a - b);
    const medianLatency = latencies.length
      ? latencies[Math.floor(latencies.length / 2)]
      : 0;
    return { total, verified, flagged, rejected, avgScore, onChain, medianLatency };
  }, [inRange]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "verified", label: "Verified", count: stats.verified },
    { key: "flagged", label: "Flagged", count: stats.flagged },
    {
      key: "analyzing",
      label: "Analyzing",
      count: inRange.filter((c) => c.status === "analyzing").length,
    },
    { key: "rejected", label: "Rejected", count: stats.rejected },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="primary" className="mb-3">
            <Sparkles className="h-3 w-3" /> Verifications
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            Verification activity
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every AI signal and on-chain anchor across your organization, in
            real time.
          </p>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total runs"
          value={stats.total.toString()}
          icon={Activity}
          hint={`Last ${RANGES.find((r) => r.key === range)!.label}`}
        />
        <StatCard
          label="Avg authenticity"
          value={stats.avgScore ? stats.avgScore.toFixed(1) : "—"}
          icon={ShieldCheck}
          hint="across scored runs"
        />
        <StatCard
          label="On-chain anchors"
          value={stats.onChain.toString()}
          icon={Hash}
          hint="immutable proofs minted"
        />
        <StatCard
          label="Median latency"
          value={stats.medianLatency ? formatMs(stats.medianLatency) : "—"}
          icon={Clock}
          hint="submit → verified"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border bg-card/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {t.label}
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 text-xs",
                  active
                    ? "bg-primary/25 text-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading verifications…
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-danger">{error}</div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">No verifications yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Submit a campaign to start your first verification run.
              </p>
              <Link href="/campaigns/submit">
                <Button variant="gradient" size="sm">
                  Submit campaign
                </Button>
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
              <h3 className="font-semibold">Nothing in this window</h3>
              <p className="text-sm text-muted-foreground">
                No verifications match the current filter or time range.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((ev) => {
                const meta = STATUS_META[ev.status];
                return (
                  <li key={ev.id} className="group">
                    <Link
                      href={`/campaigns/${ev.id}`}
                      className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/30 md:flex-row md:items-center"
                    >
                      <div className="flex items-start gap-4">
                        <ToneIcon tone={meta.tone} Icon={meta.Icon} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">
                              {ev.brand}
                            </span>
                            <Badge
                              variant={
                                meta.tone === "good"
                                  ? "success"
                                  : meta.tone === "warn"
                                    ? "warning"
                                    : meta.tone === "bad"
                                      ? "danger"
                                      : "primary"
                              }
                            >
                              <meta.Icon className="h-3 w-3" />
                              {meta.label}
                            </Badge>
                          </div>
                          <h3 className="mt-1 truncate text-base font-semibold">
                            {ev.title}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{formatRelative(ev.submitted_at)}</span>
                            <span>· verit-detector v3.2</span>
                            {ev.verified_at ? (
                              <span>
                                ·{" "}
                                {formatMs(
                                  new Date(ev.verified_at).getTime() -
                                    new Date(ev.submitted_at).getTime()
                                )}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="ml-auto flex flex-wrap items-center gap-6">
                        <Score
                          label="Authenticity"
                          value={ev.authenticity_score}
                          tone="good"
                        />
                        <Score label="Risk" value={ev.deepfake_score} tone="bad" />
                        {ev.blockchain_tx ? (
                          <div className="hidden text-right md:block">
                            <div className="text-xs text-muted-foreground">
                              on-chain
                            </div>
                            <div className="font-mono text-xs">
                              {truncateAddress(ev.blockchain_tx)}
                            </div>
                          </div>
                        ) : null}
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RangePicker({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition-colors",
            value === r.key
              ? "border-primary/40 bg-primary/15 text-foreground"
              : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function Score({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "bad";
}) {
  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-mono text-sm font-semibold",
          tone === "good"
            ? "text-success"
            : value > 20
              ? "text-danger"
              : "text-foreground"
        )}
      >
        {value.toFixed(1)}
      </div>
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
    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", cls)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}
