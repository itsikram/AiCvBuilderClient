import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
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
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || "/api/v1"}/auth/refresh`,
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
