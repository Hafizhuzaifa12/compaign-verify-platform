import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  LinkIcon,
  Eye,
  Lock,
  ArrowRight,
  CheckCircle2,
  Activity,
  Zap,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundGlow />
      <Header />
      <main className="relative">
        <Hero />
        <LogoStrip />
        <Features />
        <HowItWorks />
        <Stats />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function BackgroundGlow() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, hsl(var(--primary) / 0.35) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-20%] top-[40%] h-[400px] w-[400px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, hsl(var(--accent) / 0.18) 0%, transparent 70%)",
        }}
      />
    </>
  );
}

function Header() {
  return (
    <header className="relative z-20">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-base font-semibold tracking-tight">
            Verit
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how" className="hover:text-foreground transition-colors">
            How it works
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Docs
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="gradient" size="sm">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-lg bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.7)]">
      <ShieldCheck className="h-4 w-4 text-white" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <Badge variant="primary" className="mb-6">
            <Sparkles className="h-3 w-3" />
            New · v0.1 launched with on-chain attestations
          </Badge>
          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
            Proof of <span className="gradient-text">authentic</span>
            <br />
            campaigns.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            Verit scans every campaign for deepfakes, manipulated claims, and
            synthetic media — then publishes an immutable trust badge backed by
            blockchain attestations.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/auth/register">
              <Button variant="gradient" size="lg">
                Verify your first campaign
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how">
              <Button variant="outline" size="lg">
                See how it works
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            No credit card required · 25 free verifications · SOC 2 in progress
          </p>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl animate-fade-in-up">
      <div className="glow-border overflow-hidden rounded-2xl bg-card/70 backdrop-blur-xl">
        <div className="border-b border-border bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
            <span className="ml-3 text-xs text-muted-foreground">
              app.verit.io / campaigns / cmp_847f
            </span>
          </div>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-3">
          <Card interactive className="md:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Authenticity
                </span>
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  97.4
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--accent)),hsl(var(--primary)))]"
                  style={{ width: "97.4%" }}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                No deepfake artifacts detected
              </p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Recent verifications
                </span>
                <span className="text-xs text-success flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Live
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { name: "Aurora — Spring Drop", score: 98, status: "verified" },
                  { name: "Nova PSA — Vote 2026", score: 94, status: "verified" },
                  { name: "Helios Q2 Brand", score: 71, status: "flagged" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-sm">{c.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {c.score}
                      </span>
                      <Badge
                        variant={c.status === "verified" ? "success" : "warning"}
                      >
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LogoStrip() {
  const partners = ["Aurora", "Nova", "Helios", "Northwind", "Polaris", "Cipher"];
  return (
    <section className="border-y border-border/60 bg-card/30 py-10">
      <div className="container">
        <p className="text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Trusted by brand & policy teams at
        </p>
        <div className="mt-6 grid grid-cols-2 gap-6 opacity-70 sm:grid-cols-3 md:grid-cols-6">
          {partners.map((p) => (
            <div
              key={p}
              className="text-center text-lg font-medium tracking-tight text-muted-foreground"
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: Eye,
      title: "Deepfake detection",
      body: "Per-frame analysis using vision transformers flags synthetic faces, lip-sync drift, and GAN artifacts in seconds.",
    },
    {
      icon: Sparkles,
      title: "Authenticity scoring",
      body: "A composite 0–100 score combines content provenance, source consistency, and language manipulation signals.",
    },
    {
      icon: LinkIcon,
      title: "On-chain proofs",
      body: "Every verdict is hashed and written to a public registry contract so trust badges can never be forged.",
    },
    {
      icon: Lock,
      title: "Audit-ready trail",
      body: "Full submission, evidence, and verifier history is timestamped, signed, and exportable for compliance.",
    },
    {
      icon: Zap,
      title: "Fast by default",
      body: "Streaming inference returns first signal in under 800ms — embed the badge before a campaign even ships.",
    },
    {
      icon: ShieldCheck,
      title: "Privacy preserving",
      body: "Media is processed in isolated workers and discarded post-verification; only the hash is persisted.",
    },
  ];
  return (
    <section id="features" className="py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary">
            <Sparkles className="h-3 w-3" /> Why Verit
          </Badge>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for the AI-generated content era
          </h2>
          <p className="mt-3 text-muted-foreground">
            From deepfake political ads to synthetic brand spokespeople — Verit
            gives your audience a reason to believe what they see.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <Card key={f.title} interactive>
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Submit",
      body: "Upload media or paste a URL. We accept image, video, audio, and copy.",
    },
    {
      n: "02",
      title: "Analyze",
      body: "Multimodal models score authenticity, detect tampering, and verify claims.",
    },
    {
      n: "03",
      title: "Attest",
      body: "Verdict + content hash committed to the CampaignRegistry contract.",
    },
    {
      n: "04",
      title: "Share",
      body: "Drop the public trust badge anywhere your campaign ships.",
    },
  ];
  return (
    <section id="how" className="border-y border-border/60 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary">
            <Activity className="h-3 w-3" /> Workflow
          </Badge>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            From upload to attestation in under a minute
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.n} className="relative overflow-hidden">
              <CardContent className="p-6">
                <span className="font-mono text-xs text-primary">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "98.6%", l: "Deepfake detection recall" },
    { v: "780ms", l: "Median first signal" },
    { v: "11M", l: "Frames analyzed monthly" },
    { v: "100%", l: "On-chain attestations" },
  ];
  return (
    <section className="py-24">
      <div className="container grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.l}>
            <CardContent className="p-6">
              <div className="text-4xl font-semibold tracking-tight gradient-text">
                {s.v}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.l}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24">
      <div className="container">
        <Card className="glow-border overflow-hidden">
          <CardContent className="grid gap-10 p-10 md:grid-cols-[1.4fr_1fr] md:items-center md:p-14">
            <div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Ship campaigns the world can <span className="gradient-text">trust</span>.
              </h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                Spin up a workspace in 60 seconds. Verify your first campaign
                free. No card, no contract.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/register">
                  <Button variant="gradient" size="lg">
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    View live demo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute inset-0 -m-6 rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--accent)/0.18))] blur-2xl" />
              <Card className="relative">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="relative grid h-2 w-2 place-items-center">
                      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                    </span>
                    Live attestation
                  </div>
                  <div className="mt-3 font-mono text-xs text-muted-foreground break-all">
                    0xa4f1…c92b — block #18,294,771
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="text-2xl font-semibold">97.4</div>
                      <div className="text-xs text-muted-foreground">
                        Authenticity
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="text-2xl font-semibold">0.6%</div>
                      <div className="text-xs text-muted-foreground">
                        Deepfake risk
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-border/60 py-10">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <Logo />
          <span>© {new Date().getFullYear()} Verit. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Security</a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
