"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage, clearTokens, getAccessToken } from "@/lib/api-client";
import { formatMaxAvatarSize, MAX_AVATAR_BYTES } from "@/lib/upload-limits";
import type { UserMe } from "@/lib/types/user";

const labelCls = "mb-2 block text-sm font-medium text-[var(--text-body)]";
const inputCls = "mb-4 h-12 rounded-lg text-base";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<UserMe>("/users/me");
        if (cancelled) return;
        if (!data.needs_profile_completion) {
          router.replace("/dashboard");
          return;
        }
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        if (data.avatar_url) setPreviewUrl(data.avatar_url);
      } catch {
        if (!cancelled) setMessage("Could not load your profile.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!avatar) {
      return;
    }
    const url = URL.createObjectURL(avatar);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!fullName.trim()) {
      setMessage("Full name is required.");
      return;
    }
    if (avatar && avatar.size > MAX_AVATAR_BYTES) {
      setMessage(`Photo is too large (max ${formatMaxAvatarSize()}).`);
      return;
    }
    setLoading(true);
    try {
      await apiClient.patch<UserMe>("/users/me", {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      });
      if (avatar) {
        const fd = new FormData();
        fd.append("file", avatar);
        await apiClient.post<UserMe>("/users/me/avatar", fd);
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setMessage(apiErrorMessage(err, "Could not save profile."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] w-full flex-col bg-white px-4 py-10 sm:px-6 md:min-h-screen md:px-10">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-2xl rounded-2xl border border-[var(--border-default)] bg-white p-8 shadow-sm sm:p-10"
      >
        <div className="mb-8">
          <h1
            className="mb-2 text-[28px] font-bold leading-tight text-[var(--text-heading)] sm:text-[32px]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Complete your profile
          </h1>
          <p className="text-base text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Add a few details so your account is ready to use.
          </p>
        </div>

        {message ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}

        <div className="space-y-1">
          <label htmlFor="complete-fullName" className={labelCls}>
            Full name <span className="text-red-600">*</span>
          </label>
          <Input
            id="complete-fullName"
            type="text"
            name="fullName"
            autoComplete="name"
            placeholder="Jane Doe"
            className={inputCls}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="complete-phone" className={labelCls}>
            Phone <span className="font-normal text-[var(--text-muted)]">(optional)</span>
          </label>
          <Input
            id="complete-phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="+1 …"
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="complete-displayName" className={labelCls}>
            Display name <span className="font-normal text-[var(--text-muted)]">(optional, unique)</span>
          </label>
          <Input
            id="complete-displayName"
            type="text"
            name="displayName"
            autoComplete="username"
            placeholder="@yourhandle"
            className={inputCls}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="complete-bio" className={labelCls}>
            Bio <span className="font-normal text-[var(--text-muted)]">(optional)</span>
          </label>
          <textarea
            id="complete-bio"
            name="bio"
            placeholder="Short intro…"
            className="mb-4 min-h-[100px] w-full rounded-lg border border-input bg-transparent px-3 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="complete-avatar" className={labelCls}>
            Profile photo <span className="font-normal text-[var(--text-muted)]">(optional, max {formatMaxAvatarSize()})</span>
          </label>
          <Input
            id="complete-avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="cursor-pointer rounded-lg text-base file:mr-3 file:rounded-md file:border-0 file:bg-[var(--surface-subtle)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--text-heading)]"
            onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
          />
        </div>

        {previewUrl ? (
          <div className="mb-6 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="h-20 w-20 rounded-full border-2 border-[var(--border-default)] object-cover ring-2 ring-[var(--surface-subtle)]"
            />
            <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Preview — saved when you continue.
            </p>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={loading}
          className="mb-4 h-12 w-full cursor-pointer rounded-lg bg-[var(--brand-primary)] text-base font-medium text-white hover:opacity-95"
        >
          {loading ? "Saving…" : "Save and continue"}
        </Button>

        <p className="text-center text-sm text-[var(--text-soft)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
          <Link
            className="font-medium text-[var(--brand-primary)] hover:underline"
            href="/auth/login"
            onClick={() => clearTokens()}
          >
            Use a different account
          </Link>
        </p>
      </form>
    </div>
  );
}
