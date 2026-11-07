/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Optional AdSense publisher ID (ca-pub-...) and ad unit slot, for content pages */
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADSENSE_SLOT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
