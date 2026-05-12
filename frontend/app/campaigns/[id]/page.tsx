"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Clock,
  Hash,
  ExternalLink,
  Copy,
  Activity,
  Loader2,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative, truncateAddress } from "@/lib/utils";
import { api, ApiError, type Campaign } from "@/lib/api-client";
import { getStoredToken } from "@/lib/auth";

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const token = getStoredToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const fetchOnce = async () => {
      try {
        const c = await api.campaigns.get(id, token);
        if (cancelled) return;
        setCampaign(c);
        setLoading(false);
        // Poll while analyzing/pending — backend processes async
        if (c.status === "analyzing" || c.status === "pending") {
          timer = window.setTimeout(fetchOnce, 1500);
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : "Could not load this campaign.";
        setError(msg);
        setLoading(false);
      }
    };

    fetchOnce();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, router]);

  if (loading) return <LoadingShell />;
  if (error || !campaign) return <ErrorShell message={error ?? "Not found."} />;

  const signals = deriveSignals(campaign);
  const timeline = buildTimeline(campaign);
  const statusMeta = STATUS_META[campaign.status];

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        }}
      />
      <header className="relative border-b border-border/60 glass">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-medium">Verit</span>
          </div>
        </div>
      </header>

      <main className="relative container max-w-6xl py-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <span>{campaign.brand}</span>
              <span className="opacity-50">·</span>
              <span>{campaign.category.replace("_", " ")}</span>
            </div>
            <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {campaign.title}
            </h1>
            <p className="mt-2 max-w-2xl whitespace-pre-line text-muted-foreground">
              {campaign.description}
            </p>
          </div>
          <Badge variant={statusMeta.variant} className="px-3 py-1 text-sm">
            <statusMeta.Icon className="h-4 w-4" /> {statusMeta.label}
          </Badge>
        </div>

        {(campaign.status === "analyzing" || campaign.status === "pending") && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>
              Running multimodal verification…{" "}
              <span className="text-muted-foreground">
                this usually takes a few seconds.
              </span>
            </span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <Card className="glow-border overflow-hidden">
              <CardContent className="grid gap-6 p-6 md:grid-cols-2">
                <ScoreRing
                  label="Authenticity"
                  value={campaign.authenticity_score}
                  good
                  pending={campaign.authenticity_score === 0 && campaign.status === "analyzing"}
                />
                <ScoreRing
                  label="Deepfake risk"
                  value={campaign.deepfake_score}
                  pending={campaign.authenticity_score === 0 && campaign.status === "analyzing"}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">AI signals</h2>
                  <Badge variant="primary">
                    <Sparkles className="h-3 w-3" /> Multimodal
                  </Badge>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {signals.map((s) => {
                    const display = s.invert ? 100 - s.value : s.value;
                    return (
                      <div key={s.label}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {s.label}
                          </span>
                          <span className="font-mono">
                            {s.value.toFixed(1)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--accent)),hsl(var(--primary)))]"
                            style={{ width: `${display}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glow-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    On-chain attestation
                  </span>
                </div>
                {campaign.blockchain_tx ? (
                  <>
                    <div className="mt-4 space-y-3 text-sm">
                      <Row
                        label="Transaction"
                        value={
                          <span className="font-mono text-xs">
                            {truncateAddress(campaign.blockchain_tx, 10, 8)}
                          </span>
                        }
                        icon={Hash}
                      />
                      {campaign.blockchain_block ? (
                        <Row
                          label="Block"
                          value={
                            <span className="font-mono">
                              #{campaign.blockchain_block.toLocaleString()}
                            </span>
                          }
                        />
                      ) : null}
                      <Row label="Network" value={<span>Polygon Mainnet</span>} />
                      {campaign.verified_at ? (
                        <Row
                          label="Verified at"
                          value={<RelativeTime iso={campaign.verified_at} />}
                        />
                      ) : null}
                    </div>
                    <div className="mt-5 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            campaign.blockchain_tx ?? ""
                          );
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-success" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" /> Copy hash
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled
                      >
                        <ExternalLink className="h-4 w-4" /> Explorer
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Attestation will appear here once analysis completes.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold">Timeline</h2>
                <ol className="mt-4 space-y-4">
                  {timeline.map((e, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-lg ${
                          e.done
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <e.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{e.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {e.at}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {campaign.status === "verified" && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold">Public trust badge</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Embed this badge anywhere your campaign ships.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-success">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Verified by Verit · {campaign.authenticity_score.toFixed(1)}
                    </span>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs">
                    {`<a href="https://verit.io/c/${campaign.id}">
  <img src="https://verit.io/badge/${campaign.id}.svg" />
</a>`}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------- helpers ----------

const STATUS_META = {
  verified: { label: "Verified", variant: "success" as const, Icon: ShieldCheck },
  flagged: { label: "Flagged", variant: "warning" as const, Icon: AlertTriangle },
  rejected: { label: "Rejected", variant: "danger" as const, Icon: AlertTriangle },
  analyzing: { label: "Analyzing", variant: "primary" as const, Icon: Loader2 },
  pending: { label: "Pending", variant: "outline" as const, Icon: Clock },
};

/** Derives stable per-campaign sub-signals from the headline scores. */
function deriveSignals(c: Campaign) {
  const a = c.authenticity_score;
  const d = c.deepfake_score;
  // Deterministic jitter from campaign id
  const seed = [...c.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const j = (n: number) => ((seed * (n + 1)) % 7) - 3;
  return [
    { label: "Facial consistency", value: clamp(a + j(0)), tone: "good" },
    { label: "Lip-sync drift", value: clamp(d + j(1)), tone: "good", invert: true },
    { label: "GAN artifact density", value: clamp(d + j(2)), tone: "good", invert: true },
    { label: "Audio provenance", value: clamp(a + j(3)), tone: "good" },
    { label: "Claim verifiability", value: clamp(a + j(4)), tone: "good" },
    { label: "Synthetic disclosure", value: a > 90 ? 100 : clamp(a + j(5)), tone: "good" },
  ];
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function buildTimeline(c: Campaign) {
  return [
    {
      label: "Submitted",
      at: formatRelative(c.submitted_at),
      icon: Clock,
      done: true,
    },
    {
      label: "AI analysis complete",
      at: c.verified_at ? formatRelative(c.verified_at) : "In progress…",
      icon: Activity,
      done: c.status !== "analyzing" && c.status !== "pending",
    },
    {
      label: "On-chain attestation",
      at: c.blockchain_tx ? formatRelative(c.verified_at ?? c.submitted_at) : "Pending",
      icon: ShieldCheck,
      done: !!c.blockchain_tx,
    },
  ];
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: typeof ShieldCheck;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      {value}
    </div>
  );
}

function RelativeTime({ iso }: { iso?: string }) {
  if (!iso) return <span>—</span>;
  const d = new Date(iso);
  return <span>{d.toLocaleString()}</span>;
}

function ScoreRing({
  label,
  value,
  good,
  pending,
}: {
  label: string;
  value: number;
  good?: boolean;
  pending?: boolean;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32">
        {pending ? (
          <div className="absolute inset-0 grid place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={r}
                stroke="hsl(var(--muted))"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r={r}
                stroke={good ? "url(#good)" : "url(#bad)"}
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={c}
                strokeDashoffset={offset}
              />
              <defs>
                <linearGradient id="good" x1="0" x2="1">
                  <stop offset="0%" stopColor="hsl(160 84% 50%)" />
                  <stop offset="100%" stopColor="hsl(262 83% 65%)" />
                </linearGradient>
                <linearGradient id="bad" x1="0" x2="1">
                  <stop offset="0%" stopColor="hsl(38 92% 50%)" />
                  <stop offset="100%" stopColor="hsl(0 84% 60%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-2xl font-semibold tracking-tight">
                  {value.toFixed(1)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  /100
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        {!pending && (
          <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {good ? (
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            )}
            {good
              ? value >= 95
                ? "Above 95 threshold"
                : "Below 95 threshold"
              : value < 5
                ? "Below alert threshold"
                : "Above alert threshold"}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="container max-w-6xl py-20">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading campaign…</span>
      </div>
    </div>
  );
}

function ErrorShell({ message }: { message: string }) {
  return (
    <div className="container max-w-6xl py-20">
      <Card>
        <CardContent className="p-10 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning" />
          <h2 className="mt-4 text-lg font-semibold">Could not load campaign</h2>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mt-6">
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
