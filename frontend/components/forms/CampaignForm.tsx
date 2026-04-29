"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import toast from "react-hot-toast";

export default function CampaignForm() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    content: "",
    url: "",
  });

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      setIsAnalyzing(true);

      await apiClient.post("/campaigns", formData);

      // ✅ Success toast
      toast.success("Campaign submitted successfully!");

      // redirect
      window.location.href = "/dashboard";

    } catch (error: any) {
      console.log(error);

      // ❌ Error toast
      toast.error("Session expired or server error");

    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow w-full max-w-xl"
    >
      <h2 className="text-xl font-bold mb-4">Submit Campaign</h2>

      <Input
        name="title"
        placeholder="Title"
        onChange={handleChange}
        className="mb-3"
      />

      <select
        name="type"
        onChange={handleChange}
        className="w-full border p-2 mb-3"
      >
        <option value="">Select Type</option>
        <option>Email Marketing</option>
        <option>Social Media Ad</option>
        <option>Landing Page Copy</option>
      </select>

      <textarea
        name="content"
        placeholder="Content"
        onChange={handleChange}
        className="w-full border p-2 mb-3"
      />

      <Input
        name="url"
        placeholder="Landing Page URL"
        onChange={handleChange}
        className="mb-3"
      />

      <Button
        type="submit"
        disabled={isAnalyzing}
        className="w-full bg-blue-600 text-white"
      >
        {isAnalyzing
          ? "Analyzing with AI & Blockchain..."
          : "Submit Campaign"}
      </Button>
    </form>
  );
}