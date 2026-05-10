import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { CampaignListItem } from "@/lib/types/campaign";

type Props = { campaign: CampaignListItem };

export default function CampaignTableRow({ campaign }: Props) {
  const trustPct =
    typeof campaign.trust_score === "number"
      ? Math.round(campaign.trust_score * 100)
      : null;
  const riskPct =
    typeof campaign.risk_score === "number" ? Math.round(campaign.risk_score * 100) : null;

  const getBadgeColor = () => {
    if (campaign.status === "High Risk" || campaign.status === "Analysis Failed")
      return "bg-red-500";
    if (campaign.status === "Safe" || campaign.status === "Verified on Blockchain")
      return "bg-green-500";
    if (campaign.status === "Suspicious" || campaign.status === "Blockchain Error")
      return "bg-amber-500";
    return "bg-yellow-500";
  };

  const badge = (
    <Badge className={`${getBadgeColor()} rounded-full px-3 py-1 text-xs font-medium text-white`}>
      {campaign.status}
    </Badge>
  );

  return (
    <tr className="border-b border-[var(--border-default)] transition-colors hover:bg-[var(--surface-subtle)]">
      <td className="px-6 py-4 align-top">
        <div
          className="font-semibold text-[var(--text-heading)]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          {campaign.title}
        </div>
        <p
          className="mt-1 text-sm text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          Type: {campaign.type}
        </p>
        <div className="mt-3 md:hidden">{badge}</div>
      </td>
      <td className="hidden px-6 py-4 align-middle md:table-cell">{badge}</td>
      <td
        className="hidden px-6 py-4 align-middle text-sm text-[var(--text-soft)] lg:table-cell"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      >
        {campaign.ai_label ?? "Pending"}
      </td>
      <td
        className="hidden px-6 py-4 align-middle text-sm text-[var(--text-soft)] xl:table-cell"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      >
        Trust {trustPct !== null ? `${trustPct}%` : "N/A"} · Risk{" "}
        {riskPct !== null ? `${riskPct}%` : "N/A"}
      </td>
      <td className="px-6 py-4 text-right align-middle">
        <Link
          className="text-sm font-medium text-[var(--brand-primary)] hover:underline"
          href={`/campaigns/${campaign.id}`}
        >
          View details
        </Link>
      </td>
    </tr>
  );
}
