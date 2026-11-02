import { PAGE_HEIGHT_PX, PAGE_MARGIN_PX, PAGE_WIDTH_PX, PX_PER_MM, pageSlices, textRuns } from "./pages";
import { PRINT_ROOT_ID, fileName, waitForAssets } from "./print";

/** Pixel budget for the capture; iOS Safari refuses canvases over ~16.7M pixels. */
const MAX_CANVAS_PIXELS = 12_000_000;
/** Capture resolution: 2.5 = 240 dpi, sharp in print at about 450 KB per page */
const MAX_SCALE = 2.5;

const mm = (px: number) => px / PX_PER_MM;

/**
 * Downloads the CV as an A4 PDF file that looks exactly like the preview: the browser
 * draws the real-size copy of the CV (PrintableResume, same markup and styles as the
 * preview), that drawing becomes the PDF pages, split where the preview marks page
 * ends (pages.ts). Invisible text is laid over each page so the PDF stays searchable
 * and readable by applicant tracking systems.
 */
export async function downloadResumePdf(title: string) {
  const [{ domToCanvas }, { jsPDF }] = await Promise.all([import("modern-screenshot"), import("jspdf")]);

  // The copy renders once the CV language's headings have loaded
  const root = document.getElementById(PRINT_ROOT_ID);
  let page = root?.querySelector<HTMLElement>(".cv-page");
  for (let i = 0; root && !page && i < 50; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    page = root.querySelector<HTMLElement>(".cv-page");
  }
  if (!root || !page) throw new Error("The CV is not rendered");

  // The copy is hidden (display: none) until printing; lay it out off-screen to measure and draw it
  root.dataset.capture = "";
  try {
    await waitForAssets(root);
    const width = page.offsetWidth;
    const height = page.offsetHeight;
    const slices = pageSlices(page);
    const runs = textRuns(page);
    const background = getComputedStyle(page).backgroundColor || "#ffffff";

    const scale = Math.min(MAX_SCALE, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
    const shot = await domToCanvas(page, { scale, backgroundColor: background, timeout: 20_000 });
    const sx = shot.width / width;
    const sy = shot.height / height;

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    pdf.setProperties({ title: fileName(title), creator: "AI CV Builder BD" });
    pdf.setFont("helvetica", "normal");

    const sheet = document.createElement("canvas");
    sheet.width = Math.round(PAGE_WIDTH_PX * sx);
    sheet.height = Math.round(PAGE_HEIGHT_PX * sy);
    const ctx = sheet.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");

    slices.forEach((slice, i) => {
      if (i > 0) pdf.addPage("a4", "portrait");
      const offset = i > 0 ? PAGE_MARGIN_PX : 0;
      const sliceHeight = Math.min(slice.bottom, height) - slice.top;

      ctx.fillStyle = background;
      ctx.fillRect(0, 0, sheet.width, sheet.height);
      ctx.drawImage(shot, 0, Math.round(slice.top * sy), shot.width, Math.round(sliceHeight * sy), 0, Math.round(offset * sy), shot.width, Math.round(sliceHeight * sy));
      pdf.addImage(sheet.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, 297, undefined, "FAST");

      for (const run of runs) {
        if (run.top < slice.top - 1 || run.top + run.height > slice.bottom + 1) continue;
        pdf.setFontSize(run.fontSize * 0.75);
        const natural = pdf.getTextWidth(run.text);
        if (!natural) continue;
        pdf.text(run.text, mm(run.x), mm(run.top - slice.top + offset + run.height / 2), {
          baseline: "middle",
          renderingMode: "invisible",
          horizontalScale: Math.min(3, Math.max(0.3, mm(run.width) / natural)),
        });
      }
    });

    const url = URL.createObjectURL(pdf.output("blob"));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName(title)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } finally {
    delete root.dataset.capture;
  }
}
