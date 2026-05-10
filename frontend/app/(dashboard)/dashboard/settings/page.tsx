"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage, getAccessToken } from "@/lib/api-client";
import type { UserMe } from "@/lib/types/user";
import { formatMaxAvatarSize, MAX_AVATAR_BYTES } from "@/lib/upload-limits";

const labelCls = "mb-2 block text-sm font-medium text-[var(--text-body)]";
const inputCls = "mb-4 h-12 rounded-lg text-base";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/login");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadError("");
      try {
        const { data } = await apiClient.get<UserMe>("/users/me");
        if (cancelled) return;
        if (data.needs_profile_completion) {
          router.replace("/auth/complete-profile");
          return;
        }
        setEmail(data.email);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      } catch {
        if (!cancelled) setLoadError("Could not load your profile.");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!avatar) return;
    const url = URL.createObjectURL(avatar);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setSuccess("");
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
        const { data } = await apiClient.post<UserMe>("/users/me/avatar", fd);
        setAvatar(null);
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      }
      setSuccess("Settings saved.");
    } catch (err) {
      setMessage(apiErrorMessage(err, "Could not save settings."));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return <div className="text-[var(--text-muted)]">Loading…</div>;
  }

  return (
    <div className="pb-12">
      <div className="mb-8">
        <h1
          className="text-[26px] font-bold text-[var(--text-heading)]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          Settings
        </h1>
        <p className="mt-1 max-w-xl text-[14px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Update your profile. Your email is tied to your login and cannot be changed here.
        </p>
      </div>

      {loadError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white p-6 sm:p-8"
      >
        {message ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}
        {success ? (
          <p className="mb-4 text-sm text-green-700" role="status">
            {success}
          </p>
        ) : null}

        <div className="mb-6">
          <label className={labelCls} htmlFor="settings-email">
            Email
          </label>
          <Input id="settings-email" className={inputCls} value={email} readOnly disabled />
        </div>

        <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <span className={labelCls}>Profile photo</span>
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--surface-subtle)]">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-[var(--text-muted)]">No photo</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="mt-2 max-w-[200px] text-sm text-[var(--text-muted)] file:mr-2 file:rounded file:border-0 file:bg-[var(--brand-primary)] file:px-3 file:py-1.5 file:text-sm file:text-white"
              onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <label className={labelCls} htmlFor="settings-fullname">
              Full name
            </label>
            <Input
              id="settings-fullname"
              className={inputCls}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <label className={labelCls} htmlFor="settings-display">
              Display name
            </label>
            <Input
              id="settings-display"
              className={inputCls}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Optional"
            />

            <label className={labelCls} htmlFor="settings-phone">
              Phone
            </label>
            <Input
              id="settings-phone"
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="settings-bio">
            Bio
          </label>
          <textarea
            id="settings-bio"
            className="mb-6 min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Optional"
            maxLength={500}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={loading} className="rounded-lg px-6">
            {loading ? "Saving…" : "Save changes"}
          </Button>
          <Link href="/dashboard" className="text-sm font-medium text-[var(--brand-primary)] hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
