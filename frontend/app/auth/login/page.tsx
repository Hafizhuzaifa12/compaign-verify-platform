"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage, setTokens } from "@/lib/api-client";

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
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setMessage(apiErrorMessage(err, "Login failed. Check your details."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow w-96 border"
      >
        <h1 className="text-2xl font-bold text-[#0F172A] mb-4">Login</h1>

        {message ? (
          <p className="text-sm text-red-600 mb-3" role="alert">
            {message}
          </p>
        ) : null}

        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          className="mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          className="mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2563EB] text-white mb-2"
        >
          {loading ? "Signing in…" : "Login"}
        </Button>

        <p className="text-sm text-center text-[#475569]">
          <Link className="text-[#2563EB] hover:underline" href="/auth/register">
            Create an account
          </Link>
        </p>

        <Link href="/auth/forgot-password">
          <p className="text-sm text-right text-[#475569] cursor-pointer mt-2">
            Forgot password?
          </p>
        </Link>
      </form>
    </div>
  );
}
