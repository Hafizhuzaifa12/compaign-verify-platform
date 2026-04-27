"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [password, setPassword] = useState("");

  const validatePassword = (password: string) => {
    return /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(password);
  };

  const handleSubmit = () => {
    if (!validatePassword(password)) {
      alert("Password must be 8 characters with 1 number & 1 special character");
      return;
    }
    alert("Registered Successfully");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
      <div className="bg-white p-8 rounded-lg shadow w-96 border">

        <h1 className="text-2xl font-bold text-[#0F172A] mb-4">Register</h1>

        <Input placeholder="Email" className="mb-3" />
        <Input
          type="password"
          placeholder="Password"
          className="mb-3"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        />
        <Input type="password" placeholder="Confirm Password" className="mb-3" />

        <Button onClick={handleSubmit} className="w-full bg-[#2563EB] text-white">
          Register
        </Button>

      </div>
    </div>
  );
}