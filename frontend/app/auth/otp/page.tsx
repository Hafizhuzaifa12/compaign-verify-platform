"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function OTPPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
      <div className="bg-white p-8 rounded-lg shadow w-96 border">

        <h1 className="text-xl font-bold mb-4">Enter OTP</h1>

        <Input placeholder="Enter OTP" className="mb-3" />

        <Button className="w-full bg-[#2563EB] text-white">
          Verify OTP
        </Button>

      </div>
    </div>
  );
}