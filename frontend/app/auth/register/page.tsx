"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage, setTokens } from "@/lib/api-client";

type RegisterResponse = {
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
};

const PASSWORD_RE = /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter email and password.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    if (!PASSWORD_RE.test(password)) {
      setMessage(
        "Password must be 8+ characters and include a number and a special character (matches the server).",
      );
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post<RegisterResponse>("/auth/register", {
        email: email.trim(),
        password,
      });
      setTokens(data.access_token, data.refresh_token);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setMessage(
        apiErrorMessage(err, "Could not register. The email may already be in use."),
      );
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
        <h1 className="text-2xl font-bold text-[#0F172A] mb-4">Register</h1>

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
          autoComplete="new-password"
          placeholder="Password"
          className="mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Confirm password"
          className="mb-3"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2563EB] text-white"
        >
          {loading ? "Registering…" : "Register"}
        </Button>

        <p className="text-sm text-center text-[#475569] mt-3">
          Already have an account?{" "}
          <Link className="text-[#2563EB] hover:underline" href="/auth/login">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
