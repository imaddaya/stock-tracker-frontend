
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
}
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("access_token");
  
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

export const profileAPI = {
  fetchProfile: () => apiRequest("/user/profile"),
  updateEmailReminder: (data: { reminder_time: string | null; enabled: boolean; timezone: string }) =>
    apiRequest("/email/reminder-settings", { method: "POST", body: JSON.stringify(data) }),
  updateApiKey: (newApiKey: string) =>
    apiRequest("/user/update-api-key", { method: "PUT", body: JSON.stringify({ new_api_key: newApiKey }) }),
  requestPasswordReset: (email: string) =>
    apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  deleteAccount: () =>
    apiRequest("/user/delete-account", { method: "DELETE" }),
};
