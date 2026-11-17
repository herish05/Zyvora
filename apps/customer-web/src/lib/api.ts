export const CUSTOMER_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export const CUSTOMER_AUTH_UPDATED_EVENT = "zyvora:customer-auth-updated";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type RefreshCustomerTokenResponse = {
  user: {
    email: string;
    role: "customer" | "admin";
  };
  accessToken: string;
};

type CustomerTokenPayload = {
  userId: string;
  email: string;
  role: "customer" | "admin";
  exp?: number;
};

export const getStoredCustomerToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("zyvora_access_token");
};

export const setStoredCustomerToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("zyvora_access_token", token);
  window.dispatchEvent(new CustomEvent(CUSTOMER_AUTH_UPDATED_EVENT));
};

export const clearStoredCustomerToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("zyvora_access_token");
  window.dispatchEvent(new CustomEvent(CUSTOMER_AUTH_UPDATED_EVENT));
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload || typeof window === "undefined") {
      return null;
    }

    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = window.atob(normalized);
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const parseCustomerTokenPayload = (token: string): CustomerTokenPayload | null => {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  const email = payload.email;
  const role = payload.role;
  const userId = payload.userId;

  if (typeof email !== "string" || typeof role !== "string" || typeof userId !== "string") {
    return null;
  }

  if (role !== "customer" && role !== "admin") {
    return null;
  }

  return {
    userId,
    email,
    role,
    exp: typeof payload.exp === "number" ? payload.exp : undefined
  };
};

const isTokenExpired = (expSeconds?: number) => {
  if (typeof expSeconds !== "number") {
    return true;
  }

  return Date.now() >= expSeconds * 1000;
};

export const getActiveCustomerToken = () => {
  const token = getStoredCustomerToken();
  if (!token) {
    return null;
  }

  const payload = parseCustomerTokenPayload(token);
  if (!payload || isTokenExpired(payload.exp)) {
    clearStoredCustomerToken();
    return null;
  }

  return token;
};

let refreshCustomerTokenPromise: Promise<string | null> | null = null;

export const refreshCustomerAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (refreshCustomerTokenPromise) {
    return refreshCustomerTokenPromise;
  }

  refreshCustomerTokenPromise = (async () => {
    try {
      const result = await customerApiRequest<RefreshCustomerTokenResponse>("/auth/refresh", {
        method: "POST"
      });
      setStoredCustomerToken(result.data.accessToken);
      return result.data.accessToken;
    } catch {
      clearStoredCustomerToken();
      return null;
    } finally {
      refreshCustomerTokenPromise = null;
    }
  })();

  return refreshCustomerTokenPromise;
};

export const ensureActiveCustomerToken = async (): Promise<string | null> => {
  const activeToken = getActiveCustomerToken();
  if (activeToken) {
    return activeToken;
  }

  return refreshCustomerAccessToken();
};

export const getStoredCustomerTokenPayload = (): CustomerTokenPayload | null => {
  const token = getActiveCustomerToken();
  if (!token) {
    return null;
  }

  return parseCustomerTokenPayload(token);
};

export const getCustomerDisplayName = () => {
  const payload = getStoredCustomerTokenPayload();
  if (!payload?.email) {
    return null;
  }

  return payload.email.split("@")[0] || payload.email;
};

export const customerApiRequest = async <T>(
  path: string,
  options?: RequestInit,
  token?: string | null
): Promise<ApiEnvelope<T>> => {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${CUSTOMER_API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Customer API request failed");
  }

  return payload;
};
