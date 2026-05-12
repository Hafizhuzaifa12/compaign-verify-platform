"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Megaphone,
  Building2,
  Link2,
  FileText,
  Upload,
  File as FileIcon,
  FileVideo,
  FileAudio,
  FileImage,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api-client";
import { getStoredToken } from "@/lib/auth";

type Category = "marketing" | "political" | "public_service" | "other";

const CATEGORIES: { value: Category; label: string; hint: string }[] = [
  { value: "marketing", label: "Marketing", hint: "Brand & product campaigns" },
  { value: "political", label: "Political", hint: "Civic, electoral, advocacy" },
  { value: "public_service", label: "PSA", hint: "Public service messaging" },
  { value: "other", label: "Other", hint: "Anything else" },
];

const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_PREFIXES = ["video/", "audio/", "image/"];

type MediaMode = "upload" | "url";

export function CampaignForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    brand: "",
    description: "",
    media_url: "",
    category: "marketing" as Category,
  });
  const [mediaMode, setMediaMode] = useState<MediaMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Revoke object URL on unmount or replace
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function validateAndAcceptFile(f: File): string | null {
    if (!ALLOWED_PREFIXES.some((p) => f.type.startsWith(p))) {
      return "Only video, audio, or image files are accepted.";
    }
    if (f.size > MAX_FILE_BYTES) {
      return `File is ${formatBytes(f.size)}. Max allowed is 100 MB.`;
    }
    return null;
  }

  function acceptFile(f: File) {
    const err = validateAndAcceptFile(f);
    if (err) {
      setFileError(err);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setFileError(null);
    simulateUpload();
  }

  function simulateUpload() {
    setUploadProgress(0);
    const start = Date.now();
    const totalMs = 1500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setUploadProgress(pct);
      if (pct < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setUploadProgress(null);
  }

  function handlePick() {
    setFileError(null);
    fileInputRef.current?.click();
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) acceptFile(f);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mediaMode === "upload" && !file) {
      setError("Please upload a media file or switch to URL mode.");
      setLoading(false);
      return;
    }
    if (mediaMode === "url" && !form.media_url) {
      setError("Please paste a media URL or switch to upload mode.");
      setLoading(false);
      return;
    }
    if (mediaMode === "url" && !/^https?:\/\/.+/i.test(form.media_url)) {
      setError("Media URL must start with http:// or https://");
      setLoading(false);
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setError("You need to sign in to submit a campaign.");
      setLoading(false);
      router.push("/auth/login");
      return;
    }

    try {
      const description =
        mediaMode === "upload" && file
          ? `${form.description}\n\n[Uploaded file: ${file.name} · ${formatBytes(file.size)}]`
          : form.description;

      const created = await api.campaigns.create(
        {
          title: form.title,
          brand: form.brand,
          description,
          category: form.category,
          media_url: mediaMode === "url" ? form.media_url : undefined,
        },
        token
      );
      router.push(`/campaigns/${created.id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Submission failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Campaign title</Label>
              <div className="relative">
                <Megaphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="title"
                  required
                  className="pl-10"
                  placeholder="e.g. Spring Drop — Hero Reveal"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand / Organization</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="brand"
                  required
                  className="pl-10"
                  placeholder="e.g. Aurora"
                  value={form.brand}
                  onChange={(e) => update("brand", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {CATEGORIES.map((c) => {
                const active = form.category === c.value;
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => update("category", c.value)}
                    className={cn(
                      "rounded-lg border p-3 text-left text-sm transition-all",
                      active
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <div className="font-medium text-foreground">{c.label}</div>
                    <div className="mt-0.5 text-xs">{c.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Media</Label>
              <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMediaMode("upload")}
                  className={cn(
                    "rounded-md px-3 py-1.5 transition-colors",
                    mediaMode === "upload"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Upload file
                </button>
                <button
                  type="button"
                  onClick={() => setMediaMode("url")}
                  className={cn(
                    "rounded-md px-3 py-1.5 transition-colors",
                    mediaMode === "url"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Paste URL
                </button>
              </div>
            </div>

            {mediaMode === "upload" ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*,image/*"
                  className="hidden"
                  onChange={onFileInputChange}
                />

                {!file ? (
                  <button
                    type="button"
                    onClick={handlePick}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                      isDragging
                        ? "border-primary/60 bg-primary/5"
                        : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/30"
                    )}
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">
                        Drop your file here, or{" "}
                        <span className="text-primary underline-offset-2 hover:underline">
                          browse
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Video, audio, or image. Max 100 MB.
                      </div>
                    </div>
                  </button>
                ) : (
                  <FilePreview
                    file={file}
                    previewUrl={previewUrl}
                    progress={uploadProgress}
                    onRemove={clearFile}
                  />
                )}

                {fileError ? (
                  <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="media_url"
                    type="url"
                    className="pl-10"
                    placeholder="https://cdn.example.com/spring-drop.mp4"
                    value={form.media_url}
                    onChange={(e) => update("media_url", e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Any publicly accessible video, audio, or image URL.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="description"
                required
                className="pl-10"
                placeholder="A short summary of the campaign, talent, and any synthetic elements we should know about."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 p-5">
          <Badge variant="primary">Tip</Badge>
          <p className="text-sm text-muted-foreground">
            Disclose any AI-generated or synthetic content up front — Verit will
            attest to the disclosure on-chain, raising your authenticity score.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          By submitting you agree to publish an on-chain attestation hash.
        </p>
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
            </>
          ) : (
            <>
              Submit for verification <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function FilePreview({
  file,
  previewUrl,
  progress,
  onRemove,
}: {
  file: File;
  previewUrl: string | null;
  progress: number | null;
  onRemove: () => void;
}) {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");
  const done = progress === null || progress >= 100;

  const TypeIcon = isImage ? FileImage : isVideo ? FileVideo : isAudio ? FileAudio : FileIcon;

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="h-20 w-20 rounded-lg object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-lg bg-primary/10 text-primary">
              <TypeIcon className="h-7 w-7" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-medium">{file.name}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatBytes(file.size)}</span>
                <span>·</span>
                <span className="font-mono">{file.type || "unknown"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!done ? (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent)))] transition-[width] duration-100"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Uploading… {progress}%
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready for verification
            </div>
          )}

          {done && previewUrl && isVideo ? (
            <video
              src={previewUrl}
              controls
              className="mt-3 max-h-56 w-full rounded-lg bg-black"
            />
          ) : null}
          {done && previewUrl && isAudio ? (
            <audio src={previewUrl} controls className="mt-3 w-full" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
