"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
      <div className="bg-white p-8 rounded-lg shadow w-96 border">

        <h1 className="text-2xl font-bold text-[#0F172A] mb-4">Login</h1>

        <Input placeholder="Email" className="mb-3" />
        <Input type="password" placeholder="Password" className="mb-3" />

        <Button className="w-full bg-[#2563EB] text-white mb-2">
          Login
        </Button>

        <Link href="/auth/forgot-password">
          <p className="text-sm text-right text-[#475569] cursor-pointer">
            Forgot Password?
          </p>
        </Link>

      </div>
    </div>
  );
}