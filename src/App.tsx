import { useState, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, type QueryKey } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/toast";
import { ConfirmHost } from "@/components/ui/dialog";
import { PageContentProvider } from "@/context/PageContentContext";
import { SiteConfig } from "@/components/SiteConfig";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AppRoutes } from "@/routes";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/** Providers shared by the browser app and the build-time prerenderer. */
/** API responses a prerendered page was built with, so hydration matches the static HTML. */
export type InitialQueryData = Array<[QueryKey, unknown]>;

export function AppProviders({ children, initialData }: { children: ReactNode; initialData?: InitialQueryData }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });
    for (const [key, data] of initialData ?? []) client.setQueryData(key, data);
    return client;
  });
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
      <ConfirmHost />
      <ConsentBanner />
    </>
  );
}

export default function App({ initialData }: { initialData?: InitialQueryData }) {
  return (
    <AppProviders initialData={initialData}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProviders>
  );
}
