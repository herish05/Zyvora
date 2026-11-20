export const ADMIN_API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "http://localhost:4000/api/v1";

const ADMIN_TOKEN_KEY = "zyvora_admin_access_token";
export const ADMIN_SESSION_EXPIRED_EVENT = "zyvora:admin-session-expired";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type AdminAuthResponse = {
  user: { role: "admin" | "customer"; email: string };
  accessToken: string;
};

export const getStoredAdminToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const setStoredAdminToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const clearStoredAdminToken = () => {
  if (typeof window !== "undefined") window.localStorage.removeItem(ADMIN_TOKEN_KEY);
};

let refreshAdminTokenPromise: Promise<string | null> | null = null;

export const refreshAdminAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  if (refreshAdminTokenPromise) return refreshAdminTokenPromise;

  refreshAdminTokenPromise = (async () => {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      const payload = await response.json() as { success: boolean; message?: string; data?: AdminAuthResponse };
      if (!response.ok || !payload.success || payload.data?.user.role !== "admin" || !payload.data.accessToken) {
        clearStoredAdminToken();
        return null;
      }
      setStoredAdminToken(payload.data.accessToken);
      return payload.data.accessToken;
    } catch {
      clearStoredAdminToken();
      return null;
    } finally {
      refreshAdminTokenPromise = null;
    }
  })();

  return refreshAdminTokenPromise;
};

export const ensureActiveAdminToken = async () => getStoredAdminToken() ?? refreshAdminAccessToken();

const request = async <T>(path: string, options?: RequestInit, token?: string | null) => {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  return { response, payload };
};

export const apiRequest = async <T>(
  path: string,
  options?: RequestInit,
  token?: string | null
): Promise<ApiEnvelope<T>> => {
  let result = await request<T>(path, options, token);

  if (result.response.status === 401 && token && !path.startsWith("/auth/")) {
    const refreshedToken = await refreshAdminAccessToken();
    if (refreshedToken) {
      result = await request<T>(path, options, refreshedToken);
    }
  }

  if (result.response.status === 403 && token && typeof window !== "undefined") {
    clearStoredAdminToken();
    window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT));
  }

  if (result.response.status === 401 && token && typeof window !== "undefined") {
    clearStoredAdminToken();
    window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT));
  }

  if (!result.response.ok || !result.payload.success) {
    throw new Error(result.payload.message || "API request failed");
  }

  return result.payload;
};
