"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Hash,
  Clock,
  Activity,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "../components/StatCard";
import { cn } from "@/lib/utils";
import { api, ApiError, type Campaign } from "@/lib/api-client";
import { getStoredToken } from "@/lib/auth";

type Range = "1d" | "2d" | "3d";

const RANGES: { key: Range; label: string; hours: number }[] = [
  { key: "1d", label: "1 day", hours: 24 },
  { key: "2d", label: "2 days", hours: 48 },
  { key: "3d", label: "3 days", hours: 72 },
];

const DONUT_COLORS = [
  "hsl(262 83% 65%)",
  "hsl(160 84% 50%)",
  "hsl(40 96% 60%)",
  "hsl(220 14% 40%)",
];

const CATEGORY_LABELS: Record<string, string> = {
  marketing: "Marketing",
  political: "Political",
  public_service: "Public service",
  other: "Other",
};

export default function AnalyticsPage() {
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
        setError(err instanceof ApiError ? err.message : "Failed to load analytics.");
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const rangeHours = RANGES.find((r) => r.key === range)!.hours;

  const inRange = useMemo(() => {
    const cutoff = Date.now() - rangeHours * 3600 * 1000;
    return campaigns.filter((c) => new Date(c.submitted_at).getTime() >= cutoff);
  }, [campaigns, rangeHours]);

  const previous = useMemo(() => {
    const now = Date.now();
    const start = now - 2 * rangeHours * 3600 * 1000;
    const end = now - rangeHours * 3600 * 1000;
    return campaigns.filter((c) => {
      const t = new Date(c.submitted_at).getTime();
      return t >= start && t < end;
    });
  }, [campaigns, rangeHours]);

  const metrics = useMemo(() => {
    const total = inRange.length;
    const scored = inRange.filter((c) => c.authenticity_score > 0);
    const avgScore = scored.length
      ? scored.reduce((s, c) => s + c.authenticity_score, 0) / scored.length
      : 0;
    const flagged = inRange.filter((c) => c.status === "flagged").length;
    const flaggedRate = total ? (flagged / total) * 100 : 0;
    const verified = inRange.filter((c) => c.status === "verified");
    const onChain = verified.filter((c) => c.blockchain_tx).length;
    const onChainCoverage = verified.length ? (onChain / verified.length) * 100 : 0;
    return { total, avgScore, flaggedRate, onChainCoverage };
  }, [inRange]);

  const deltas = useMemo(() => {
    const totalPct = pctDelta(inRange.length, previous.length);
    const prevScored = previous.filter((c) => c.authenticity_score > 0);
    const prevAvg = prevScored.length
      ? prevScored.reduce((s, c) => s + c.authenticity_score, 0) / prevScored.length
      : 0;
    const avgDelta = metrics.avgScore - prevAvg;
    const prevFlaggedRate = previous.length
      ? (previous.filter((c) => c.status === "flagged").length / previous.length) * 100
      : 0;
    const flaggedDelta = metrics.flaggedRate - prevFlaggedRate;
    return { totalPct, avgDelta, flaggedDelta };
  }, [inRange, previous, metrics]);

  const latencies = useMemo(() => {
    const ms = inRange
      .filter((c) => c.verified_at)
      .map(
        (c) =>
          new Date(c.verified_at!).getTime() - new Date(c.submitted_at).getTime()
      )
      .sort((a, b) => a - b);
    if (ms.length === 0) return { p50: 0, p90: 0, p99: 0 };
    const pick = (q: number) =>
      ms[Math.min(ms.length - 1, Math.floor(ms.length * q))];
    return { p50: pick(0.5), p90: pick(0.9), p99: pick(0.99) };
  }, [inRange]);

  const volume = useMemo(
    () => bucketByTime(inRange, rangeHours),
    [inRange, rangeHours]
  );

  const scoreBuckets = useMemo(() => {
    const buckets = [
      { label: "0–20", count: 0, tone: "bad" as const },
      { label: "21–40", count: 0, tone: "bad" as const },
      { label: "41–60", count: 0, tone: "warn" as const },
      { label: "61–80", count: 0, tone: "warn" as const },
      { label: "81–95", count: 0, tone: "good" as const },
      { label: "96–100", count: 0, tone: "good" as const },
    ];
    for (const c of inRange) {
      const s = c.authenticity_score;
      if (s <= 0) continue;
      if (s <= 20) buckets[0].count++;
      else if (s <= 40) buckets[1].count++;
      else if (s <= 60) buckets[2].count++;
      else if (s <= 80) buckets[3].count++;
      else if (s <= 95) buckets[4].count++;
      else buckets[5].count++;
    }
    return buckets;
  }, [inRange]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of inRange) counts[c.category] = (counts[c.category] || 0) + 1;
    const total = inRange.length || 1;
    return Object.entries(counts)
      .map(([key, count]) => ({
        label: CATEGORY_LABELS[key] ?? key,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [inRange]);

  const topBrands = useMemo(() => {
    const map = new Map<
      string,
      { name: string; runs: number; verified: number; avg: number }
    >();
    for (const c of inRange) {
      const cur = map.get(c.brand) ?? {
        name: c.brand,
        runs: 0,
        verified: 0,
        avg: 0,
      };
      cur.runs += 1;
      if (c.status === "verified") cur.verified += 1;
      cur.avg += c.authenticity_score > 0 ? c.authenticity_score : 0;
      map.set(c.brand, cur);
    }
    return Array.from(map.values())
      .map((b) => ({ ...b, avg: b.runs ? b.avg / b.runs : 0 }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5);
  }, [inRange]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="primary" className="mb-3">
            <Sparkles className="h-3 w-3" /> Analytics
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            Trust analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trends, distributions, and on-chain proof signals across your
            workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                range === r.key
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading analytics…
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-sm text-danger">{error}</CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Analytics will populate as you verify</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Submit your first campaign to start building trends.
            </p>
            <Link href="/campaigns/submit">
              <Button variant="gradient" size="sm">
                Submit campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Verification runs"
              value={metrics.total.toString()}
              delta={
                previous.length
                  ? {
                      value: `${deltas.totalPct >= 0 ? "+" : ""}${deltas.totalPct.toFixed(0)}%`,
                      direction: deltas.totalPct >= 0 ? "up" : "down",
                    }
                  : undefined
              }
              icon={Activity}
              hint={`Last ${RANGES.find((r) => r.key === range)!.label}`}
            />
            <StatCard
              label="Avg authenticity"
              value={metrics.avgScore ? metrics.avgScore.toFixed(1) : "—"}
              delta={
                previous.length
                  ? {
                      value: `${deltas.avgDelta >= 0 ? "+" : ""}${deltas.avgDelta.toFixed(1)}`,
                      direction: deltas.avgDelta >= 0 ? "up" : "down",
                    }
                  : undefined
              }
              icon={ShieldCheck}
              hint="weighted across runs"
            />
            <StatCard
              label="Flagged rate"
              value={`${metrics.flaggedRate.toFixed(1)}%`}
              delta={
                previous.length
                  ? {
                      value: `${deltas.flaggedDelta >= 0 ? "+" : ""}${deltas.flaggedDelta.toFixed(1)}%`,
                      direction: deltas.flaggedDelta <= 0 ? "down" : "up",
                      tone: deltas.flaggedDelta <= 0 ? "good" : "bad",
                    }
                  : undefined
              }
              icon={AlertTriangle}
              hint="needs human review"
            />
            <StatCard
              label="On-chain coverage"
              value={`${metrics.onChainCoverage.toFixed(1)}%`}
              icon={Hash}
              hint="of verified items minted"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Verification volume</h2>
                    <p className="text-xs text-muted-foreground">
                      Hourly buckets across the selected window
                    </p>
                  </div>
                  {previous.length ? (
                    <Badge variant="outline">
                      <TrendingUp className="h-3 w-3" />{" "}
                      {deltas.totalPct >= 0 ? "+" : ""}
                      {deltas.totalPct.toFixed(0)}%
                    </Badge>
                  ) : null}
                </div>
                <VolumeChart data={volume} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold">Latency</h2>
                <p className="text-xs text-muted-foreground">
                  Submit → on-chain attestation
                </p>
                <div className="mt-6 space-y-4">
                  <LatencyRow
                    label="p50"
                    value={latencies.p50 ? formatMs(latencies.p50) : "—"}
                    pct={Math.min(100, (latencies.p50 / 3000) * 100)}
                  />
                  <LatencyRow
                    label="p90"
                    value={latencies.p90 ? formatMs(latencies.p90) : "—"}
                    pct={Math.min(100, (latencies.p90 / 3000) * 100)}
                  />
                  <LatencyRow
                    label="p99"
                    value={latencies.p99 ? formatMs(latencies.p99) : "—"}
                    pct={Math.min(100, (latencies.p99 / 3000) * 100)}
                    tone={latencies.p99 > 2000 ? "warn" : undefined}
                  />
                </div>
                <div className="mt-6 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  Target p90 is under 1s. Currently{" "}
                  <span className="font-semibold text-foreground">
                    {latencies.p90 ? formatMs(latencies.p90) : "—"}
                  </span>
                  .
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold">Authenticity score distribution</h2>
                <p className="text-xs text-muted-foreground">
                  Where every scored asset landed
                </p>
                <div className="mt-6 space-y-3">
                  {scoreBuckets.map((b) => {
                    const max = Math.max(1, ...scoreBuckets.map((x) => x.count));
                    const pct = (b.count / max) * 100;
                    return (
                      <div key={b.label}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{b.label}</span>
                          <span className="font-mono">{b.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              b.tone === "good"
                                ? "bg-[linear-gradient(90deg,hsl(var(--accent)),hsl(var(--primary)))]"
                                : b.tone === "warn"
                                  ? "bg-[linear-gradient(90deg,hsl(var(--warning)),hsl(var(--primary)))]"
                                  : "bg-[linear-gradient(90deg,hsl(var(--danger)),hsl(var(--warning)))]"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold">Category mix</h2>
                <p className="text-xs text-muted-foreground">
                  Share of verifications by campaign type
                </p>
                <div className="mt-6 grid grid-cols-[auto_1fr] gap-4">
                  <DonutChart data={categories} total={metrics.total} />
                  <ul className="space-y-3 self-center">
                    {categories.length === 0 ? (
                      <li className="text-sm text-muted-foreground">
                        No data in this window.
                      </li>
                    ) : (
                      categories.map((c, i) => (
                        <li key={c.label} className="flex items-center gap-3">
                          <span
                            className="inline-block h-3 w-3 rounded-sm"
                            style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                          />
                          <div className="flex-1 text-sm">{c.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {c.pct}% · {c.count}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Top brands by activity</h2>
                  <p className="text-xs text-muted-foreground">
                    Sorted by verification runs in the period
                  </p>
                </div>
                <Badge variant="outline">
                  {RANGES.find((r) => r.key === range)!.label}
                </Badge>
              </div>
              {topBrands.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No brand activity in this window.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="pb-3 font-medium">Brand</th>
                        <th className="pb-3 font-medium">Runs</th>
                        <th className="pb-3 font-medium">Verified</th>
                        <th className="pb-3 font-medium">Verify rate</th>
                        <th className="pb-3 font-medium">Avg score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {topBrands.map((b) => {
                        const rate = b.runs ? (b.verified / b.runs) * 100 : 0;
                        return (
                          <tr key={b.name}>
                            <td className="py-3 font-medium">{b.name}</td>
                            <td className="py-3 font-mono">{b.runs}</td>
                            <td className="py-3 font-mono">{b.verified}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--accent)),hsl(var(--primary)))]"
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {rate.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 font-mono">
                              {b.avg ? b.avg.toFixed(1) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------- helpers ----------

function pctDelta(now: number, prev: number): number {
  if (!prev) return now ? 100 : 0;
  return ((now - prev) / prev) * 100;
}

function bucketByTime(items: Campaign[], rangeHours: number): number[] {
  const buckets = 24;
  const bucketMs = (rangeHours * 3600 * 1000) / buckets;
  const cutoff = Date.now() - rangeHours * 3600 * 1000;
  const out = new Array(buckets).fill(0);
  for (const c of items) {
    const t = new Date(c.submitted_at).getTime();
    if (t < cutoff) continue;
    const idx = Math.min(buckets - 1, Math.floor((t - cutoff) / bucketMs));
    out[idx]++;
  }
  return out;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function LatencyRow({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: string;
  pct: number;
  tone?: "warn";
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "warn"
              ? "bg-[linear-gradient(90deg,hsl(var(--warning)),hsl(var(--danger)))]"
              : "bg-[linear-gradient(90deg,hsl(var(--accent)),hsl(var(--primary)))]"
          )}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}

function VolumeChart({ data }: { data: number[] }) {
  const w = 640;
  const h = 200;
  const max = Math.max(1, ...data);
  const step = w / Math.max(1, data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * (h - 30) - 10}`)
    .join(" ");
  const area = `M0,${h} L${points.split(" ").join(" L")} L${w},${h} Z`;
  const empty = data.every((d) => d === 0);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-52 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="vArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(262 83% 65%)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="hsl(262 83% 65%)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="vLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(262 83% 65%)" />
          <stop offset="100%" stopColor="hsl(160 84% 50%)" />
        </linearGradient>
      </defs>
      {empty ? (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ font: "500 12px ui-sans-serif" }}
        >
          No verification activity in this window yet
        </text>
      ) : (
        <>
          <path d={area} fill="url(#vArea)" />
          <polyline
            fill="none"
            stroke="url(#vLine)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {data.map((v, i) => (
            <circle
              key={i}
              cx={i * step}
              cy={h - (v / max) * (h - 30) - 10}
              r="2.5"
              fill="hsl(var(--background))"
              stroke="hsl(262 83% 65%)"
              strokeWidth="1.5"
            />
          ))}
        </>
      )}
    </svg>
  );
}

function DonutChart({
  data,
  total,
}: {
  data: { label: string; pct: number }[];
  total: number;
}) {
  const size = 140;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-36 w-36">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={stroke}
      />
      {data.map((d, i) => {
        const len = (d.pct / 100) * c;
        const dash = `${len} ${c - len}`;
        const seg = (
          <circle
            key={d.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth={stroke}
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += len;
        return seg;
      })}
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        className="fill-foreground"
        style={{ font: "600 18px ui-sans-serif" }}
      >
        {total}
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        className="fill-muted-foreground"
        style={{ font: "500 10px ui-sans-serif" }}
      >
        runs
      </text>
    </svg>
  );
}
