import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardPaste, FileUp, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { confirmAction } from "@/lib/confirm";
import { useToast } from "@/components/ui/toast";
import api, { getErrorMessage } from "@/lib/api";
import { AI_QUOTA_KEY } from "@/lib/ai";
import { cn } from "@/lib/utils";
import type { ResumeContent } from "@/types";
import { QuotaNote } from "./ai";

interface ImportResult {
  resumeId: string;
  title: string;
  content: ResumeContent;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Import into this CV (replacing its content); omit to create a new CV */
  resumeId?: string;
  /** Whether the target CV already has content worth confirming before replacing */
  hasContent?: boolean;
  onImported: (result: ImportResult) => void;
}

export function ImportDialog({ open, onOpenChange, resumeId, hasContent, onImported }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const run = async (send: () => Promise<ImportResult>) => {
    if (hasContent && !(await confirmAction({ title: t("ai.import.replaceConfirm"), text: t("ai.import.replaceWarning"), confirmLabel: t("ai.import.run"), destructive: true }))) return;
    setBusy(true);
    try {
      const result = await send();
      toast.add(t("ai.import.done"), "success");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setText("");
      onImported(result);
      onOpenChange(false);
    } catch (error) {
      toast.add(getErrorMessage(error, t("common.error")), "error");
    } finally {
      setBusy(false);
      setProgress(0);
      queryClient.invalidateQueries({ queryKey: AI_QUOTA_KEY });
    }
  };

  const uploadFile = (file: File | undefined) => {
    if (!file) return;
    void run(async () => {
      const form = new FormData();
      form.append("file", file);
      if (resumeId) form.append("resumeId", resumeId);
      const { data } = await api.post("/resumes/upload-parse", form, {
        timeout: 180_000,
        onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      return data.data as ImportResult;
    });
  };

  const importText = () =>
    run(async () => {
      const { data } = await api.post("/resumes/import-text", { text, ...(resumeId ? { resumeId } : {}) }, { timeout: 180_000 });
      return data.data as ImportResult;
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} busy={busy} title={t("ai.import.title")} description={t("ai.import.intro")}>
      <div className="space-y-4">
        <div className="flex gap-1 rounded-lg bg-secondary p-1" role="tablist">
          {(["file", "paste"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              disabled={busy}
              onClick={() => setMode(m)}
              className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium", mode === m ? "bg-background shadow-sm" : "text-muted")}
            >
              {m === "file" ? <FileUp className="h-4 w-4" /> : <ClipboardPaste className="h-4 w-4" />}
              {t(`ai.import.${m}`)}
            </button>
          ))}
        </div>

        {hasContent && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{t("ai.import.replaceWarning")}</p>}

        {busy ? (
          <div className="space-y-2 py-4" role="status">
            <p className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("ai.import.working")}
            </p>
            {progress > 0 && progress < 100 && (
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : mode === "file" ? (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Upload className="h-8 w-8 text-muted" aria-hidden />
            <span className="font-medium">{t("ai.import.choose")}</span>
            <span className="text-xs text-muted">{t("ai.import.formats")}</span>
          </button>
        ) : (
          <div className="space-y-3">
            <label htmlFor="import-text" className="sr-only">
              {t("ai.import.pastePlaceholder")}
            </label>
            <textarea
              id="import-text"
              className="min-h-[220px] w-full rounded-lg border bg-background p-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
              placeholder={t("ai.import.pastePlaceholder")}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button type="button" variant="gradient" disabled={text.trim().length < 80} onClick={() => void importText()}>
              {t("ai.import.run")}
            </Button>
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-label={t("ai.import.choose")}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            uploadFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <QuotaNote />
      </div>
    </Dialog>
  );
}
