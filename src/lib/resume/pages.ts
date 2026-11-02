/**
 * A4 page geometry and page splitting for a rendered CV (.cv-page). The editor
 * preview uses it to mark where pages end and the PDF download (pdf.ts) uses it
 * to cut the same rendering into pages, so both always split in the same places.
 * Measurements are in CSS px of the unscaled page, even when the page is drawn
 * with a CSS transform (the preview is scaled to fit its column).
 */
export const PX_PER_MM = 96 / 25.4;
export const PAGE_WIDTH_PX = 210 * PX_PER_MM;
export const PAGE_HEIGHT_PX = 297 * PX_PER_MM;
/** Blank band at the bottom of each page and the top of pages 2+ (the CV's own padding tops page 1). */
export const PAGE_MARGIN_PX = 12 * PX_PER_MM;

export interface PageSlice {
  /** Part of the CV, in page px, that this PDF page shows */
  top: number;
  bottom: number;
}

export interface TextRun {
  text: string;
  x: number;
  top: number;
  width: number;
  height: number;
  /** Font size in px */
  fontSize: number;
}

interface Band {
  top: number;
  bottom: number;
}

const measure = (page: HTMLElement) => {
  const origin = page.getBoundingClientRect();
  const scale = origin.width / page.offsetWidth || 1;
  return (r: DOMRectReadOnly) => ({
    left: (r.left - origin.left) / scale,
    top: (r.top - origin.top) / scale,
    width: r.width / scale,
    height: r.height / scale,
  });
};

const textNodes = (root: Node) => {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent?.trim()) nodes.push(n as Text);
  return nodes;
};

/** Vertical bands that must not be cut: text lines, images, table rows, whole entries, headings with their first line. */
function keepTogether(page: HTMLElement): Band[] {
  const box = measure(page);
  const band = (r: DOMRectReadOnly): Band => {
    const b = box(r);
    return { top: b.top, bottom: b.top + b.height };
  };
  const range = document.createRange();
  const lines = (node: Text) => {
    range.selectNodeContents(node);
    return Array.from(range.getClientRects()).filter((r) => r.height > 0);
  };
  const maxBlock = PAGE_HEIGHT_PX - 2 * PAGE_MARGIN_PX;
  const bands: Band[] = [];

  for (const node of textNodes(page)) for (const r of lines(node)) bands.push(band(r));
  page.querySelectorAll("img, tr").forEach((el) => bands.push(band(el.getBoundingClientRect())));
  // Entries stay whole (like break-inside: avoid) unless taller than a page
  page.querySelectorAll(".cv-entry, .cv-header").forEach((el) => {
    const b = band(el.getBoundingClientRect());
    if (b.bottom - b.top <= maxBlock) bands.push(b);
  });
  // A heading moves to the next page with the first line under it
  page.querySelectorAll(".cv-heading").forEach((heading) => {
    const next = heading.nextElementSibling;
    const first = next && textNodes(next).map(lines).find((rects) => rects.length)?.[0];
    if (!first) return;
    bands.push({ top: band(heading.getBoundingClientRect()).top, bottom: band(first).bottom });
  });
  return bands;
}

/**
 * Splits the page into A4 pages: page 1 holds up to 285mm (297mm less the bottom margin),
 * later pages up to 273mm. Breaks move up to the nearest point that cuts no line or entry.
 */
export function pageSlices(page: HTMLElement): PageSlice[] {
  const bands = keepTogether(page);
  const height = page.offsetHeight;
  const contentEnd = Math.max(0, ...bands.map((b) => b.bottom));
  const slices: PageSlice[] = [];
  let top = 0;
  let room = PAGE_HEIGHT_PX - PAGE_MARGIN_PX;

  while (top + room < contentEnd && slices.length < 50) {
    const limit = top + room;
    let cut = limit;
    for (let moved = true; moved; ) {
      moved = false;
      for (const b of bands) {
        if (b.top < cut - 0.5 && b.bottom > cut + 0.5) {
          cut = b.top;
          moved = true;
        }
      }
    }
    const forced = cut <= top + 1;
    if (forced) cut = limit; // something taller than a page: cut it where the page ends
    slices.push({ top, bottom: cut });
    // The next page starts at the next content, not with the gap left above it
    const below = bands.filter((b) => b.top >= cut - 0.5).map((b) => b.top);
    top = forced || !below.length ? cut : Math.max(cut, Math.min(...below));
    room = PAGE_HEIGHT_PX - 2 * PAGE_MARGIN_PX;
  }
  slices.push({ top, bottom: Math.min(height, top + room + (slices.length ? 0 : PAGE_MARGIN_PX)) });
  return slices;
}

// Characters the PDF's built-in fonts can encode (Windows-1252); others (e.g. Bangla) stay image-only
const ENCODABLE = /^[\u0020-\u007e\u00a0-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013\u2014\u2018-\u201a\u201c-\u201e\u2020-\u2022\u2026\u2030\u2039\u203a\u20ac\u2122]+$/;

/**
 * The page's text as runs (one per line of each text node), placed where the browser drew it.
 * The PDF adds them as invisible text over the page image, so the text can be selected,
 * searched and read by applicant tracking systems.
 */
export function textRuns(page: HTMLElement): TextRun[] {
  const box = measure(page);
  const range = document.createRange();
  const runs: TextRun[] = [];

  for (const node of textNodes(page)) {
    const style = node.parentElement ? getComputedStyle(node.parentElement) : null;
    const fontSize = style ? parseFloat(style.fontSize) || 13 : 13;
    const upper = style?.textTransform === "uppercase";
    const value = node.data;
    let run: { start: number; end: number; left: number; right: number; top: number; bottom: number } | null = null;
    const flush = () => {
      if (!run) return;
      const text = value.slice(run.start, run.end).replace(/\s+/g, " ");
      // Punctuation left between Bangla words carries no meaning on its own
      if (/[0-9A-Za-z\u00c0-\u00ff]/.test(text))
        runs.push({ text: upper ? text.toUpperCase() : text, x: run.left, top: run.top, width: run.right - run.left, height: run.bottom - run.top, fontSize });
      run = null;
    };

    for (const word of value.matchAll(/\S+/g)) {
      const start = word.index ?? 0;
      const end = start + word[0].length;
      if (!ENCODABLE.test(word[0])) {
        flush();
        continue;
      }
      range.setStart(node, start);
      range.setEnd(node, end);
      // A word wrapped mid-way (break-all links) is placed by its first piece
      const rect = Array.from(range.getClientRects()).find((r) => r.width > 0);
      if (!rect) continue;
      const b = box(rect);
      if (run && Math.abs(b.top - run.top) < Math.max(2, b.height / 2)) {
        run.end = end;
        run.right = Math.max(run.right, b.left + b.width);
        run.bottom = Math.max(run.bottom, b.top + b.height);
      } else {
        flush();
        run = { start, end, left: b.left, right: b.left + b.width, top: b.top, bottom: b.top + b.height };
      }
    }
    flush();
  }
  return runs;
}
