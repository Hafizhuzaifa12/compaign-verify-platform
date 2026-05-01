"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage, getAccessToken, setTokens } from "@/lib/api-client";
import type { UserMe } from "@/lib/types/user";
import { ShieldLogoIcon } from "@/components/icons/shield-logo";

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = getAccessToken();
    if (!token) {
      setSessionReady(true);
      return;
    }
    apiClient
      .get<UserMe>("/users/me")
      .then((me) => {
        if (cancelled) return;
        if (me.data.needs_profile_completion) {
          router.replace("/auth/complete-profile");
        } else {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        if (!cancelled) setSessionReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!email.trim() || !password) {
      setMessage("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post<LoginResponse>("/auth/login", {
        email: email.trim(),
        password,
      });
      setTokens(data.access_token, data.refresh_token);
      const me = await apiClient.get<UserMe>("/users/me");
      if (me.data.needs_profile_completion) {
        router.push("/auth/complete-profile");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setMessage(apiErrorMessage(err, "Login failed. Check your details."));
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F1F5F9] text-sm text-[#64748B]">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-64px)] w-full flex-col bg-[#F1F5F9] md:min-h-[calc(100vh-64px)] md:flex-row md:items-stretch">
      {/* Left visual panel — same brand bg as navbar; hidden on mobile */}
      <div className="relative hidden w-full shrink-0 overflow-hidden bg-[var(--site-nav-bg)] text-white md:flex md:min-h-[calc(100vh-64px)] md:w-2/5 md:flex-col">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute left-8 top-24 h-72 w-72 rounded-full border-2 border-white" />
          <div className="absolute bottom-32 right-4 h-96 w-96 rounded-full border-2 border-white opacity-20" />
          <div className="absolute left-1/3 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-white opacity-10" />
        </div>
        <div className="relative z-10 flex h-full flex-col p-12">
          <div
            className="flex items-center gap-2 font-semibold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            <ShieldLogoIcon className="text-white" />
            Campaign Verify
          </div>
          <div className="flex max-w-lg flex-1 flex-col justify-center">
            <h2
              className="mb-4 text-[36px] font-bold leading-tight text-white"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Verify with confidence.
            </h2>
            <p className="mb-12 text-base text-white/70" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Secure campaign checks with AI-backed insights and transparent results.
            </p>
            <ul
              className="mt-auto space-y-3 text-[14px] text-white"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              <li>✓ Instant verification</li>
              <li>✓ Full transparency</li>
              <li>✓ Trusted by 500+ orgs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right — form (wider card, larger touch targets; mobile uses full width + padding) */}
      <div className="flex w-full flex-1 flex-col justify-center bg-white px-4 py-8 sm:px-6 sm:py-10 md:w-3/5 md:px-8 md:py-10 lg:px-12">
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-md sm:p-10 md:p-12"
        >
          <div className="mb-10">
            <h1
              className="mb-3 text-[32px] font-bold leading-tight text-[#0F172A] sm:text-[34px]"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Welcome back
            </h1>
            <p
              className="text-base text-[#475569] sm:text-[17px]"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              Sign in to your account
            </p>
          </div>

          {message ? (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {message}
            </p>
          ) : null}

          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            className="mb-4 h-12 rounded-lg text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            className="mb-6 h-12 rounded-lg text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            disabled={loading}
            className="mb-6 h-12 w-full cursor-pointer rounded-lg bg-[#2563EB] text-base font-medium text-white"
          >
            {loading ? "Signing in…" : "Login"}
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-sm text-[#475569] sm:text-left">
              <Link className="font-medium text-[#2563EB] hover:underline" href="/auth/register">
                Create an account
              </Link>
            </p>
            <Link
              href="/auth/forgot-password"
              className="text-center text-sm font-medium text-[#475569] hover:text-[#0F172A] sm:text-right"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
