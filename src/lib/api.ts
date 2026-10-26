import axios from "axios";

// Live API, forced: env values are ignored so no stale .env can point the site elsewhere.
export const API_URL = "https://ownwl9o5ma.c39.airoapp.ai/api/v1";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Callback to be set by the auth redirect handler
let onAuthFailed: (() => void) | null = null;

export const setAuthRedirectCallback = (callback: (() => void) | null) => {
  onAuthFailed = callback;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // A 401 from login/register/refresh is a real answer (wrong password, no session), not an expired access token
    const isAuthRequest = /\/auth\/(login|register|google|refresh)/.test(original?.url || "");
    if (error.response?.status === 401 && original && !original._retry && !isAuthRequest) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem("accessToken", data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        // Clear the auth state in Zustand store
        try {
          const { useAuthStore } = await import("@/store/authStore");
          useAuthStore.getState().logout();
        } catch {
          // If import fails, just clear localStorage
        }
        // Use the callback to navigate via React Router instead of window.location
        if (onAuthFailed) {
          onAuthFailed();
        } else {
          // Fallback: only redirect if not already on login page
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/** User-facing message from an API error, falling back to `fallback`. */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (!error.response) return fallback;
  }
  return fallback;
};
