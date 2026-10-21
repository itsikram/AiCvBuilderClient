/** DOM id of the print-only copy of the CV (components/resume/PrintableResume.tsx, index.css). */
export const PRINT_ROOT_ID = "cv-print-root";

/** Opens the print dialog once fonts and the photo are ready; the file name defaults to `title`. */
export async function printResume(title: string) {
  const root = document.getElementById(PRINT_ROOT_ID);
  const images = root ? Array.from(root.querySelectorAll("img")) : [];
  await Promise.all([
    document.fonts?.ready,
    ...images.map((img) => (img.complete ? Promise.resolve() : new Promise((resolve) => img.addEventListener("load", resolve, { once: true })))),
  ]);
  const previous = document.title;
  document.title = title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "CV";
  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
  // Some mobile browsers never fire afterprint
  setTimeout(restore, 60_000);
}
