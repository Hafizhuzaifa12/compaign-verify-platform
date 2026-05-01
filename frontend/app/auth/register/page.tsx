"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage, getAccessToken, setTokens } from "@/lib/api-client";
import { formatMaxAvatarSize, MAX_AVATAR_BYTES } from "@/lib/upload-limits";
import type { UserMe } from "@/lib/types/user";
import { ShieldLogoIcon } from "@/components/icons/shield-logo";

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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
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

    if (!email.trim() || !password || !fullName.trim()) {
      setMessage("Please enter email, password, and full name.");
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
    if (avatar && avatar.size > MAX_AVATAR_BYTES) {
      setMessage(
        `Profile photo is too large (max ${formatMaxAvatarSize()}). Remove it or choose a smaller file.`,
      );
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post<RegisterResponse>("/auth/register", {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      setTokens(data.access_token, data.refresh_token);
      if (avatar) {
        const fd = new FormData();
        fd.append("file", avatar);
        try {
          await apiClient.post<UserMe>("/users/me/avatar", fd);
        } catch (avatarErr) {
          console.warn("Avatar upload failed:", avatarErr);
        }
      }
      const me = await apiClient.get<UserMe>("/users/me");
      if (me.data.needs_profile_completion) {
        router.push("/auth/complete-profile");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setMessage(
        apiErrorMessage(err, "Could not register. The email may already be in use."),
      );
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
      <div className="relative hidden w-full shrink-0 overflow-hidden bg-[var(--site-nav-bg)] text-white md:flex md:min-h-[calc(100vh-64px)] md:w-2/5 md:flex-col">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute right-12 top-16 h-56 w-56 rounded-full border-2 border-white" />
          <div className="absolute bottom-20 left-8 h-80 w-80 rounded-full border-2 border-white opacity-20" />
          <div className="absolute left-1/4 top-1/3 h-40 w-40 rounded-full bg-white opacity-15" />
        </div>
        <div className="relative z-10 flex h-full min-h-0 flex-col p-8 md:p-10">
          <div
            className="mb-8 flex shrink-0 items-center gap-2 font-semibold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            <ShieldLogoIcon className="text-white" />
            Campaign Verify
          </div>
          <div className="flex max-w-lg flex-1 flex-col justify-center gap-8">
            <div>
              <h2
                className="mb-4 text-[36px] font-bold leading-tight text-white"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Join the platform.
              </h2>
              <p className="text-base text-white/70" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                Create your profile and start submitting campaigns for verification in minutes.
              </p>
            </div>
            <ul
              className="space-y-3 text-[14px] text-white"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              <li>✓ Instant verification</li>
              <li>✓ Full transparency</li>
              <li>✓ Trusted by 500+ orgs</li>
            </ul>
          </div>
        </div>
      </div>

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
              Create your account
            </h1>
            <p
              className="text-base text-[#475569] sm:text-[17px]"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              Start verifying campaigns today
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
            type="text"
            name="fullName"
            autoComplete="name"
            placeholder="Full name"
            className="mb-4 h-12 rounded-lg text-base"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="Phone (optional)"
            className="mb-4 h-12 rounded-lg text-base"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            type="text"
            name="displayName"
            autoComplete="username"
            placeholder="Display name (optional)"
            className="mb-4 h-12 rounded-lg text-base"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <textarea
            name="bio"
            placeholder="Bio (optional)"
            className="mb-4 min-h-[88px] w-full rounded-lg border border-input bg-transparent px-3 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
          />
          <label className="mb-2 block text-sm font-medium text-[#334155]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Profile photo (optional, max {formatMaxAvatarSize()})
          </label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mb-4 rounded-lg text-base"
            onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
          />
          <Input
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Password"
            className="mb-4 h-12 rounded-lg text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            name="confirm"
            autoComplete="new-password"
            placeholder="Confirm password"
            className="mb-6 h-12 rounded-lg text-base"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full cursor-pointer rounded-lg bg-[#2563EB] text-base font-medium text-white"
          >
            {loading ? "Registering…" : "Register"}
          </Button>

          <p className="mt-6 text-center text-sm text-[#475569]">
            Already have an account?{" "}
            <Link className="font-medium text-[#2563EB] hover:underline" href="/auth/login">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
