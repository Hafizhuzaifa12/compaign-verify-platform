const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : null) ?? res.statusText;
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---------- domain types ----------

export type VerificationStatus =
  | "pending"
  | "analyzing"
  | "verified"
  | "flagged"
  | "rejected";

export interface Campaign {
  id: string;
  title: string;
  brand: string;
  description: string;
  media_url?: string;
  category: "marketing" | "political" | "public_service" | "other";
  status: VerificationStatus;
  authenticity_score: number;
  deepfake_score: number;
  blockchain_tx?: string;
  blockchain_block?: number;
  submitted_by: string;
  submitted_at: string;
  verified_at?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  organization?: string;
  role: "admin" | "verifier" | "submitter";
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

// ---------- API surface ----------

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    register: (payload: {
      email: string;
      password: string;
      full_name: string;
      organization?: string;
    }) =>
      request<AuthResponse>("/api/v1/auth/register", {
        method: "POST",
        body: payload,
      }),
    me: (token: string) => request<User>("/api/v1/users/me", { token }),
  },
  campaigns: {
    list: (token: string) =>
      request<Campaign[]>("/api/v1/campaigns", { token }),
    get: (id: string, token: string) =>
      request<Campaign>(`/api/v1/campaigns/${id}`, { token }),
    create: (
      payload: Pick<
        Campaign,
        "title" | "brand" | "description" | "category"
      > & { media_url?: string },
      token: string
    ) =>
      request<Campaign>("/api/v1/campaigns", {
        method: "POST",
        body: payload,
        token,
      }),
  },
};

export { API_URL };
