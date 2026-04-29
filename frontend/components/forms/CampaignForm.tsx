"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient, { apiErrorMessage } from "@/lib/api-client";

const TYPES = [
  { value: "", label: "Select type" },
  { value: "Email Marketing", label: "Email marketing" },
  { value: "Social Media Ad", label: "Social media ad" },
  { value: "Landing Page Copy", label: "Landing page copy" },
] as const;

export default function CampaignForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    content: "",
    url: "",
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
    if (!formData.title.trim() || !formData.type || !formData.content.trim()) {
      setError("Title, type, and content are required.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/campaigns", {
        title: formData.title.trim(),
        type: formData.type,
        content: formData.content.trim(),
        url: formData.url.trim() || "",
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not submit the campaign."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow w-full max-w-xl border"
    >
      <h2 className="text-xl font-bold text-[#0F172A] mb-4">Submit campaign</h2>

      {error ? (
        <p className="text-sm text-red-600 mb-3" role="alert">
          {error}
        </p>
      ) : null}

      <Input
        name="title"
        placeholder="Title"
        className="mb-3"
        value={formData.title}
        onChange={handleChange}
      />

      <select
        name="type"
        value={formData.type}
        onChange={handleChange}
        className="w-full border border-[#E2E8F0] rounded-md p-2 mb-3 bg-white"
      >
        {TYPES.map((t) => (
          <option key={t.value || "empty"} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <textarea
        name="content"
        placeholder="Content to verify"
        onChange={handleChange}
        value={formData.content}
        className="w-full border border-[#E2E8F0] rounded-md p-2 mb-3 min-h-[120px]"
      />

      <Input
        name="url"
        type="url"
        placeholder="Optional landing page URL"
        className="mb-3"
        value={formData.url}
        onChange={handleChange}
      />

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white hover:bg-blue-700"
      >
        {loading ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
