"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api-client";

export default function CampaignDetail() {
  const params = useParams();
  const id = params.id;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchCampaign = async () => {
    try {
      const res = await apiClient.get(`/campaigns/${id}`);
      setCampaign(res.data);
    } catch (error) {
      console.log("Error fetching campaign");

      // backend nahi → null hi rehne do
      setCampaign(null);
    } finally {
      // 🔥 IMPORTANT
      setLoading(false);
    }
  };

  if (id) {
    fetchCampaign();
  }
}, [id]);

  if (loading) {
  return <p className="p-6">Loading...</p>;
}
if (!campaign) {
  return <p className="p-6 text-gray-500">No campaign found</p>;
}

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{campaign.title}</h1>

      <p><b>Content:</b> {campaign.content}</p>
      <p><b>AI Score:</b> {campaign.score}</p>
      <p><b>Warnings:</b> {campaign.warnings}</p>

      {campaign.tx_hash && (
        <div className="mt-6 p-4 border rounded">
          <h2 className="font-bold mb-2">Blockchain Verification Proof</h2>

          <a
            href={`https://mumbai.polygonscan.com/tx/${campaign.tx_hash}`}
            target="_blank"
            className="text-blue-600 underline"
          >
            View Transaction
          </a>
        </div>
      )}
    </div>
  );
}