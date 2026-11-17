export const ADMIN_API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const getStoredAdminToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.localStorage.getItem("zyvora_admin_access_token") ||
    window.localStorage.getItem("zyvora_access_token")
  );
};

export const apiRequest = async <T>(
  path: string,
  options?: RequestInit,
  token?: string | null
): Promise<ApiEnvelope<T>> => {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "API request failed");
  }

  return payload;
};
