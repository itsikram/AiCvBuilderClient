import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { downloadResumePdf } from "@/lib/resume/pdf";
import { printResume } from "@/lib/resume/print";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  watermark: boolean;
  /** Saves pending edits so the stored CV matches the download */
  saveNow: () => Promise<void>;
}

/**
 * "Download PDF" makes the file in the browser from the same rendering as the preview
 * (lib/resume/pdf.ts), so it matches the preview exactly, page breaks included, and
 * Bangla is shaped correctly. Printing stays available for paper copies.
 */
export function DownloadDialog({ open, onOpenChange, title, watermark, saveNow }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await saveNow().catch(() => undefined);
      await downloadResumePdf(title);
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
        <Button type="button" variant="gradient" size="lg" className="w-full" disabled={busy} onClick={() => void download()}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          {busy ? t("editor.download.preparing") : t("editor.download.button")}
        </Button>
        {watermark && <p className="text-xs text-muted">{t("editor.download.watermarkNote")}</p>}
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
