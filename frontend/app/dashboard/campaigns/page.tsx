"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ListChecks,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CampaignCard } from "../components/CampaignCard";
import { cn } from "@/lib/utils";
import { api, ApiError, type Campaign, type VerificationStatus } from "@/lib/api-client";
import { getStoredToken } from "@/lib/auth";


type Filter = "all" | VerificationStatus;
type Sort = "recent" | "score" | "risk";

const FILTERS: { key: Filter; label: string; Icon?: typeof ShieldCheck }[] = [
  { key: "all", label: "All", Icon: ListChecks },
  { key: "verified", label: "Verified", Icon: ShieldCheck },
  { key: "flagged", label: "Flagged", Icon: AlertTriangle },
  { key: "analyzing", label: "Analyzing", Icon: Clock },
  { key: "pending", label: "Pending", Icon: Clock },
  { key: "rejected", label: "Rejected", Icon: AlertTriangle },
];

export default function CampaignsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [q, setQ] = useState("");
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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = campaigns.filter((c) =>
      filter === "all" ? true : c.status === filter
    );
    if (term) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(term) ||
          c.brand.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term)
      );
    }
    list = [...list].sort((a, b) => {
      if (sort === "score") return b.authenticity_score - a.authenticity_score;
      if (sort === "risk") return b.deepfake_score - a.deepfake_score;
      return (
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );
    });
    return list;
  }, [filter, sort, q, campaigns]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: campaigns.length,
      verified: 0,
      flagged: 0,
      analyzing: 0,
      pending: 0,
      rejected: 0,
    };
    for (const camp of campaigns) c[camp.status] += 1;
    return c;
  }, [campaigns]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="primary" className="mb-3">
            <Sparkles className="h-3 w-3" /> Campaigns
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            All campaigns
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter, search, and dig into every campaign submitted by your team.
          </p>
        </div>
        <Link href="/campaigns/submit">
          <Button variant="gradient" size="lg">
            <Plus className="h-4 w-4" /> Submit campaign
          </Button>
        </Link>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, brand, or campaign ID…"
              className="pl-10"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="recent">Sort: Most recent</option>
              <option value="score">Sort: Highest authenticity</option>
              <option value="risk">Sort: Highest risk</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border bg-card/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {f.Icon ? <f.Icon className="h-3.5 w-3.5" /> : null}
              {f.label}
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 text-xs",
                  active
                    ? "bg-primary/25 text-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading campaigns…
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
            <h3 className="font-semibold">No campaigns yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Submit your first campaign to see it here. Verit will run
              verification and anchor it on-chain in seconds.
            </p>
            <Link href="/campaigns/submit">
              <Button variant="gradient" size="sm">
                <Plus className="h-4 w-4" /> Submit your first campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted/50">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">No campaigns match your filters</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try a different search term or status filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQ("");
                setFilter("all");
              }}
            >
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}
