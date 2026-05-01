"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient, { getAccessToken } from "@/lib/api-client";
import type { UserMe } from "@/lib/types/user";
import type { CampaignListItem } from "@/lib/types/campaign";
import StatCard from "./components/StatCard";
import CampaignTableRow from "./components/campaign-table-row";

export default function Dashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/login");
      return;
    }
    const fetchCampaigns = async () => {
      setLoadError("");
      try {
        const me = await apiClient.get<UserMe>("/users/me");
        if (me.data.needs_profile_completion) {
          router.replace("/auth/complete-profile");
          return;
        }
        const res = await apiClient.get<CampaignListItem[]>("/campaigns");
        setCampaigns(res.data);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        setLoadError("Could not load campaigns. You may need to sign in again.");
      } finally {
        setReady(true);
      }
    };

    fetchCampaigns();
  }, [router]);

  const total = campaigns.length;
  const pending = campaigns.filter((c) => c.status === "Pending").length;
  const verified = campaigns.filter(
    (c) => c.status === "Safe" || c.status === "Verified on Blockchain",
  ).length;
  const rejected = campaigns.filter((c) =>
    ["High Risk", "Suspicious", "Analysis Failed"].includes(c.status),
  ).length;

  if (!ready) {
    return (
      <div className="bg-[#F1F5F9] px-4 py-6 text-[#64748B] md:px-6" style={{ minHeight: "50vh" }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="bg-[#F1F5F9] pb-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0F172A]"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Dashboard
            </h1>
            <p className="mt-1 text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Overview of your campaigns
            </p>
          </div>
          <Link
            className="inline-flex w-fit cursor-pointer rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95"
            href="/campaigns/submit"
          >
            Submit a campaign
          </Link>
        </div>

        {loadError ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {loadError}
          </p>
        ) : null}

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total campaigns" value={total} dotClass="bg-[#2563EB]" />
          <StatCard title="Pending" value={pending} dotClass="bg-yellow-500" />
          <StatCard title="Verified" value={verified} dotClass="bg-green-500" />
          <StatCard title="Rejected / flagged" value={rejected} dotClass="bg-red-500" />
        </div>

        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <tr>
                  <th
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                  >
                    Campaign
                  </th>
                  <th
                    className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] md:table-cell"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                  >
                    Status
                  </th>
                  <th
                    className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] lg:table-cell"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                  >
                    AI label
                  </th>
                  <th
                    className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] xl:table-cell"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                  >
                    Trust / Risk
                  </th>
                  <th
                    className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
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
                      className="px-4 py-10 text-center text-[#64748B]"
                      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                    >
                      No campaigns yet. Submit one to get started.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <CampaignTableRow key={campaign.id} campaign={campaign} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
