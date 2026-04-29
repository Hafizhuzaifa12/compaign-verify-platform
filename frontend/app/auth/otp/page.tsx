"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage } from "@/lib/api-client";

const PASSWORD_RE = /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

function OtpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!email) {
      setMessage("Start from “Forgot password” so your email is included.");
      return;
    }
    if (!otp.trim() || !newPassword) {
      setMessage("Enter the code and your new password.");
      return;
    }
    if (newPassword !== confirm) {
      setMessage("New passwords do not match.");
      return;
    }
    if (!PASSWORD_RE.test(newPassword)) {
      setMessage("Password must be 8+ characters with a number and a special character.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password/reset", {
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      router.push("/auth/login");
    } catch (err) {
      setMessage(
        apiErrorMessage(err, "Invalid or expired code, or password not accepted."),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
        <div className="bg-white p-8 rounded-lg shadow w-96 border">
          <h1 className="text-xl font-bold mb-4">Reset password</h1>
          <p className="text-sm text-[#475569] mb-4">
            Open this page from{" "}
            <Link className="text-[#2563EB] hover:underline" href="/auth/forgot-password">
              forgot password
            </Link>{" "}
            first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow w-96 border"
      >
        <h1 className="text-xl font-bold text-[#0F172A] mb-1">Enter code & new password</h1>
        <p className="text-sm text-[#64748B] mb-4 truncate" title={email}>
          {email}
        </p>

        {message ? (
          <p className="text-sm text-red-600 mb-3" role="alert">
            {message}
          </p>
        ) : null}

        <Input
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code"
          className="mb-3"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <Input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="New password"
          className="mb-3"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          type="password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Confirm new password"
          className="mb-3"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2563EB] text-white"
        >
          {loading ? "Submitting…" : "Update password"}
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

export default function OTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] p-6">
          Loading…
        </div>
      }
    >
      <OtpForm />
    </Suspense>
  );
}
