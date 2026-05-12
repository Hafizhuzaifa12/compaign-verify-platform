import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { CampaignForm } from "@/components/forms/CampaignForm";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Submit campaign" };

export default function SubmitCampaignPage() {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, hsl(var(--primary) / 0.18) 0%, transparent 70%)",
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

      <main className="relative container max-w-3xl py-12">
        <div className="mb-8 animate-fade-in-up">
          <Badge variant="primary" className="mb-3">
            <Sparkles className="h-3 w-3" /> New verification
          </Badge>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Submit a campaign for verification
          </h1>
          <p className="mt-2 text-muted-foreground">
            We will analyze media authenticity, scan for deepfake artifacts,
            and publish an on-chain attestation in under a minute.
          </p>
        </div>

        <CampaignForm />
      </main>
    </div>
  );
}
