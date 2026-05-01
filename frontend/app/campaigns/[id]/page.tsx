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
  const [reverifyWarning, setReverifyWarning] = useState(false);
  const [verifyState, setVerifyState] = useState<string>("");
  const [verifyBusy, setVerifyBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (!getAccessToken()) {
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

  const handleReverify = async () => {
    if (!campaign?.id) return;
    setVerifyBusy(true);
    setVerifyState("");
    try {
      const res = await apiClient.post<{
        content_hash_match: boolean;
        blockchain_hash_match: boolean;
        verification_state: string;
      }>(`/campaigns/${campaign.id}/verify-integrity`);
      const data = res.data;
      setReverifyWarning(!data.content_hash_match || !data.blockchain_hash_match);
      setVerifyState(data.verification_state);
    } catch (e) {
      setReverifyWarning(false);
      setVerifyState(apiErrorMessage(e, "Could not verify campaign integrity right now."));
    } finally {
      setVerifyBusy(false);
    }
  };

  if (!id) return <p className="p-6 text-gray-500">Invalid campaign id.</p>;

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

  const tips = campaign.marketing_tips ?? [];
  const trustPct =
    typeof campaign.trust_score === "number" ? Math.round(campaign.trust_score * 100) : null;
  const riskPct =
    typeof campaign.risk_score === "number" ? Math.round(campaign.risk_score * 100) : null;

  return (
    <div className="p-6 bg-[#F1F5F9] min-h-screen max-w-3xl">
      <Link
        className="text-sm text-[#2563EB] hover:underline mb-4 inline-block"
        href="/dashboard"
      >
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">{campaign.title}</h1>
      <p className="text-sm text-[#64748B] mb-6">Status: {campaign.status}</p>
      <div className="mb-6 p-4 border border-[#E2E8F0] rounded-lg bg-white">
        <h2 className="font-bold text-[#0F172A] mb-2">AI risk assessment</h2>
        <p className="text-[#334155]">AI label: {campaign.ai_label ?? "Pending"}</p>
        <p className="text-[#334155]">
          Confidence:{" "}
          {typeof campaign.ai_confidence === "number"
            ? `${Math.round(campaign.ai_confidence * 100)}%`
            : "N/A"}
        </p>
        <p className="text-[#334155]">Trust score: {trustPct !== null ? `${trustPct}%` : "N/A"}</p>
        <p className="text-[#334155]">Risk score: {riskPct !== null ? `${riskPct}%` : "N/A"}</p>
      </div>

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

      {campaign.content_hash_sha256 ? (
        <p className="text-sm text-[#64748B] mb-4 break-all">
          <span className="font-medium text-[#0F172A]">Content hash (SHA-256): </span>
          {campaign.content_hash_sha256}
        </p>
      ) : null}

      {campaign.content_hash_sha256 ? (
        <button
          type="button"
          onClick={handleReverify}
          disabled={verifyBusy}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          {verifyBusy ? "Verifying..." : "Re-verify content"}
        </button>
      ) : null}

      {reverifyWarning && (
        <div
          className="mt-4 p-3 bg-red-100 text-red-800 border border-red-200 rounded"
          role="alert"
        >
          Content no longer matches the stored SHA-256 hash — it may have been changed
          after verification.
        </div>
      )}
      {verifyState ? (
        <p className="mt-3 text-sm text-[#475569]">Verification state: {verifyState}</p>
      ) : null}

      {campaign.tx_hash && (
        <div className="mt-6 p-4 border border-[#E2E8F0] rounded-lg bg-white">
          <h2 className="font-bold text-[#0F172A] mb-2">Blockchain verification</h2>
          <p className="text-sm text-[#334155] mb-2">
            Network: {campaign.blockchain_network ?? "unknown"}
          </p>
          {campaign.blockchain_network &&
          campaign.blockchain_network.toLowerCase().includes("polygon") ? (
            <a
              href={`https://mumbai.polygonscan.com/tx/${campaign.tx_hash}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              View transaction
            </a>
          ) : (
            <p className="text-sm break-all text-[#334155]">Tx Hash: {campaign.tx_hash}</p>
          )}
        </div>
      )}

      <div className="mt-6 p-4 border border-[#E2E8F0] rounded-lg bg-white">
        <h2 className="font-bold text-[#0F172A] mb-2">Marketing improvement tips</h2>
        {tips.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1 text-[#334155]">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No tips available</p>
        )}
      </div>
    </div>
  );
}
