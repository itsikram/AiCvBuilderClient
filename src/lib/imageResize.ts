// Browser-only image helpers for the photo & signature resizer: crop to an exact pixel size,
// optionally clean a signature's background, and compress a JPEG under a KB limit. Nothing
// is uploaded; files never leave the visitor's device.

export interface ResizeOptions {
  width: number;
  height: number;
  /** 1 = the image just covers the frame; larger zooms in */
  zoom: number;
  /** -1..1: which part of the overflow to keep (0 = centre) */
  panX: number;
  panY: number;
  /** Signatures: make the paper pure white and the ink darker */
  cleanBackground?: boolean;
}

export const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Not an image the browser can open"));
    };
    img.src = url;
  });

/** Draws the image to cover a width × height frame (like CSS object-fit: cover), with zoom and pan. */
export const renderToCanvas = (img: HTMLImageElement, options: ResizeOptions): HTMLCanvasElement => {
  const { width, height, zoom, panX, panY } = options;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight) * Math.max(1, zoom);
  const drawWidth = img.naturalWidth * scale;
  const drawHeight = img.naturalHeight * scale;
  const x = (width - drawWidth) / 2 + ((drawWidth - width) / 2) * -panX;
  const y = (height - drawHeight) / 2 + ((drawHeight - height) / 2) * -panY;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, x, y, drawWidth, drawHeight);

  if (options.cleanBackground) {
    const data = ctx.getImageData(0, 0, width, height);
    const pixels = data.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      // Paper (light) becomes white; ink keeps its colour but darker for a crisp signature
      const value = lum > 165 ? 255 : Math.max(0, lum * 0.55);
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    }
    ctx.putImageData(data, 0, 0);
  }
  return canvas;
};

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode"))), "image/jpeg", quality));

/** The best-quality JPEG that fits under maxKB (binary search on quality). */
export const jpegUnder = async (canvas: HTMLCanvasElement, maxKB: number): Promise<{ blob: Blob; quality: number; fits: boolean }> => {
  const limit = maxKB * 1024;
  let best = await toBlob(canvas, 0.92);
  if (best.size <= limit) return { blob: best, quality: 0.92, fits: true };
  let low = 0.05;
  let high = 0.92;
  let bestQuality = 0;
  let found: Blob | null = null;
  for (let i = 0; i < 8; i++) {
    const mid = (low + high) / 2;
    const blob = await toBlob(canvas, mid);
    if (blob.size <= limit) {
      found = blob;
      bestQuality = mid;
      low = mid;
    } else {
      high = mid;
      best = blob;
    }
  }
  return found ? { blob: found, quality: bestQuality, fits: true } : { blob: best, quality: low, fits: false };
};
