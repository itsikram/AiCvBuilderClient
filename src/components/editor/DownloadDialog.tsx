import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { downloadResumePdf } from "@/lib/resume/pdf";
import { printResume } from "@/lib/resume/print";
import { getErrorMessage } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
  title: string;
  watermark: boolean;
  /** Saves pending edits so the stored CV matches the download */
  saveNow: () => Promise<void>;
  /** Free plan: downloads carry the watermark unless a PDF credit is used */
  freePlan?: boolean;
  /** Watermark-free PDF credits left */
  credits?: number;
  /** A credit was already used for this CV in this session (and the watermark is off) */
  unlocked?: boolean;
  /** Uses one credit and turns the watermark off for the next download */
  onUnlock?: () => Promise<void>;
  /** Turns the watermark back on after the watermark-free download */
  onRelock?: () => void;
}

/** Waits until React has re-rendered the print copy (watermark off) and the browser painted it. */
const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 50))));

/**
 * "Download PDF" makes the file in the browser from the same rendering as the preview
 * (lib/resume/pdf.ts), so it matches the preview exactly, page breaks included, and
 * Bangla is shaped correctly. Printing stays available for paper copies.
 */
export function DownloadDialog({ open, onOpenChange, resumeId, title, watermark, saveNow, freePlan, credits = 0, unlocked, onUnlock, onRelock }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const canGoClean = Boolean(freePlan && onUnlock && (unlocked || credits > 0));

  const download = async (clean: boolean) => {
    setBusy(true);
    try {
      await saveNow().catch(() => undefined);
      if (clean && !unlocked) {
        try {
          await onUnlock!();
        } catch (error) {
          toast.add(getErrorMessage(error, t("editor.download.creditFailed")), "error");
          return;
        }
        await nextPaint();
      }
      await downloadResumePdf(title);
      // Counts the download in the admin stats; the PDF is already saved either way
      void api.post(`/resumes/${resumeId}/exported`).catch(() => undefined);
      trackEvent("file_download", { file_extension: "pdf", watermark: clean ? false : watermark });
      // One credit is one download: the watermark comes back once this one succeeded
      if (clean) onRelock?.();
      onOpenChange(false);
    } catch (error) {
      console.error("PDF download failed", error);
      toast.add(t("editor.download.failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)} title={t("editor.download.title")} size="sm">
      <div className="space-y-4">
        <p className="text-sm">{t("editor.download.intro")}</p>
        {canGoClean ? (
          <>
            <Button type="button" variant="gradient" size="lg" className="w-full" disabled={busy} onClick={() => void download(true)}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              {busy ? t("editor.download.preparing") : unlocked ? t("editor.download.clean") : t("editor.download.useCredit", { count: credits })}
            </Button>
            {!unlocked && (
              <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void download(false)}>
                {t("editor.download.withWatermark")}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button type="button" variant="gradient" size="lg" className="w-full" disabled={busy} onClick={() => void download(false)}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              {busy ? t("editor.download.preparing") : t("editor.download.button")}
            </Button>
            {watermark && (
              <p className="text-xs text-muted">
                {t("editor.download.watermarkNote")}{" "}
                <Link to="/dashboard/shop" className="text-primary underline underline-offset-2" onClick={() => onOpenChange(false)}>
                  {t("editor.download.buyCredit")}
                </Link>
              </p>
            )}
          </>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2 disabled:opacity-50"
          disabled={busy}
          onClick={() => {
            onOpenChange(false);
            // Let the dialog close before the print snapshot is taken
            setTimeout(() => void printResume(title), 150);
          }}
        >
          <Printer className="h-4 w-4" />
          {t("editor.download.print")}
        </button>
      </div>
    </Dialog>
  );
}
