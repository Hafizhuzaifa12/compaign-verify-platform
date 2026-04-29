import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function fetchNewAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  if (refreshPromise) return refreshPromise;
  refreshPromise = axios
    .post<{ access_token: string; token_type: string }>(`${API_BASE}/auth/refresh`, {
      refresh_token: refresh,
    })
    .then((res) => {
      const at = res.data?.access_token;
      if (at) {
        setTokens(at);
        return at;
      }
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

const apiClient = axios.create({ baseURL: API_BASE });

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const path = typeof window !== "undefined" ? window.location.pathname : "";

    // HTTPBearer on FastAPI returns 403 when the Authorization header is missing.
    if (error.response?.status === 403) {
      const hasAuth = Boolean(
        original?.headers && "Authorization" in original.headers && original.headers.Authorization,
      );
      if (!hasAuth && path && !path.startsWith("/auth")) {
        if (typeof window !== "undefined") {
          clearTokens();
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && original && !original._retry) {
      if (path.startsWith("/auth")) {
        return Promise.reject(error);
      }
      const refresh = getRefreshToken();
      if (!refresh) {
        clearTokens();
        if (typeof window !== "undefined" && !path.startsWith("/auth")) {
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
      original._retry = true;
      try {
        const newAccess = await fetchNewAccessToken();
        if (newAccess) {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient.request(original);
        }
      } catch {
        // fall through
      }
      clearTokens();
      if (typeof window !== "undefined" && !path.startsWith("/auth")) {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data;
    if (d && typeof d === "object" && "detail" in d) {
      const det = (d as { detail: unknown }).detail;
      if (typeof det === "string") return det;
      if (Array.isArray(det)) {
        return det
          .map((item) =>
            item &&
            typeof item === "object" &&
            "msg" in item &&
            typeof (item as { msg: string }).msg === "string"
              ? (item as { msg: string }).msg
              : String(item),
          )
          .join(" ");
      }
    }
  }
  return fallback;
}

export default apiClient;
