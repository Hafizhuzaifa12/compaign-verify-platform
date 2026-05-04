"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage, getAccessToken, setTokens } from "@/lib/api-client";
import type { UserMe } from "@/lib/types/user";

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
      <div className="flex min-h-[50vh] items-center justify-center bg-white text-sm text-[var(--text-muted)]">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] w-full flex-col justify-center bg-white px-6 py-12 md:min-h-screen md:px-10">
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm">
        <h1
          className="text-[28px] font-bold leading-tight text-[var(--text-heading)]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          Welcome back
        </h1>
        <p
          className="mb-8 mt-2 text-[14px] text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          Sign in to your account
        </p>

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
          className="mb-6 h-12 w-full cursor-pointer rounded-lg bg-[var(--brand-primary)] text-base font-medium text-white"
        >
          {loading ? "Signing in…" : "Login"}
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-[var(--text-soft)] sm:text-left">
            Don&apos;t have an account?{" "}
            <Link className="font-medium text-[var(--brand-primary)] hover:underline" href="/auth/register">
              Register
            </Link>
          </p>
          <Link
            href="/auth/forgot-password"
            className="text-center text-sm font-medium text-[var(--text-soft)] hover:text-[var(--text-heading)] sm:text-right"
          >
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}
