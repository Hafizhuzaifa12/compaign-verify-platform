"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api-client";

export default function CampaignDetail() {
  const params = useParams();
  const id = params.id;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState(false);

  // 🔥 Fetch campaign
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await apiClient.get(`/campaigns/${id}`);
        setCampaign(res.data);
      } catch (error) {
        console.log("Error fetching campaign");
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCampaign();
    }
  }, [id]);

  // 🔐 SHA-256 hash generator
  const generateHash = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  // 🔍 Re-Verify function
  const handleVerify = async () => {
    if (!campaign) return;

    const newHash = await generateHash(campaign.content);

    if (newHash !== campaign.hash) {
      setWarning(true);
    } else {
      setWarning(false);
    }
  };

  // ⏳ Loading
  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  // ❌ No data
  if (!campaign) {
    return <p className="p-6 text-gray-500">No campaign found</p>;
  }

  return (
    <div className="p-6 bg-[#F1F5F9] min-h-screen">

      {/* Title */}
      <h1 className="text-2xl font-bold mb-4">{campaign.title}</h1>

      {/* Content */}
      <p className="mb-3">
        <b>Content:</b> {campaign.content}
      </p>

      {/* AI Score */}
      <p className="mb-3">
        <b>AI Score:</b> {campaign.score}
      </p>

      {/* Security Warnings */}
      <p className="mb-3">
        <b>Security Warnings:</b> {campaign.warnings}
      </p>

      {/* 🔴 Re-Verify Button */}
      <button
        onClick={handleVerify}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Re-Verify Content
      </button>

      {/* 🚨 Warning Alert */}
      {warning && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 border rounded">
          🚨 Warning: Content has been modified after blockchain verification!
        </div>
      )}

      {/* 🔗 Blockchain Proof */}
      {campaign.tx_hash && (
        <div className="mt-6 p-4 border rounded bg-white">
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

      {/* 💡 Marketing Tips */}
      <div className="mt-6 p-4 border rounded bg-white">
        <h2 className="font-bold mb-2">Marketing Improvement Tips</h2>

        {campaign.tips && campaign.tips.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1">
            {campaign.tips.map((tip: string, index: number) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No tips available</p>
        )}
      </div>

    </div>
  );
}