"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient, { getAccessToken, apiErrorMessage } from "@/lib/api-client";
import type { CampaignListItem } from "@/lib/types/campaign";

function formatWarnings(securityWarnings: unknown) {
  if (securityWarnings == null) return "None";
  if (Array.isArray(securityWarnings)) {
    return securityWarnings.length ? securityWarnings.join(", ") : "None";
  }
  if (typeof securityWarnings === "object")
    return JSON.stringify(securityWarnings, null, 2);
  return String(securityWarnings);
}

export default function CampaignDetail() {
  const params = useParams();
  const router = useRouter();
  const raw = params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  const [campaign, setCampaign] = useState<CampaignListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    if (!getAccessToken()) {
      setUnauth(true);
      router.replace("/auth/login");
      return;
    }
    const fetchCampaign = async () => {
      setError("");
      try {
        const res = await apiClient.get<CampaignListItem>(`/campaigns/${id}`);
        setCampaign(res.data);
      } catch (e) {
        setCampaign(null);
        setError(
          apiErrorMessage(e, "We could not load this campaign, or you may not have access."),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id, router]);

  if (unauth) return null;

  if (loading) {
    return <p className="p-6">Loading…</p>;
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl">
        <p className="text-red-600" role="alert">
          {error}
        </p>
        <Link
          className="inline-block mt-4 text-[#2563EB] hover:underline"
          href="/dashboard"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!campaign) {
    return (
      <p className="p-6 text-gray-500">
        No campaign found.{" "}
        <Link className="text-[#2563EB] hover:underline" href="/dashboard">
          Dashboard
        </Link>
      </p>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link
        className="text-sm text-[#2563EB] hover:underline mb-4 inline-block"
        href="/dashboard"
      >
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">{campaign.title}</h1>
      <p className="text-sm text-[#64748B] mb-6">Status: {campaign.status}</p>

      <p className="text-[#0F172A] mb-4">
        <span className="font-semibold">Type:</span> {campaign.type}
      </p>
      <p className="whitespace-pre-wrap text-[#334155] mb-4">
        <span className="font-semibold block mb-1">Content</span>
        {campaign.content}
      </p>
      {campaign.url ? (
        <p className="mb-4 break-all text-[#2563EB]">
          <span className="font-semibold text-[#0F172A]">URL: </span>
          <a href={campaign.url} className="underline" target="_blank" rel="noreferrer">
            {campaign.url}
          </a>
        </p>
      ) : null}

      <p className="text-[#334155] mb-2">
        <span className="font-semibold">Security warnings: </span>
        {formatWarnings(campaign.security_warnings)}
      </p>

      {campaign.marketing_tips && campaign.marketing_tips.length > 0 ? (
        <div className="mb-4">
          <p className="font-semibold text-[#0F172A] mb-1">Marketing tips</p>
          <ul className="list-disc pl-5 text-[#334155]">
            {campaign.marketing_tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {campaign.content_hash_sha256 ? (
        <p className="text-sm text-[#64748B] mb-2 break-all">
          <span className="font-medium text-[#0F172A]">Content hash (SHA-256): </span>
          {campaign.content_hash_sha256}
        </p>
      ) : null}

      {campaign.tx_hash && (
        <div className="mt-6 p-4 border border-[#E2E8F0] rounded-lg bg-white">
          <h2 className="font-bold text-[#0F172A] mb-2">Blockchain verification</h2>
          <a
            href={`https://mumbai.polygonscan.com/tx/${campaign.tx_hash}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            View transaction
          </a>
        </div>
      )}
    </div>
  );
}
