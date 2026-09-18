const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!backendUrl) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
}

const BACKEND_URL = backendUrl.replace(/\/$/, "");

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      const detail = errorData?.detail || `HTTP ${response.status}`;

      throw new Error(
        typeof detail === "string" ? detail : JSON.stringify(detail),
      );
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return null;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);

    throw error;
  }
};

export const profileAPI = {
  fetchProfile: () => apiRequest("/user/profile"),

  updateEmailReminder: (data: {
    reminder_time: string | null;
    enabled: boolean;
    timezone: string;
  }) =>
    apiRequest("/email/reminder-settings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateApiKey: (newApiKey: string) =>
    apiRequest("/user/update-api-key", {
      method: "PUT",
      body: JSON.stringify({
        new_api_key: newApiKey,
      }),
    }),

  requestPasswordReset: (email: string) =>
    apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  deleteAccount: () =>
    apiRequest("/user/delete-account", {
      method: "DELETE",
    }),
};
