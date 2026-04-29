"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage } from "@/lib/api-client";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!email.trim()) {
      setMessage("Enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password/request-otp", {
        email: email.trim(),
      });
      router.push(
        `/auth/otp?email=${encodeURIComponent(email.trim())}`,
      );
    } catch (err) {
      setMessage(apiErrorMessage(err, "Could not send reset email."));
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
        <h1 className="text-xl font-bold text-[#0F172A] mb-4">Forgot password</h1>
        <p className="text-sm text-[#475569] mb-4">
          We’ll email a one-time code if this account exists.
        </p>

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

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2563EB] text-white"
        >
          {loading ? "Sending…" : "Send code"}
        </Button>

        <p className="text-sm text-center text-[#475569] mt-3">
          <Link className="text-[#2563EB] hover:underline" href="/auth/login">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
