/** DOM id of the print-only copy of the CV (components/resume/PrintableResume.tsx, index.css). */
export const PRINT_ROOT_ID = "cv-print-root";

/** A file name from the CV title, without characters that file systems reject. */
export const fileName = (title: string) => title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "CV";

/** Resolves once web fonts and the images under `root` (the photo) have loaded. */
export async function waitForAssets(root: HTMLElement | null) {
  const images = root ? Array.from(root.querySelectorAll("img")) : [];
  await Promise.all([
    document.fonts?.ready,
    ...images.map((img) =>
      img.complete ? Promise.resolve() : new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      })
    ),
  ]);
}

/** Opens the print dialog once fonts and the photo are ready; the file name defaults to `title`. */
export async function printResume(title: string) {
  await waitForAssets(document.getElementById(PRINT_ROOT_ID));
  const previous = document.title;
  document.title = fileName(title);
  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
  // Some mobile browsers never fire afterprint
  setTimeout(restore, 60_000);
}
