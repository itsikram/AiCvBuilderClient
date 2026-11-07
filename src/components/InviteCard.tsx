import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SITE_URL } from "@/lib/site";
import { localNumber } from "@/lib/trial";
import { useAuthStore } from "@/store/authStore";

/**
 * "Invite friends, earn Premium": the user's invite link with copy and share buttons, and how
 * many more friends who make a CV they need for the next reward (rules: Admin -> Settings).
 */
export function InviteCard() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [copied, setCopied] = useState(false);
  const referral = user?.referral;
  const code = referral?.code ?? user?.referralCode;
  if (!code || (referral && !referral.rewardEvery)) return null;

  const num = (n: number) => localNumber(n, i18n.language);
  const link = `${SITE_URL}/register?ref=${encodeURIComponent(code)}`;
  const message = t("invite.shareText", { link });
  const every = referral?.rewardEvery ?? 3;
  const done = every - (referral?.toNextReward ?? every);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the link is visible to copy by hand */
    }
  };

  return (
    <Card className="border-violet-200 dark:border-violet-900">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start gap-3">
          <Gift className="mt-0.5 h-6 w-6 shrink-0 text-violet-600" aria-hidden />
          <div>
            <h2 className="font-semibold">{t("invite.title", { days: num(referral?.rewardDays ?? 7) })}</h2>
            <p className="text-sm text-muted">{t("invite.text", { every: num(every), days: num(referral?.rewardDays ?? 7) })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={link}
            aria-label={t("invite.linkLabel")}
            onFocus={(event) => event.currentTarget.select()}
            className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-secondary/40 px-3 font-mono text-sm"
          />
          <Button variant="outline" onClick={() => void copy()} aria-live="polite">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("invite.copied") : t("invite.copy")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
          </Button>
        </div>
        {referral && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden>
              <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${(done / every) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {t("invite.progress", { qualified: num(referral.qualified), left: num(referral.toNextReward), signups: num(referral.signups) })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
