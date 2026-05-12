"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  User,
  Building2,
  KeyRound,
  Bell,
  Webhook,
  Shield,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Laptop,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatRelative, truncateAddress } from "@/lib/utils";
import { useCurrentUser, getInitials, roleLabel } from "@/lib/auth";
import {
  type ApiKey,
  type Webhook as WebhookItem,
  type NotificationKey,
  type NotificationChannel,
  type NotificationPrefs,
  WEBHOOK_EVENTS,
  AVATAR_MAX_BYTES,
  AVATAR_ALLOWED_TYPES,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  getNotificationPrefs,
  setNotificationPref,
  saveUserProfile,
  getUserAvatar,
  saveUserAvatar,
  clearUserAvatar,
  readFileAsDataUrl,
} from "@/lib/settings-store";

type Tab =
  | "profile"
  | "organization"
  | "api"
  | "notifications"
  | "webhooks"
  | "security";

const TABS: { key: Tab; label: string; Icon: typeof User }[] = [
  { key: "profile", label: "Profile", Icon: User },
  { key: "organization", label: "Organization", Icon: Building2 },
  { key: "api", label: "API keys", Icon: KeyRound },
  { key: "notifications", label: "Notifications", Icon: Bell },
  { key: "webhooks", label: "Webhooks", Icon: Webhook },
  { key: "security", label: "Security", Icon: Shield },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Badge variant="primary" className="mb-3">
          <Sparkles className="h-3 w-3" /> Settings
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Workspace settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, organization, integrations, and security
          preferences.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <nav className="space-y-1">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <t.Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-6">
          {tab === "profile" ? <ProfileTab /> : null}
          {tab === "organization" ? <OrganizationTab /> : null}
          {tab === "api" ? <ApiKeysTab /> : null}
          {tab === "notifications" ? <NotificationsTab /> : null}
          {tab === "webhooks" ? <WebhooksTab /> : null}
          {tab === "security" ? <SecurityTab /> : null}
        </div>
      </div>
    </div>
  );
}

// ---------- Profile ----------

function ProfileTab() {
  const { user, loading } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setAvatar(getUserAvatar(user.id));
    }
  }, [user]);

  if (loading) return <SkeletonCard />;
  if (!user) return <NoUserCard message="Could not load your profile. Please sign in again." />;

  const handlePickFile = () => {
    setAvatarError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarError(null);

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      setAvatarError("Unsupported format. Use PNG, JPG, or SVG.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setAvatarError(`File is ${mb} MB. Max allowed is 2 MB.`);
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      saveUserAvatar(user.id, dataUrl);
      setAvatar(dataUrl);
    } catch {
      setAvatarError("Could not read that file. Try a different image.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    clearUserAvatar(user.id);
    setAvatar(null);
    setAvatarError(null);
  };

  const dirty = fullName !== user.full_name || email !== user.email;

  const handleSave = () => {
    setError(null);
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    saveUserProfile({ full_name: fullName.trim(), email: email.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setFullName(user.full_name);
    setEmail(user.email);
    setError(null);
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <SectionHead
          title="Profile"
          hint="This information is shown on your verification audit logs."
        />
        <div className="flex items-start gap-4">
          {avatar ? (
            <img
              src={avatar}
              alt={`${user.full_name} avatar`}
              className="h-16 w-16 rounded-full object-cover shadow-[0_12px_28px_-12px_hsl(var(--primary)/0.7)]"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] text-xl font-semibold text-white shadow-[0_12px_28px_-12px_hsl(var(--primary)/0.7)]">
              {getInitials(user.full_name)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handlePickFile}
                disabled={uploading}
              >
                {uploading
                  ? "Uploading…"
                  : avatar
                    ? "Change photo"
                    : "Upload photo"}
              </Button>
              {avatar ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  className="text-danger hover:text-danger"
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, or SVG. Max 2 MB.
            </p>
            {avatarError ? (
              <ErrorBox message={avatarError} className="mt-2" />
            ) : null}
          </div>
        </div>

        <ControlledField
          label="Full name"
          value={fullName}
          onChange={setFullName}
        />
        <ControlledField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          hint="Used for sign-in and verification receipts"
        />
        <ControlledField
          label="Role"
          value={roleLabel(user.role)}
          onChange={() => {}}
          disabled
        />

        {error ? <ErrorBox message={error} /> : null}
        {saved ? <SuccessBox message="Profile saved." /> : null}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={handleCancel} disabled={!dirty}>
            Cancel
          </Button>
          <Button variant="gradient" onClick={handleSave} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Organization ----------

function OrganizationTab() {
  const { user, loading } = useCurrentUser();
  const [org, setOrg] = useState("");
  const [website, setWebsite] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setOrg(user.organization ?? "");
      // website lives in a separate per-user slot since the User type does not have it
      const stored = localStorage.getItem(`verit:settings:${user.id}:website`);
      setWebsite(stored ?? "");
    }
  }, [user]);

  if (loading) return <SkeletonCard />;
  if (!user) return <NoUserCard message="Sign in to manage your organization." />;

  const dirty =
    org !== (user.organization ?? "") ||
    website !== (localStorage.getItem(`verit:settings:${user.id}:website`) ?? "");

  const handleSave = () => {
    setError(null);
    if (website && !/^https?:\/\/.+/i.test(website)) {
      setError("Website must start with http:// or https://");
      return;
    }
    saveUserProfile({ organization: org.trim() || undefined });
    localStorage.setItem(`verit:settings:${user.id}:website`, website.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <SectionHead
          title="Organization"
          hint="These details appear on every on-chain proof minted by your team."
        />
        <ControlledField
          label="Display name"
          value={org}
          onChange={setOrg}
          placeholder="Company, team, or project"
          hint={
            org
              ? undefined
              : "You have not set an organization yet. Add one to show on your audit logs."
          }
        />
        <ControlledField
          label="Website"
          value={website}
          onChange={setWebsite}
          placeholder="https://example.com"
          type="url"
        />
        <ControlledField
          label="Workspace ID"
          value={user.id}
          onChange={() => {}}
          disabled
          mono
        />

        {error ? <ErrorBox message={error} /> : null}
        {saved ? <SuccessBox message="Organization saved." /> : null}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="gradient" onClick={handleSave} disabled={!dirty}>
            Save organization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- API Keys ----------

function ApiKeysTab() {
  const { user, loading } = useCurrentUser();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  useEffect(() => {
    if (user) setKeys(getApiKeys(user.id));
  }, [user]);

  if (loading) return <SkeletonCard />;
  if (!user) return <NoUserCard message="Sign in to manage API keys." />;

  const refresh = () => setKeys(getApiKeys(user.id));

  const handleCreate = (name: string) => {
    const k = createApiKey(user.id, name);
    refresh();
    setReveal((r) => ({ ...r, [k.id]: true }));
  };

  const handleRevoke = (id: string) => {
    revokeApiKey(user.id, id);
    refresh();
    setConfirmRevoke(null);
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <SectionHead
            title="API keys"
            hint="Use these to authenticate from your backend or CI pipeline."
          />
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" /> New key
          </Button>
        </div>

        {showCreate ? (
          <CreateKeyForm
            onCancel={() => setShowCreate(false)}
            onCreate={(name) => {
              handleCreate(name);
              setShowCreate(false);
            }}
          />
        ) : null}

        {keys.length === 0 ? (
          <EmptyState
            Icon={KeyRound}
            title="No API keys yet"
            description="Create your first key to start submitting campaigns from your code."
            actionLabel="Create your first key"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {keys.map((k) => {
              const shown = reveal[k.id];
              return (
                <li
                  key={k.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{k.name}</span>
                      <Badge variant="outline">live</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="truncate rounded bg-muted/60 px-2 py-1 font-mono text-xs">
                        {shown ? k.key : truncateAddress(k.key, 12, 6)}
                      </code>
                      <button
                        onClick={() =>
                          setReveal((r) => ({ ...r, [k.id]: !r[k.id] }))
                        }
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={shown ? "Hide key" : "Reveal key"}
                      >
                        {shown ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(k.key);
                          setCopied(k.id);
                          setTimeout(() => setCopied(null), 1500);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Copy key"
                      >
                        {copied === k.id ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {k.last_used_at
                        ? `Last used ${formatRelative(k.last_used_at)}`
                        : "Never used"}{" "}
                      · created {formatRelative(k.created_at)}
                    </div>
                  </div>

                  {confirmRevoke === k.id ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Revoke this key?
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmRevoke(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevoke(k.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRevoke(k.id)}
                      className="text-danger hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" /> Revoke
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          Treat these like passwords. Anyone with a key can submit campaigns and
          read verification results on behalf of your workspace.
        </div>
      </CardContent>
    </Card>
  );
}

function CreateKeyForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <label className="mb-2 block text-sm font-medium">Key name</label>
      <div className="flex flex-col gap-2 md:flex-row">
        <Input
          autoFocus
          placeholder="Production server, CI pipeline, etc."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCreate(name);
            if (e.key === "Escape") onCancel();
          }}
        />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="gradient" onClick={() => onCreate(name)}>
            Create key
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        You will only see the full key once after creation. Copy it somewhere
        safe.
      </p>
    </div>
  );
}

// ---------- Notifications ----------

const NOTIFICATIONS: {
  key: NotificationKey;
  title: string;
  description: string;
}[] = [
  {
    key: "verification_completed",
    title: "Verification completed",
    description: "A campaign finishes scoring and is minted on-chain.",
  },
  {
    key: "campaign_flagged",
    title: "Campaign flagged",
    description:
      "The detector finds synthetic media that needs human review.",
  },
  {
    key: "campaign_rejected",
    title: "Campaign rejected",
    description: "A submission fails the authenticity threshold.",
  },
  {
    key: "weekly_digest",
    title: "Weekly digest",
    description: "Trend report every Monday at 9am local time.",
  },
  {
    key: "system_alerts",
    title: "System alerts",
    description: "Service status, maintenance windows, and incident notices.",
  },
];

function NotificationsTab() {
  const { user, loading } = useCurrentUser();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    if (user) setPrefs(getNotificationPrefs(user.id));
  }, [user]);

  if (loading || !prefs) return <SkeletonCard />;
  if (!user)
    return <NoUserCard message="Sign in to manage notification preferences." />;

  const toggle = (k: NotificationKey, channel: NotificationChannel) => {
    const next = {
      ...prefs,
      [k]: { ...prefs[k], [channel]: !prefs[k][channel] },
    };
    setPrefs(next);
    setNotificationPref(user.id, k, channel, next[k][channel]);
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <SectionHead
          title="Notifications"
          hint="Choose what reaches your inbox and what stays in-app."
        />
        {NOTIFICATIONS.map((n) => (
          <div
            key={n.key}
            className="flex items-start justify-between gap-6 border-b border-border pb-4 last:border-none last:pb-0"
          >
            <div className="min-w-0">
              <div className="font-medium">{n.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {n.description}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <Switch
                label="Email"
                checked={prefs[n.key].email}
                onChange={() => toggle(n.key, "email")}
              />
              <Switch
                label="In-app"
                checked={prefs[n.key].in_app}
                onChange={() => toggle(n.key, "in_app")}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked
            ? "bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent)))]"
            : "bg-muted"
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    </label>
  );
}

// ---------- Webhooks ----------

function WebhooksTab() {
  const { user, loading } = useCurrentUser();
  const [hooks, setHooks] = useState<WebhookItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (user) setHooks(getWebhooks(user.id));
  }, [user]);

  if (loading) return <SkeletonCard />;
  if (!user) return <NoUserCard message="Sign in to manage webhooks." />;

  const refresh = () => setHooks(getWebhooks(user.id));

  const handleCreate = (url: string, events: string[]) => {
    createWebhook(user.id, url, events);
    refresh();
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    deleteWebhook(user.id, id);
    refresh();
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <SectionHead
            title="Webhooks"
            hint="POST events to your systems the moment they happen."
          />
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" /> Add endpoint
          </Button>
        </div>

        {showCreate ? (
          <CreateWebhookForm
            onCancel={() => setShowCreate(false)}
            onCreate={handleCreate}
          />
        ) : null}

        {hooks.length === 0 ? (
          <EmptyState
            Icon={Webhook}
            title="No webhooks configured"
            description="Add an endpoint to receive real-time events from Verit."
            actionLabel="Add your first webhook"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {hooks.map((w) => (
              <li
                key={w.id}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-success" />
                    <code className="truncate font-mono text-sm">{w.url}</code>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {w.events.map((ev) => (
                      <Badge
                        key={ev}
                        variant="outline"
                        className="font-mono text-[10px]"
                      >
                        {ev}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    Created {formatRelative(w.created_at)}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Send test
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(w.id)}
                    className="text-danger hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          Each request is signed with HMAC-SHA256 using your{" "}
          <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">
            webhook secret
          </code>
          . Verify the{" "}
          <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">
            X-Verit-Signature
          </code>{" "}
          header on your side.
        </div>
      </CardContent>
    </Card>
  );
}

function CreateWebhookForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (url: string, events: string[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([
    "campaign.verified",
    "campaign.flagged",
  ]);
  const [error, setError] = useState<string | null>(null);

  const toggleEvent = (ev: string) => {
    setEvents((es) => (es.includes(ev) ? es.filter((x) => x !== ev) : [...es, ev]));
  };

  const submit = () => {
    setError(null);
    if (!/^https?:\/\/.+/i.test(url)) {
      setError("URL must start with http:// or https://");
      return;
    }
    if (events.length === 0) {
      setError("Select at least one event to subscribe to.");
      return;
    }
    onCreate(url, events);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <label className="mb-2 block text-sm font-medium">Endpoint URL</label>
      <Input
        autoFocus
        placeholder="https://your-app.com/webhooks/verit"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <label className="mb-2 mt-4 block text-sm font-medium">
        Events to subscribe to
      </label>
      <div className="flex flex-wrap gap-2">
        {WEBHOOK_EVENTS.map((ev) => {
          const on = events.includes(ev);
          return (
            <button
              key={ev}
              type="button"
              onClick={() => toggleEvent(ev)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs transition-colors",
                on
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
              )}
            >
              {on ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {ev}
            </button>
          );
        })}
      </div>

      {error ? <ErrorBox message={error} className="mt-3" /> : null}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="gradient" onClick={submit}>
          Add endpoint
        </Button>
      </div>
    </div>
  );
}

// ---------- Security ----------

function SecurityTab() {
  const { user, loading, signOut } = useCurrentUser();
  const [session, setSession] = useState<{
    device: string;
    Icon: typeof Monitor;
    when: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent;
    const browser = detectBrowser(ua);
    const os = detectOS(ua);
    const Icon = /iPhone|iPad|Android/i.test(ua)
      ? Smartphone
      : /Mac OS|Macintosh/i.test(ua)
        ? Laptop
        : Monitor;
    setSession({
      device: `${os} · ${browser}`,
      Icon,
      when: new Date().toLocaleString(),
    });
  }, []);

  if (loading) return <SkeletonCard />;
  if (!user) return <NoUserCard message="Sign in to view security settings." />;

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <SectionHead
          title="Security"
          hint="Lock down your workspace with stronger authentication."
        />

        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="font-medium">Two-factor authentication</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Require a one-time code from an authenticator app at sign-in.
            </div>
          </div>
          <Button variant="gradient" size="sm" disabled>
            Enable 2FA
          </Button>
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="font-medium">Single sign-on (SSO)</div>
            <div className="mt-1 text-xs text-muted-foreground">
              SAML 2.0 with Okta, Azure AD, Google Workspace, or any SAML
              provider.
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            Configure SSO
          </Button>
        </div>

        <div>
          <div className="mb-3 font-medium">Active sessions</div>
          {session ? (
            <ul className="divide-y divide-border rounded-xl border border-border">
              <li className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <session.Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{session.device}</div>
                    <div className="text-xs text-muted-foreground">
                      Signed in {session.when}
                    </div>
                  </div>
                </div>
                <Badge variant="success">This device</Badge>
              </li>
            </ul>
          ) : (
            <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
              Detecting your current session…
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Sign out everywhere by signing out from the sidebar and signing in
            again.
          </p>
        </div>

        <div className="rounded-lg border border-danger/30 bg-danger/10 p-4">
          <div className="font-medium text-danger">Danger zone</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Signing out clears your session on this device. On-chain proofs
            remain immutable on the public ledger.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-danger/40 text-danger hover:bg-danger/10"
            onClick={signOut}
          >
            Sign out of this device
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  return "Browser";
}

function detectOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return "Windows 10/11";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Linux/.test(ua)) return "Linux";
  return "Device";
}

// ---------- Shared bits ----------

function SectionHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {hint ? (
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function ControlledField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  disabled,
  mono,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  mono?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(mono && "font-mono text-sm")}
      />
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function EmptyState({
  Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  Icon: typeof KeyRound;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted/50">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      <Button variant="gradient" size="sm" onClick={onAction}>
        <Plus className="h-4 w-4" /> {actionLabel}
      </Button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
      </CardContent>
    </Card>
  );
}

function NoUserCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}

function ErrorBox({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
      <Check className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
