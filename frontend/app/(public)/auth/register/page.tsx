"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage, getAccessToken, setTokens } from "@/lib/api-client";
import { formatMaxAvatarSize, MAX_AVATAR_BYTES } from "@/lib/upload-limits";
import type { UserMe } from "@/lib/types/user";

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
      <div className="flex min-h-[50vh] items-center justify-center bg-[var(--surface-page)] text-sm text-[var(--text-muted)]">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col justify-center bg-white px-6 py-12 md:min-h-screen md:px-10">
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg">
        <div className="mb-10">
          <h1
            className="text-[28px] font-bold leading-tight text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Create your account
          </h1>
          <p
            className="mt-2 text-[14px] text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Get started in minutes
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
          <label className="mb-2 block text-sm font-medium text-[var(--text-body)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
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
            className="h-12 w-full cursor-pointer rounded-lg bg-[var(--brand-primary)] text-base font-medium text-white"
          >
            {loading ? "Registering…" : "Register"}
          </Button>

          <p className="mt-6 text-center text-sm text-[var(--text-soft)]">
            Already have an account?{" "}
            <Link className="font-medium text-[var(--brand-primary)] hover:underline" href="/auth/login">
              Sign in
            </Link>
          </p>
      </form>
    </div>
  );
}
