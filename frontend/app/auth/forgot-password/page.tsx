"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
      <div className="bg-white p-8 rounded-lg shadow w-96 border">

        <h1 className="text-xl font-bold mb-4">Forgot Password</h1>

        <Input placeholder="Enter Email" className="mb-3" />

        <Link href="/auth/otp">
          <Button className="w-full bg-[#2563EB] text-white">
            Send OTP
          </Button>
        </Link>

      </div>
    </div>
  );
}