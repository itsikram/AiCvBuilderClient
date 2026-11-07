import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import api, { getErrorMessage } from "@/lib/api";
import { usePublicConfig } from "@/lib/publicConfig";
import { useThemeStore } from "@/store/themeStore";
import { useToast } from "@/components/ui/toast";
import type { User } from "@/store/authStore";

export interface GoogleSignInResult {
  user: User;
  accessToken: string;
  /** True when this Google account had no account here yet (it was just created). */
  isNewUser: boolean;
}

interface Props {
  /** The button reads "Sign in with Google" or "Sign up with Google". */
  mode: "signin" | "signup";
  /** Invite code to credit when the Google account is new. */
  referralCode?: string;
  onSignedIn: (result: GoogleSignInResult) => Promise<void> | void;
}

/**
 * "Sign in with Google" followed by an "or use your email" divider. Renders nothing until a Google
 * client ID is set (Admin -> Settings -> Google Sign-In, or VITE_GOOGLE_CLIENT_ID). The provider
 * loads Google's script, so it lives only on the login and sign-up pages, not around the whole app.
 */
export function GoogleSignIn(props: Props) {
  const { i18n } = useTranslation();
  const { googleClientId } = usePublicConfig();
  const locale = i18n.language === "bn" ? "bn" : "en";
  if (!googleClientId) return null;
  return (
    // The provider reads the locale once, so a language switch remounts it
    <GoogleOAuthProvider key={locale} clientId={googleClientId} locale={locale}>
      <GoogleButton {...props} locale={locale} />
    </GoogleOAuthProvider>
  );
}

function GoogleButton({ mode, referralCode, onSignedIn, locale }: Props & { locale: "en" | "bn" }) {
  const { t } = useTranslation();
  const toast = useToast();
  const dark = useThemeStore((state) => state.resolvedTheme === "dark");
  const boxRef = useRef<HTMLDivElement>(null);
  // Google draws its button 200-400px wide and ignores percentages, so it is sized to the card
  const [width, setWidth] = useState<number>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    // ResizeObserver also reports the first size, so this sets the width on mount
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(Math.min(400, Math.max(200, entry.contentRect.width)))),
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const handleCredential = async (credential: string) => {
    setBusy(true);
    try {
      const { data } = await api.post("/auth/google", { credential, referralCode: referralCode?.trim() || undefined, language: locale });
      await onSignedIn({ user: data.data.user, accessToken: data.data.accessToken, isNewUser: Boolean(data.data.isNewUser) });
    } catch (err) {
      toast.add(getErrorMessage(err, t("auth.googleFailed")), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div ref={boxRef} className={`flex h-10 justify-center ${busy ? "pointer-events-none opacity-60" : ""}`} aria-busy={busy}>
        {width && (
          <GoogleLogin
            onSuccess={(res) => res.credential && handleCredential(res.credential)}
            onError={() => toast.add(t("auth.googleFailed"), "error")}
            text={mode === "signup" ? "signup_with" : "signin_with"}
            theme={dark ? "filled_black" : "outline"}
            size="large"
            width={width}
          />
        )}
      </div>
      <p className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" aria-hidden />
        {t("auth.orEmail")}
        <span className="h-px flex-1 bg-border" aria-hidden />
      </p>
    </div>
  );
}
