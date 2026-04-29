import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { CampaignListItem } from "@/lib/types/campaign";

type Props = { campaign: CampaignListItem };

export default function CampaignCard({ campaign }: Props) {
  const getColor = () => {
    if (campaign.status === "High Risk" || campaign.status === "Analysis Failed")
      return "bg-red-500";
    if (campaign.status === "Safe" || campaign.status === "Verified on Blockchain")
      return "bg-green-500";
    if (campaign.status === "Suspicious" || campaign.status === "Blockchain Error")
      return "bg-amber-500";
    return "bg-yellow-500";
  };

  return (
    <div className="border p-4 rounded-lg shadow mb-3 bg-white max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-lg">{campaign.title}</h3>
        <Link
          className="text-sm text-[#2563EB] hover:underline"
          href={`/campaigns/${campaign.id}`}
        >
          View details
        </Link>
      </div>
      <p className="text-sm text-[#64748B] mt-1">Type: {campaign.type}</p>
      <Badge className={`${getColor()} text-white mt-2`}>{campaign.status}</Badge>
    </div>
  );
}
