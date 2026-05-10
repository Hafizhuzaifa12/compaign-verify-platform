"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient, { getAccessToken } from "@/lib/api-client";
import type { UserMe } from "@/lib/types/user";
import type { CampaignListItem } from "@/lib/types/campaign";
import StatCard from "../components/StatCard";
import CampaignTableRow from "../components/campaign-table-row";

function IconClipboard() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconXCircle() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function isVerified(status: string) {
  return status === "Safe" || status === "Verified on Blockchain";
}

function isRejected(status: string) {
  return ["High Risk", "Suspicious", "Analysis Failed"].includes(status);
}

export default function VerificationStatusPage() {
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

  const total = campaigns.length;
  const pending = campaigns.filter((c) => c.status === "Pending").length;
  const verified = campaigns.filter((c) => isVerified(c.status)).length;
  const rejected = campaigns.filter((c) => isRejected(c.status)).length;

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of campaigns) {
      map.set(c.status, (map.get(c.status) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [campaigns]);

  const maxCount = statusBreakdown[0]?.[1] ?? 1;

  if (!ready) {
    return <div className="text-[var(--text-muted)]">Loading…</div>;
  }

  return (
    <div className="pb-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-[26px] font-bold text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Verification status
          </h1>
          <p className="mt-1 max-w-xl text-[14px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Live counts and every campaign&apos;s current review state from your account.
          </p>
        </div>
        <Link
          href="/campaigns/submit"
          className="inline-flex w-fit cursor-pointer rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
        >
          Submit campaign
        </Link>
      </div>

      {loadError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={total} icon={<IconClipboard />} />
        <StatCard title="Pending review" value={pending} icon={<IconClock />} />
        <StatCard title="Verified" value={verified} icon={<IconCheck />} />
        <StatCard title="Rejected / flagged" value={rejected} icon={<IconXCircle />} />
      </div>

      <div className="mb-10 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white p-6">
        <h2
          className="mb-4 text-[18px] font-semibold text-[var(--text-heading)]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          Status breakdown
        </h2>
        {statusBreakdown.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            No campaigns yet. Submit one to see status distribution.
          </p>
        ) : (
          <ul className="space-y-3">
            {statusBreakdown.map(([label, count]) => (
              <li key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-[var(--text-heading)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                    {label}
                  </span>
                  <span className="text-[var(--text-muted)]">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-primary)] transition-all"
                    style={{ width: `${Math.max(8, (count / maxCount) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2
          className="text-[18px] font-semibold text-[var(--text-heading)]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          All campaigns
        </h2>
        <Link href="/dashboard/campaigns" className="text-sm font-medium text-[var(--brand-primary)] hover:underline">
          Open full list
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="border-b border-[var(--border-default)] bg-white">
              <tr>
                <th
                  className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                  style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                >
                  Campaign
                </th>
                <th
                  className="hidden px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] md:table-cell"
                  style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                >
                  Status
                </th>
                <th
                  className="hidden px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] lg:table-cell"
                  style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                >
                  AI label
                </th>
                <th
                  className="hidden px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:table-cell"
                  style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                >
                  Trust / Risk
                </th>
                <th
                  className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                  style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && !loadError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-[var(--text-muted)]"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                  >
                    No campaigns yet.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => <CampaignTableRow key={c.id} campaign={c} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
