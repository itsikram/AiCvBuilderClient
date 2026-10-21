import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { printResume } from "@/lib/resume/print";
import type { CvLang } from "@/lib/resume/model";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
  title: string;
  language: CvLang;
  watermark: boolean;
  /** Saves pending edits before the server builds its PDF */
  saveNow: () => Promise<void>;
}

/**
 * The main export prints the on-screen CV ("Save as PDF"), so the PDF matches
 * the preview and Bangla renders correctly. The server's quick PDF stays as a
 * fallback for English CVs (its built-in fonts have no Bangla glyphs).
 */
export function DownloadDialog({ open, onOpenChange, resumeId, title, language, watermark, saveNow }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const [directBusy, setDirectBusy] = useState(false);
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

  const direct = async () => {
    setDirectBusy(true);
    try {
      await saveNow();
      const res = await api.get(`/resumes/${resumeId}/export-pdf`, { responseType: "blob", timeout: 60_000 });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "CV"}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toast.add(t("editor.download.directFailed"), "error");
    } finally {
      setDirectBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t("editor.download.title")} size="sm">
      <div className="space-y-4">
        <p className="text-sm">{t("editor.download.intro")}</p>
        {isAndroid && <p className="rounded-lg bg-secondary p-3 text-sm">{t("editor.download.android")}</p>}
        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={() => {
            onOpenChange(false);
            // Let the dialog close before the print snapshot is taken
            setTimeout(() => void printResume(title), 150);
          }}
        >
          <Printer className="h-5 w-5" />
          {t("editor.download.open")}
        </Button>
        {watermark && <p className="text-xs text-muted">{t("editor.download.watermarkNote")}</p>}
        {language === "en" && (
          <button type="button" className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2 disabled:opacity-50" disabled={directBusy} onClick={() => void direct()}>
            {directBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t("editor.download.direct")}
          </button>
        )}
      </div>
    </Dialog>
  );
}
