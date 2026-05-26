import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthRedirectCallback } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const navigateRef = useRef(navigate);

  // Update the ref when navigate changes
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    // Set up the auth redirect callback
    const callback = () => {
      // Clear the auth state first
      logout();
      // Navigate to login using React Router
      navigateRef.current("/login");
    };

    setAuthRedirectCallback(callback);

    // Cleanup on unmount
    return () => {
      setAuthRedirectCallback(null);
    };
  }, [logout]);

  return <>{children}</>;
}