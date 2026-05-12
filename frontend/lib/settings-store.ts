"use client";

import type { User } from "./api-client";

const PREFIX = "verit:settings:";

function key(userId: string, slot: string): string {
  return `${PREFIX}${userId}:${slot}`;
}

function readJson<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(k: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch {
    /* quota or serialization issue — ignore */
  }
}

// ---------- API keys ----------

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at: string | null;
}

export function getApiKeys(userId: string): ApiKey[] {
  return readJson<ApiKey[]>(key(userId, "api_keys"), []);
}

export function createApiKey(userId: string, name: string): ApiKey {
  const list = getApiKeys(userId);
  const newKey: ApiKey = {
    id: `ak_${randomHex(8)}`,
    name: name.trim() || "Untitled key",
    key: `vrt_live_${randomHex(32)}`,
    created_at: new Date().toISOString(),
    last_used_at: null,
  };
  writeJson(key(userId, "api_keys"), [newKey, ...list]);
  return newKey;
}

export function revokeApiKey(userId: string, id: string) {
  const list = getApiKeys(userId).filter((k) => k.id !== id);
  writeJson(key(userId, "api_keys"), list);
}

// ---------- Webhooks ----------

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  created_at: string;
}

export const WEBHOOK_EVENTS = [
  "campaign.submitted",
  "campaign.verified",
  "campaign.flagged",
  "campaign.rejected",
] as const;

export function getWebhooks(userId: string): Webhook[] {
  return readJson<Webhook[]>(key(userId, "webhooks"), []);
}

export function createWebhook(
  userId: string,
  url: string,
  events: string[]
): Webhook {
  const list = getWebhooks(userId);
  const w: Webhook = {
    id: `wh_${randomHex(8)}`,
    url: url.trim(),
    events: events.length ? events : ["campaign.verified"],
    created_at: new Date().toISOString(),
  };
  writeJson(key(userId, "webhooks"), [w, ...list]);
  return w;
}

export function deleteWebhook(userId: string, id: string) {
  const list = getWebhooks(userId).filter((w) => w.id !== id);
  writeJson(key(userId, "webhooks"), list);
}

// ---------- Notification preferences ----------

export type NotificationKey =
  | "verification_completed"
  | "campaign_flagged"
  | "campaign_rejected"
  | "weekly_digest"
  | "system_alerts";

export type NotificationChannel = "email" | "in_app";

export type NotificationPrefs = Record<
  NotificationKey,
  Record<NotificationChannel, boolean>
>;

const DEFAULT_PREFS: NotificationPrefs = {
  verification_completed: { email: true, in_app: false },
  campaign_flagged: { email: true, in_app: true },
  campaign_rejected: { email: true, in_app: true },
  weekly_digest: { email: true, in_app: false },
  system_alerts: { email: true, in_app: true },
};

export function getNotificationPrefs(userId: string): NotificationPrefs {
  return readJson<NotificationPrefs>(
    key(userId, "notifications"),
    DEFAULT_PREFS
  );
}

export function setNotificationPref(
  userId: string,
  k: NotificationKey,
  channel: NotificationChannel,
  value: boolean
) {
  const prefs = getNotificationPrefs(userId);
  prefs[k] = { ...prefs[k], [channel]: value };
  writeJson(key(userId, "notifications"), prefs);
}

// ---------- Profile + Org updates ----------

export function saveUserProfile(updates: Partial<User>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("verit:user");
    if (!raw) return;
    const current = JSON.parse(raw) as User;
    const next = { ...current, ...updates };
    localStorage.setItem("verit:user", JSON.stringify(next));
    // notify other components on same tab
    window.dispatchEvent(new StorageEvent("storage", { key: "verit:user" }));
  } catch {
    /* ignore */
  }
}

// ---------- Avatar (per-user, base64 in localStorage) ----------

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const AVATAR_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
];

export function getUserAvatar(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key(userId, "avatar"));
}

export function saveUserAvatar(userId: string, dataUrl: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(userId, "avatar"), dataUrl);
    window.dispatchEvent(new StorageEvent("storage", { key: "verit:user" }));
  } catch {
    /* quota — likely too large */
  }
}

export function clearUserAvatar(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(userId, "avatar"));
  window.dispatchEvent(new StorageEvent("storage", { key: "verit:user" }));
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

// ---------- Notifications feed (last-seen tracking) ----------

export function getLastSeenAt(userId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(key(userId, "notifications:last_seen"));
  return raw ? Number(raw) : 0;
}

export function markAllNotificationsSeen(userId: string, at: number = Date.now()) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(userId, "notifications:last_seen"), String(at));
}

// ---------- helpers ----------

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < bytes; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
