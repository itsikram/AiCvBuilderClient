import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** CV strength (0-100) as a coloured bar: red, then amber from 50, green from 80. */
export function StrengthBar({ score, className }: { score: number; className?: string }) {
  const { t } = useTranslation();
  const color = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-secondary", className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={t("editor.strength")}>
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
    </div>
  );
}
