"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage, clearTokens, getAccessToken } from "@/lib/api-client";
import { formatMaxAvatarSize, MAX_AVATAR_BYTES } from "@/lib/upload-limits";
import type { UserMe } from "@/lib/types/user";
import { ShieldLogoIcon } from "@/components/icons/shield-logo";

const labelCls = "mb-2 block text-sm font-medium text-[#334155]";
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
    <div className="flex min-h-[calc(100dvh-64px)] w-full flex-col bg-[#F1F5F9] md:min-h-[calc(100vh-64px)] md:flex-row md:items-stretch">
      <aside className="relative hidden w-full shrink-0 overflow-hidden bg-[var(--site-nav-bg)] text-white md:flex md:min-h-[calc(100vh-64px)] md:w-2/5 md:flex-col">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute left-8 top-20 h-64 w-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-24 right-6 h-80 w-80 rounded-full border-2 border-white opacity-20" />
          <div className="absolute left-1/3 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-white opacity-10" />
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
                className="mb-4 text-[32px] font-bold leading-tight text-white md:text-[36px]"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Almost there.
              </h2>
              <p className="text-base leading-relaxed text-white/70" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                Add a few details so we can verify your campaigns and show your name across the dashboard.
              </p>
            </div>
            <ul
              className="space-y-3 text-[14px] text-white"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              <li>✓ Verified identity on submissions</li>
              <li>✓ Clear display name for your team</li>
              <li>✓ Optional photo & bio — your choice</li>
            </ul>
          </div>
        </div>
      </aside>

      <div className="flex w-full flex-1 flex-col justify-center bg-white px-4 py-8 sm:px-6 sm:py-10 md:w-3/5 md:px-8 md:py-10 lg:px-12">
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-md sm:p-10 md:p-12"
        >
          <div className="mb-8">
            <h1
              className="mb-2 text-[28px] font-bold leading-tight text-[#0F172A] sm:text-[32px]"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Complete your profile
            </h1>
            <p className="text-base text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
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
              Phone <span className="font-normal text-[#64748B]">(optional)</span>
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
              Display name <span className="font-normal text-[#64748B]">(optional, unique)</span>
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
              Bio <span className="font-normal text-[#64748B]">(optional)</span>
            </label>
            <textarea
              id="complete-bio"
              name="bio"
              placeholder="Short intro…"
              className="mb-4 min-h-[100px] w-full rounded-lg border border-input bg-transparent px-3 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="complete-avatar" className={labelCls}>
              Profile photo <span className="font-normal text-[#64748B]">(optional, max {formatMaxAvatarSize()})</span>
            </label>
            <Input
              id="complete-avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="cursor-pointer rounded-lg text-base file:mr-3 file:rounded-md file:border-0 file:bg-[#F1F5F9] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#0F172A]"
              onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
            />
          </div>

          {previewUrl ? (
            <div className="mb-6 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="h-20 w-20 rounded-full border-2 border-[#E2E8F0] object-cover ring-2 ring-[#F1F5F9]"
              />
              <p className="text-sm text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                Preview — saved when you continue.
              </p>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="mb-4 h-12 w-full cursor-pointer rounded-lg bg-[#2563EB] text-base font-medium text-white hover:opacity-95"
          >
            {loading ? "Saving…" : "Save and continue"}
          </Button>

          <p className="text-center text-sm text-[#475569]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            <Link
              className="font-medium text-[#2563EB] hover:underline"
              href="/auth/login"
              onClick={() => clearTokens()}
            >
              Use a different account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
