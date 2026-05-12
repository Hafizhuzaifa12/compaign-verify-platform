"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Mail,
  Lock,
  User,
  Building2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    organization: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.register({
        full_name: form.full_name,
        organization: form.organization || undefined,
        email: form.email,
        password: form.password,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("verit:token", res.access_token);
        localStorage.setItem("verit:user", JSON.stringify(res.user));
      }
      router.push("/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not create account.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid w-full max-w-5xl animate-fade-in-up gap-10 md:grid-cols-2 md:items-center">
      <div className="hidden md:block">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Start verifying <span className="gradient-text">trust</span> in your
          campaigns.
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Create your free workspace and ship your first attested campaign in
          under five minutes.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          {[
            "25 free verifications every month",
            "On-chain attestations & public trust badge",
            "API + webhook access",
            "No credit card required",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-6 md:hidden">
          <h1 className="text-3xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Free 25 verifications. No card needed.
          </p>
        </div>

        <Card className="glow-border">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                id="full_name"
                label="Full name"
                icon={User}
                placeholder="Your full name"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                required
              />
              <Field
                id="organization"
                label="Organization (optional)"
                icon={Building2}
                placeholder="Company, team, or project"
                value={form.organization}
                onChange={(e) => update("organization", e.target.value)}
              />
              <Field
                id="email"
                label="Work email"
                icon={Mail}
                type="email"
                autoComplete="email"
                placeholder="you@brand.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
              <Field
                id="password"
                label="Password"
                icon={Lock}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />

              {error && (
                <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    Create free account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-foreground hover:text-primary"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} className="pl-10" {...props} />
      </div>
    </div>
  );
}
