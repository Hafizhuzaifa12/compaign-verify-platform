import { Badge } from "@/components/ui/badge";

export default function CampaignCard({ campaign }: any) {
  const getColor = () => {
    if (campaign.status === "Safe") return "bg-green-500";
    if (campaign.status === "High Risk") return "bg-red-500";
    return "bg-yellow-500";
  };

  return (
    <div className="border p-4 rounded-lg shadow mb-3">
      <h3 className="font-bold">{campaign.title}</h3>
      <Badge className={`${getColor()} text-white mt-2`}>
        {campaign.status}
      </Badge>
    </div>
  );
}