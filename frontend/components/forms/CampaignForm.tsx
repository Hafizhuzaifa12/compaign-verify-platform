"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";

export default function CampaignForm() {
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await apiClient.post("/campaigns", formData);

      alert("Submitted!");
      window.location.href = "/dashboard";

    } catch (err) {
      alert("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-xl">
      <h2 className="text-xl font-bold mb-4">Submit Campaign</h2>

      <Input name="title" placeholder="Title" onChange={handleChange} className="mb-3" />

      <select name="type" onChange={handleChange} className="w-full border p-2 mb-3">
        <option>Select Type</option>
        <option>Email Marketing</option>
        <option>Social Media Ad</option>
        <option>Landing Page Copy</option>
      </select>

      <textarea name="content" placeholder="Content" onChange={handleChange} className="w-full border p-2 mb-3" />

      <Input name="url" placeholder="Landing Page URL" onChange={handleChange} className="mb-3" />

      <Button onClick={handleSubmit} className="w-full bg-blue-600 text-white">
        {loading ? "Submitting..." : "Submit"}
      </Button>
    </div>
  );
}