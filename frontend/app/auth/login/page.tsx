"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(email, password);
      if (typeof window !== "undefined") {
        localStorage.setItem("verit:token", res.access_token);
        localStorage.setItem("verit:user", JSON.stringify(res.user));
      }
      router.push("/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not sign in. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to continue verifying campaigns.
        </p>
      </div>

      <Card className="glow-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              id="email"
              label="Work email"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@brand.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              id="password"
              label="Password"
              icon={Lock}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to Verit?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-foreground hover:text-primary"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By signing in you agree to our{" "}
        <a href="#" className="underline-offset-4 hover:underline">
          Terms
        </a>{" "}
        &{" "}
        <a href="#" className="underline-offset-4 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
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
