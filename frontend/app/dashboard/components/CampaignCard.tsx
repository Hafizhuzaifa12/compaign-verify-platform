import Link from "next/link";
import { ArrowRight, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative, truncateAddress } from "@/lib/utils";
import type { Campaign, VerificationStatus } from "@/lib/api-client";

const STATUS_META: Record<
  VerificationStatus,
  { label: string; variant: "success" | "warning" | "danger" | "primary" | "outline"; Icon: typeof ShieldCheck }
> = {
  verified: { label: "Verified", variant: "success", Icon: ShieldCheck },
  flagged: { label: "Flagged", variant: "warning", Icon: AlertTriangle },
  rejected: { label: "Rejected", variant: "danger", Icon: AlertTriangle },
  pending: { label: "Pending", variant: "outline", Icon: Clock },
  analyzing: { label: "Analyzing", variant: "primary", Icon: Clock },
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const meta = STATUS_META[campaign.status];
  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <Card interactive className="h-full">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {campaign.brand}
              </div>
              <h3 className="mt-1 truncate text-base font-semibold">
                {campaign.title}
              </h3>
            </div>
            <Badge variant={meta.variant}>
              <meta.Icon className="h-3 w-3" />
              {meta.label}
            </Badge>
          </div>

          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
            {campaign.description}
          </p>

          <div className="mt-5 space-y-2">
            <ScoreBar
              label="Authenticity"
              value={campaign.authenticity_score}
              tone="good"
            />
            <ScoreBar
              label="Deepfake risk"
              value={campaign.deepfake_score}
              tone="bad"
            />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span>{formatRelative(campaign.submitted_at)}</span>
            {campaign.blockchain_tx ? (
              <span className="font-mono">
                {truncateAddress(campaign.blockchain_tx)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-primary">
                View <ArrowRight className="h-3 w-3" />
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ScoreBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "bad";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{clamped.toFixed(1)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            background:
              tone === "good"
                ? "linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))"
                : "linear-gradient(90deg, hsl(var(--warning)), hsl(var(--danger)))",
          }}
        />
      </div>
    </div>
  );
}
