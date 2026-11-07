import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download, ImageUp } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { breadcrumbLd, faqLd, howToLd } from "@/lib/jsonld";
import { useLang } from "@/lib/useLang";
import { jpegUnder, loadImage, renderToCanvas } from "@/lib/imageResize";
import { trackEvent } from "@/lib/analytics";

interface Preset {
  id: string;
  width: number;
  height: number;
  maxKB: number;
}

const PHOTO_PRESETS: Preset[] = [
  { id: "teletalk", width: 300, height: 300, maxKB: 100 },
  { id: "passport", width: 413, height: 531, maxKB: 200 },
  { id: "admission", width: 300, height: 300, maxKB: 300 },
];
const SIGNATURE_PRESETS: Preset[] = [
  { id: "teletalk", width: 300, height: 80, maxKB: 60 },
  { id: "admission", width: 300, height: 80, maxKB: 100 },
];

/** One resizer panel: choose an image, frame it, and download a JPEG of the exact size. */
function ImageTool({ kind }: { kind: "photo" | "signature" }) {
  const { t } = useTranslation();
  const presets = kind === "photo" ? PHOTO_PRESETS : SIGNATURE_PRESETS;
  const [preset, setPreset] = useState<Preset>(presets[0]);
  const [custom, setCustom] = useState({ width: preset.width, height: preset.height, maxKB: preset.maxKB });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(kind === "photo" ? -0.3 : 0);
  const [clean, setClean] = useState(kind === "signature");
  const [result, setResult] = useState<{ url: string; kb: number; fits: boolean } | null>(null);
  const [error, setError] = useState("");
  const isCustom = preset.id === "custom";
  const size = isCustom ? custom : preset;
  const previewRef = useRef<string | null>(null);

  // Re-render the output whenever the image or a setting changes
  useEffect(() => {
    if (!image) return;
    let cancelled = false;
    const run = async () => {
      const width = Math.min(3000, Math.max(20, Math.round(size.width)));
      const height = Math.min(3000, Math.max(20, Math.round(size.height)));
      const canvas = renderToCanvas(image, { width, height, zoom, panX, panY, cleanBackground: kind === "signature" && clean });
      const { blob, fits } = await jpegUnder(canvas, Math.max(5, size.maxKB));
      if (cancelled) return;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      const url = URL.createObjectURL(blob);
      previewRef.current = url;
      setResult({ url, kb: Math.round((blob.size / 1024) * 10) / 10, fits });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [image, size.width, size.height, size.maxKB, zoom, panX, panY, clean, kind]);

  const choose = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      setImage(await loadImage(file));
      setFileName(file.name.replace(/\.[^.]+$/, ""));
      setZoom(1);
      trackEvent("tool_use", { tool: "photo_resizer", kind });
    } catch {
      setError(t("resizer.badFile"));
    }
  };

  const download = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.url;
    link.download = `${fileName || kind}-${size.width}x${size.height}.jpg`;
    link.click();
    trackEvent("file_download", { file_extension: "jpg", tool: "photo_resizer", kind });
  };

  const slider = (label: string, value: number, set: (v: number) => void, min: number, max: number, step: number) => (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="mt-1 w-full accent-primary" />
    </label>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t(`resizer.${kind}Title`)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block text-sm">
          <span className="font-medium">{t("resizer.preset")}</span>
          <select
            value={preset.id}
            onChange={(e) => {
              const next = presets.find((p) => p.id === e.target.value) ?? { id: "custom", ...custom };
              setPreset(next as Preset);
            }}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-base sm:text-sm"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {t(`resizer.presets.${p.id}`)} ({p.width}×{p.height} px, max {p.maxKB} KB)
              </option>
            ))}
            <option value="custom">{t("resizer.presets.custom")}</option>
          </select>
        </label>
        {isCustom && (
          <div className="grid grid-cols-3 gap-2">
            {(["width", "height", "maxKB"] as const).map((key) => (
              <label key={key} className="text-sm">
                <span className="text-muted">{t(`resizer.${key}`)}</span>
                <input
                  type="number"
                  min={key === "maxKB" ? 5 : 20}
                  max={key === "maxKB" ? 5000 : 3000}
                  value={custom[key]}
                  onChange={(e) => setCustom({ ...custom, [key]: Number(e.target.value) })}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-base sm:text-sm"
                />
              </label>
            ))}
          </div>
        )}

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-5 text-center hover:border-primary">
          <ImageUp className="h-6 w-6 text-primary" aria-hidden />
          <span className="text-sm font-medium">{image ? t("resizer.change") : t(`resizer.choose_${kind}`)}</span>
          <span className="text-xs text-muted">{t("resizer.private")}</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => void choose(e.target.files?.[0])} />
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {image && (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="space-y-2">
              {slider(t("resizer.zoom"), zoom, setZoom, 1, 3, 0.05)}
              {slider(t("resizer.left_right"), panX, setPanX, -1, 1, 0.05)}
              {slider(t("resizer.up_down"), panY, setPanY, -1, 1, 0.05)}
              {kind === "signature" && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={clean} onChange={(e) => setClean(e.target.checked)} className="h-4 w-4 accent-primary" />
                  {t("resizer.clean")}
                </label>
              )}
            </div>
            {result && (
              <div className="text-center">
                <img
                  src={result.url}
                  alt={t("resizer.previewAlt")}
                  width={size.width}
                  height={size.height}
                  className="mx-auto max-h-56 w-auto max-w-full rounded border border-border bg-white object-contain"
                />
                <p className={`mt-2 text-xs ${result.fits ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>
                  {size.width}×{size.height} px · {result.kb} KB {result.fits ? "✓" : `> ${size.maxKB} KB`}
                </p>
              </div>
            )}
          </div>
        )}

        <Button variant="gradient" className="w-full" disabled={!result || !result.fits} onClick={download}>
          <Download className="h-4 w-4" />
          {t("resizer.download")}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PhotoResizerPage() {
  const { t } = useTranslation();
  const { lang, lp } = useLang();
  const steps = t("resizer.steps", { returnObjects: true }) as Array<{ name: string; text: string }>;
  const faqs = t("resizer.faqs", { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <>
      <SEO
        title={t("resizer.seoTitle")}
        description={t("resizer.seoDescription")}
        jsonLd={[
          breadcrumbLd([
            { name: t("nav.home"), path: lp("/") },
            { name: t("resizer.h1"), path: lp("/photo-signature-resizer") },
          ]),
          howToLd({ name: t("resizer.h1"), description: t("resizer.intro"), steps, lang }),
          faqLd(faqs),
        ]}
      />
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <h1 className="text-3xl font-bold md:text-4xl">{t("resizer.h1")}</h1>
          <p className="mt-3 max-w-3xl text-lg text-muted">{t("resizer.intro")}</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <ImageTool kind="photo" />
            <ImageTool kind="signature" />
          </div>

          <section className="mt-12" aria-labelledby="resizer-how">
            <h2 id="resizer-how" className="text-2xl font-semibold">{t("resizer.howTitle")}</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
              {steps.map((step) => (
                <li key={step.name}>
                  <span className="font-medium text-foreground">{step.name}:</span> {step.text}
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10" aria-labelledby="resizer-faq">
            <h2 id="resizer-faq" className="text-2xl font-semibold">{t("landing.faqTitle")}</h2>
            <div className="mt-4 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="rounded-xl border border-border p-4">
                  <summary className="cursor-pointer font-medium">{faq.q}</summary>
                  <p className="mt-2 text-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h2 className="text-xl font-semibold">{t("resizer.ctaTitle")}</h2>
            <p className="mt-2 text-muted">{t("resizer.ctaText")}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="gradient" asChild>
                <Link to="/register">{t("landing.heroCta")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={lp("/jobs")}>{t("jobs.browse")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
