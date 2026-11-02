import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface PublicConfig {
  googleClientId: string;
}

const buildTimeGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/** Non-secret settings managed in Admin -> Settings; VITE_* values are the fallback. */
export function usePublicConfig(): PublicConfig {
  const { data } = useQuery({
    queryKey: ["public-config"],
    queryFn: async () => (await api.get("/config")).data.data as PublicConfig,
    staleTime: 5 * 60_000,
    enabled: typeof window !== "undefined",
  });
  return { googleClientId: data?.googleClientId || buildTimeGoogleClientId };
}
