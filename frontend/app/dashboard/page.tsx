"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient, { getAccessToken } from "@/lib/api-client";
import type { CampaignListItem } from "@/lib/types/campaign";
import StatCard from "./components/StatCard";
import CampaignCard from "./components/CampaignCard";

function isGoodStatus(s: string) {
  return s === "Safe" || s === "Verified on Blockchain";
}

function isRiskStatus(s: string) {
  return s === "High Risk" || s === "Analysis Failed" || s === "Suspicious";
}

export default function Dashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [ready, setReady] = useState(false);
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      setUnauth(true);
      router.replace("/auth/login");
      return;
    }
    const fetchCampaigns = async () => {
      setLoadError("");
      try {
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
  const safe = campaigns.filter((c) => isGoodStatus(c.status)).length;
  const risk = campaigns.filter((c) => isRiskStatus(c.status)).length;

  if (unauth) return null;
  if (!ready) {
    return (
      <div className="p-6 bg-[#F1F5F9] min-h-screen text-[#64748B]">Loading…</div>
    );
  }

  return (
    <div className="p-6 bg-[#F1F5F9] min-h-screen">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Dashboard</h1>
        <Link
          className="text-sm font-medium text-[#2563EB] hover:underline"
          href="/campaigns/submit"
        >
          Submit a campaign
        </Link>
      </div>

      {loadError ? (
        <p className="text-sm text-red-600 mb-4" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total campaigns" value={total} />
        <StatCard
          title="Safe / verified"
          value={safe}
        />
        <StatCard
          title="At risk or flagged"
          value={risk}
        />
      </div>

      <div>
        {campaigns.length === 0 && !loadError ? (
          <p className="text-[#64748B]">No campaigns yet. Submit one to get started.</p>
        ) : null}
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
}
