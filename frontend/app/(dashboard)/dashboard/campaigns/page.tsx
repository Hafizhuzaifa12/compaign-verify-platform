"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient, { getAccessToken } from "@/lib/api-client";
import type { UserMe } from "@/lib/types/user";
import type { CampaignListItem } from "@/lib/types/campaign";
import CampaignTableRow from "../components/campaign-table-row";

export default function MyCampaignsPage() {
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

  if (!ready) {
    return <div className="text-[var(--text-muted)]">Loading…</div>;
  }

  return (
    <div className="pb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-[26px] font-bold text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            My Campaigns
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            All submissions linked to your account
          </p>
        </div>
        <Link
          href="/campaigns/submit"
          className="inline-flex cursor-pointer rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
        >
          Submit Campaign
        </Link>
      </div>

      {loadError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      ) : null}

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
