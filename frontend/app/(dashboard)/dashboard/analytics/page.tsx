"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient, { getAccessToken } from "@/lib/api-client";
import type { UserMe } from "@/lib/types/user";
import type { CampaignListItem } from "@/lib/types/campaign";
import StatCard from "../components/StatCard";

function isVerified(status: string) {
  return status === "Safe" || status === "Verified on Blockchain";
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-[var(--text-heading)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
          {label}
        </span>
        <span className="text-[var(--text-muted)]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
        <div
          className="h-full rounded-full bg-[var(--brand-primary)]"
          style={{ width: `${Math.max(6, pct)}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/login");
      return;
    }
    const run = async () => {
      setLoadError("");
      try {
        const me = await apiClient.get<UserMe>("/users/me");
        if (me.data.needs_profile_completion) {
          router.replace("/auth/complete-profile");
          return;
        }
        const res = await apiClient.get<CampaignListItem[]>("/campaigns");
        setCampaigns(res.data);
      } catch {
        setLoadError("Could not load campaigns.");
      } finally {
        setReady(true);
      }
    };
    run();
  }, [router]);

  const analytics = useMemo(() => {
    const total = campaigns.length;
    const verified = campaigns.filter((c) => isVerified(c.status)).length;
    const withTrust = campaigns.filter((c) => typeof c.trust_score === "number");
    const withRisk = campaigns.filter((c) => typeof c.risk_score === "number");
    const avgTrust =
      withTrust.length > 0
        ? withTrust.reduce((s, c) => s + (c.trust_score as number), 0) / withTrust.length
        : null;
    const avgRisk =
      withRisk.length > 0
        ? withRisk.reduce((s, c) => s + (c.risk_score as number), 0) / withRisk.length
        : null;
    const byType = new Map<string, number>();
    for (const c of campaigns) {
      const t = c.type?.trim() || "Unknown";
      byType.set(t, (byType.get(t) ?? 0) + 1);
    }
    const typeRows = [...byType.entries()].sort((a, b) => b[1] - a[1]);
    const maxType = typeRows[0]?.[1] ?? 1;

    const labelCounts = new Map<string, number>();
    for (const c of campaigns) {
      const lab = c.ai_label?.trim() || "Pending";
      labelCounts.set(lab, (labelCounts.get(lab) ?? 0) + 1);
    }
    const labelRows = [...labelCounts.entries()].sort((a, b) => b[1] - a[1]);
    const maxLabel = labelRows[0]?.[1] ?? 1;

    return { total, verified, avgTrust, avgRisk, typeRows, maxType, labelRows, maxLabel };
  }, [campaigns]);

  if (!ready) {
    return <div className="text-[var(--text-muted)]">Loading…</div>;
  }

  const trustDisplay =
    analytics.avgTrust !== null ? Math.round(analytics.avgTrust * 100) : null;
  const riskDisplay = analytics.avgRisk !== null ? Math.round(analytics.avgRisk * 100) : null;

  return (
    <div className="pb-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-[26px] font-bold text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Analytics
          </h1>
          <p className="mt-1 max-w-xl text-[14px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Aggregates from your submitted campaigns (same data as the overview).
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[var(--brand-primary)] hover:underline"
        >
          Back to overview
        </Link>
      </div>

      {loadError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total campaigns" value={analytics.total} />
        <StatCard title="Verified" value={analytics.verified} />
        <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 transition-shadow duration-200 hover:shadow-md">
          <p
            className="text-[13px] font-medium text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Avg trust score
          </p>
          <p
            className="mt-1 text-[32px] font-bold leading-none text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            {trustDisplay !== null ? `${trustDisplay}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Where the API returned a score</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 transition-shadow duration-200 hover:shadow-md">
          <p
            className="text-[13px] font-medium text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Avg risk score
          </p>
          <p
            className="mt-1 text-[32px] font-bold leading-none text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            {riskDisplay !== null ? `${riskDisplay}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Where the API returned a score</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white p-6">
          <h2
            className="mb-4 text-[18px] font-semibold text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            By campaign type
          </h2>
          {analytics.typeRows.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {analytics.typeRows.map(([label, count]) => (
                <li key={label}>
                  <MiniBar label={label} value={count} max={analytics.maxType} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white p-6">
          <h2
            className="mb-4 text-[18px] font-semibold text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            By AI label
          </h2>
          {analytics.labelRows.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {analytics.labelRows.map(([label, count]) => (
                <li key={label}>
                  <MiniBar label={label} value={count} max={analytics.maxLabel} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
