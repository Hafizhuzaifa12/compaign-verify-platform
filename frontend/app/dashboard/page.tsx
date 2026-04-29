"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import StatCard from "./components/StatCard";
import CampaignCard from "./components/CampaignCard";

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await apiClient.get("/campaigns");
        setCampaigns(res.data);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };

    fetchCampaigns();
  }, []);

  // 📊 Stats
  const total = campaigns.length;
  const safe = campaigns.filter(c => c.status === "Safe").length;
  const risk = campaigns.filter(c => c.status === "High Risk").length;

  return (
    <div className="p-6 bg-[#F1F5F9] min-h-screen">

      {/* 🔹 STAT CARDS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Campaigns" value={total} />
        <StatCard title="Safe" value={safe} />
        <StatCard title="High Risk" value={risk} />
      </div>

      {/* 🔹 CAMPAIGN LIST */}
      <div>
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

    </div>
  );
}