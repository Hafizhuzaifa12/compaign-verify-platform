"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import apiClient, { apiErrorMessage, getAccessToken } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TYPES = [
  { value: "", label: "Select type" },
  { value: "Email Marketing", label: "Email marketing" },
  { value: "Social Media Ad", label: "Social media ad" },
  { value: "Product Ad Copy", label: "Product ad copy" },
  { value: "Landing Page Campaign", label: "Landing page campaign" },
] as const;

export default function CampaignForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    adCopy: "",
    emailText: "",
    socialCaption: "",
    landingPageContent: "",
    campaignUrl: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/login");
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setError("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parts = [
      ["Ad copy", formData.adCopy],
      ["Email marketing text", formData.emailText],
      ["Social media caption", formData.socialCaption],
      ["Landing page content", formData.landingPageContent],
    ] as const;
    const normalized = parts
      .filter(([, value]) => value.trim().length > 0)
      .map(([label, value]) => `${label}:\n${value.trim()}`)
      .join("\n\n");
    if (!formData.title.trim() || !formData.type || !normalized) {
      setError("Title, campaign type, and at least one content field are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post("/campaigns", {
        title: formData.title.trim(),
        type: formData.type,
        content: normalized,
        url: formData.campaignUrl.trim() || "",
      });
      toast.success("Campaign submitted successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const msg = apiErrorMessage(err, "Could not submit the campaign.");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelCls = "mb-2 block text-sm font-medium text-[#334155]";
  const fieldCls = "mb-6 w-full rounded-lg border border-[#E2E8F0] bg-white";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {error ? (
        <p className="mb-6 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mb-8">
        <h2
          className="mb-4 text-lg font-semibold text-[#0F172A]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          Basics
        </h2>
        <label className={labelCls} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Campaign title
        </label>
        <Input
          name="title"
          placeholder="Campaign title"
          className="mb-6 rounded-lg"
          value={formData.title}
          onChange={handleChange}
        />

        <label className={labelCls} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Campaign type
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="mb-6 w-full rounded-lg border border-[#E2E8F0] bg-white p-2"
        >
          {TYPES.map((t) => (
            <option key={t.value || "empty"} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </section>

      <div className="my-8 border-t border-[#E2E8F0]" />

      <section className="mb-8">
        <h2
          className="mb-4 text-lg font-semibold text-[#0F172A]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          Content
        </h2>
        <label className={labelCls} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Product ad copy
        </label>
        <textarea
          name="adCopy"
          placeholder="Product ad copy (optional if other fields are provided)"
          onChange={handleChange}
          value={formData.adCopy}
          className={`${fieldCls} min-h-[90px] p-2`}
        />

        <label className={labelCls} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Email marketing text
        </label>
        <textarea
          name="emailText"
          placeholder="Email marketing text"
          onChange={handleChange}
          value={formData.emailText}
          className={`${fieldCls} min-h-[90px] p-2`}
        />

        <label className={labelCls} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Social media caption
        </label>
        <textarea
          name="socialCaption"
          placeholder="Social media caption"
          onChange={handleChange}
          value={formData.socialCaption}
          className={`${fieldCls} min-h-[90px] p-2`}
        />

        <label className={labelCls} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Landing page message/content
        </label>
        <textarea
          name="landingPageContent"
          placeholder="Landing page message/content"
          onChange={handleChange}
          value={formData.landingPageContent}
          className={`${fieldCls} min-h-[90px] p-2`}
        />
      </section>

      <div className="my-8 border-t border-[#E2E8F0]" />

      <section>
        <h2
          className="mb-4 text-lg font-semibold text-[#0F172A]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          Link & submit
        </h2>
        <label className={labelCls} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Campaign / landing page URL (optional)
        </label>
        <Input
          name="campaignUrl"
          type="url"
          placeholder="Campaign / landing page URL (optional)"
          className="mb-6 rounded-lg"
          value={formData.campaignUrl}
          onChange={handleChange}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSubmitting
            ? "Submitting and analyzing with AI and blockchain…"
            : "Submit campaign"}
        </Button>
      </section>
    </form>
  );
}
