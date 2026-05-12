"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "./api-client";

const USER_KEY = "verit:user";
const TOKEN_KEY = "verit:token";

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function useCurrentUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
    const onStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signOut = () => {
    clearAuth();
    setUser(null);
    router.push("/auth/login");
  };

  return { user, loading, signOut };
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function roleLabel(role?: User["role"]): string {
  switch (role) {
    case "admin":
      return "Workspace admin";
    case "verifier":
      return "Verifier";
    case "submitter":
      return "Submitter";
    default:
      return "Member";
  }
}
