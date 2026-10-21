import { createPortal } from "react-dom";
import { PRINT_ROOT_ID } from "@/lib/resume/print";
import { ResumePreview } from "./ResumePreview";

type Props = Omit<Parameters<typeof ResumePreview>[0], "mode" | "showPageBreaks" | "className">;

/**
 * A real-size copy of the CV, attached to <body> and hidden except when printing
 * (see #cv-print-root in index.css). printResume() (lib/resume/print.ts) opens the browser's print
 * dialog, where "Save as PDF" produces a text-based PDF identical to the preview.
 */
export function PrintableResume(props: Props) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div id={PRINT_ROOT_ID} aria-hidden>
      <ResumePreview {...props} mode="print" />
    </div>,
    document.body
  );
}
