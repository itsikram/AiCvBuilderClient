import { useState, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/toast";
import { PageContentProvider } from "@/context/PageContentContext";
import { SiteConfig } from "@/components/SiteConfig";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AppRoutes } from "@/routes";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/** Providers shared by the browser app and the build-time prerenderer. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } })
  );
  const content = (
    <QueryClientProvider client={queryClient}>
      <PageContentProvider>{children}</PageContentProvider>
    </QueryClientProvider>
  );
  return googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider> : content;
}

export function AppShell() {
  return (
    <>
      <AppRoutes />
      <SiteConfig />
      <Toaster />
      <ConsentBanner />
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProviders>
  );
}
