import { useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download, ImageUp, Loader2 } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { breadcrumbLd, faqLd, howToLd } from "@/lib/jsonld";
import { useLang } from "@/lib/useLang";
import { useHydrated } from "@/lib/useHydrated";
import { useAuthStore } from "@/store/authStore";
import { trackEvent } from "@/lib/analytics";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

// Marriage biodata maker: fill in a form, pick a design, download a one-page A4 PDF. Everything
// stays in the browser (the draft is saved to this device only). Free downloads carry a small
// "made with" line; Premium removes it.

type BioLang = "bn" | "en";
const FIELDS = [
  "name", "dateOfBirth", "height", "bloodGroup", "religion", "maritalStatus", "nationality",
  "presentAddress", "permanentAddress", "education", "occupation", "workplace", "monthlyIncome",
  "fatherName", "fatherOccupation", "motherName", "motherOccupation", "siblings",
  "aboutMe", "expectations", "contactName", "contactPhone", "contactEmail",
] as const;
type Field = (typeof FIELDS)[number];
type Draft = Record<Field, string> & { photo: string; design: Design; accent: string; language: BioLang };
type Design = "classic" | "elegant" | "modern";

const MULTILINE: Field[] = ["education", "siblings", "aboutMe", "expectations", "presentAddress", "permanentAddress"];

const LABELS: Record<BioLang, Record<Field | "title" | "personal" | "address" | "eduWork" | "family" | "about" | "contact", string>> = {
  bn: {
    title: "বায়োডাটা", personal: "ব্যক্তিগত তথ্য", address: "ঠিকানা", eduWork: "শিক্ষা ও পেশা", family: "পারিবারিক তথ্য", about: "নিজের সম্পর্কে", contact: "যোগাযোগ",
    name: "নাম", dateOfBirth: "জন্ম তারিখ", height: "উচ্চতা", bloodGroup: "রক্তের গ্রুপ", religion: "ধর্ম", maritalStatus: "বৈবাহিক অবস্থা", nationality: "জাতীয়তা",
    presentAddress: "বর্তমান ঠিকানা", permanentAddress: "স্থায়ী ঠিকানা", education: "শিক্ষাগত যোগ্যতা", occupation: "পেশা", workplace: "কর্মস্থল", monthlyIncome: "মাসিক আয়",
    fatherName: "পিতার নাম", fatherOccupation: "পিতার পেশা", motherName: "মাতার নাম", motherOccupation: "মাতার পেশা", siblings: "ভাই-বোন",
    aboutMe: "আমার সম্পর্কে", expectations: "প্রত্যাশিত জীবনসঙ্গী", contactName: "অভিভাবক", contactPhone: "মোবাইল", contactEmail: "ইমেইল",
  },
  en: {
    title: "Biodata", personal: "Personal details", address: "Address", eduWork: "Education & work", family: "Family", about: "About", contact: "Contact",
    name: "Name", dateOfBirth: "Date of birth", height: "Height", bloodGroup: "Blood group", religion: "Religion", maritalStatus: "Marital status", nationality: "Nationality",
    presentAddress: "Present address", permanentAddress: "Permanent address", education: "Education", occupation: "Occupation", workplace: "Workplace", monthlyIncome: "Monthly income",
    fatherName: "Father's name", fatherOccupation: "Father's occupation", motherName: "Mother's name", motherOccupation: "Mother's occupation", siblings: "Brothers & sisters",
    aboutMe: "About me", expectations: "Expected partner", contactName: "Guardian", contactPhone: "Mobile", contactEmail: "Email",
  },
};

const GROUPS: Array<{ key: "personal" | "address" | "eduWork" | "family" | "about" | "contact"; fields: Field[] }> = [
  { key: "personal", fields: ["name", "dateOfBirth", "height", "bloodGroup", "religion", "maritalStatus", "nationality"] },
  { key: "address", fields: ["presentAddress", "permanentAddress"] },
  { key: "eduWork", fields: ["education", "occupation", "workplace", "monthlyIncome"] },
  { key: "family", fields: ["fatherName", "fatherOccupation", "motherName", "motherOccupation", "siblings"] },
  { key: "about", fields: ["aboutMe", "expectations"] },
  { key: "contact", fields: ["contactName", "contactPhone", "contactEmail"] },
];

const ACCENTS = ["#7c3aed", "#be123c", "#0f766e", "#1d4ed8"];
const STORAGE_KEY = "biodata-draft";

const emptyDraft = (language: BioLang): Draft => ({
  ...(Object.fromEntries(FIELDS.map((field) => [field, ""])) as Record<Field, string>),
  nationality: language === "bn" ? "বাংলাদেশী" : "Bangladeshi",
  photo: "",
  design: "elegant",
  accent: ACCENTS[0],
  language,
});

const readDraft = (language: BioLang): Draft => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved && typeof saved === "object" ? { ...emptyDraft(language), ...saved } : emptyDraft(language);
  } catch {
    return emptyDraft(language);
  }
};

const saveDraft = (draft: Draft) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* storage full or blocked: the form still works */
  }
};

/** A small JPEG data URL of the photo, so the draft fits in browser storage */
const shrinkPhoto = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 360 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

/** The A4 biodata as it will be printed (794 × 1123 px = A4 at 96 dpi) */
function BiodataSheet({ draft, watermark }: { draft: Draft; watermark: boolean }) {
  const labels = LABELS[draft.language];
  const accent = draft.accent;
  const filled = (field: Field) => draft[field].trim();
  const frame: CSSProperties =
    draft.design === "elegant"
      ? { border: `3px double ${accent}`, outline: `1px solid ${accent}`, outlineOffset: "-14px" }
      : draft.design === "classic"
        ? { border: `2px solid ${accent}` }
        : { borderLeft: `14px solid ${accent}` };

  return (
    <div
      lang={draft.language === "bn" ? "bn" : "en"}
      className="relative flex flex-col bg-white text-[15px] leading-relaxed text-slate-900"
      style={{ width: 794, minHeight: 1123, padding: 56, fontFamily: draft.language === "bn" ? "'Hind Siliguri', 'Inter Variable', sans-serif" : "'Inter Variable', sans-serif", ...frame }}
    >
      <div className={cn("flex items-start gap-6", draft.design === "modern" ? "justify-between" : "flex-col items-center text-center")}>
        <div className={draft.design === "modern" ? "" : "w-full"}>
          {/* Letter spacing breaks Bangla's joined letters, so only English gets it */}
          <p className={cn("text-sm font-semibold", draft.language === "en" && "uppercase tracking-[0.3em]")} style={{ color: accent }}>
            {labels.title}
          </p>
          <h2 className="mt-1 text-3xl font-bold">{draft.name || labels.name}</h2>
        </div>
        {draft.photo && (
          <img src={draft.photo} alt="" className="h-36 w-28 rounded object-cover" style={{ border: `2px solid ${accent}` }} />
        )}
      </div>
      <div className="mt-6 space-y-5">
        {GROUPS.map((group) => {
          const fields = group.fields.filter((field) => field !== "name" && filled(field));
          if (!fields.length) return null;
          return (
            <section key={group.key}>
              <h3 className="mb-2 border-b pb-1 text-base font-semibold" style={{ color: accent, borderColor: `${accent}55` }}>
                {labels[group.key]}
              </h3>
              <dl className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-1">
                {fields.map((field) => (
                  <div key={field} className="contents">
                    <dt className="text-slate-500">{labels[field]}</dt>
                    <dd className="whitespace-pre-line">{draft[field]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
      {watermark && <p className="mt-auto pt-6 text-center text-[11px] text-slate-400">Made free with AI CV Builder BD · {SITE_URL.replace(/^https?:\/\//, "")}</p>}
    </div>
  );
}

function BiodataEditor({ initial }: { initial: Draft }) {
  const { t } = useTranslation();
  const toast = useToast();
  const hydrated = useHydrated();
  const user = useAuthStore((state) => state.user);
  const premium = hydrated && user?.subscription?.plan === "premium";
  const [draft, setDraftState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const labels = LABELS[draft.language];

  const update = (changes: Partial<Draft>) =>
    setDraftState((prev) => {
      const next = { ...prev, ...changes };
      saveDraft(next);
      return next;
    });

  const download = async () => {
    if (!sheet.current) return;
    setBusy(true);
    try {
      const [{ domToCanvas }, { jsPDF }] = await Promise.all([import("modern-screenshot"), import("jspdf")]);
      await document.fonts?.ready;
      const node = sheet.current.firstElementChild as HTMLElement;
      const canvas = await domToCanvas(node, { scale: 2, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      // One page: a taller biodata is scaled down to fit
      const ratio = Math.min(210 / canvas.width, 297 / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", (210 - width) / 2, 0, width, height);
      pdf.save(`${(draft.name || "biodata").replace(/[^\p{L}\p{N}]+/gu, "-")}-biodata.pdf`);
      trackEvent("file_download", { file_extension: "pdf", tool: "biodata_maker", watermark: !premium });
    } catch (error) {
      console.error("Biodata PDF failed", error);
      toast.add(t("biodata.failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const input = (field: Field) => {
    const common = {
      id: `bio-${field}`,
      value: draft[field],
      onChange: (event: { target: { value: string } }) => update({ [field]: event.target.value } as Partial<Draft>),
      className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm",
    };
    return (
      <label key={field} htmlFor={common.id} className={cn("block text-sm", MULTILINE.includes(field) && "sm:col-span-2")}>
        <span className="text-muted">{labels[field]}</span>
        {MULTILINE.includes(field) ? <textarea rows={field === "education" || field === "siblings" ? 3 : 2} {...common} /> : <input {...common} />}
      </label>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* min-w-0: grid items otherwise grow to the 794 px sheet and the page scrolls sideways */}
      <div className="min-w-0 space-y-4">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("biodata.language")}>
              {(["bn", "en"] as const).map((language) => (
                <Button key={language} size="sm" variant={draft.language === language ? "default" : "outline"} onClick={() => update({ language })}>
                  {language === "bn" ? "বাংলা" : "English"}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("biodata.design")}>
              {(["elegant", "classic", "modern"] as const).map((design) => (
                <Button key={design} size="sm" variant={draft.design === design ? "default" : "outline"} onClick={() => update({ design })}>
                  {t(`biodata.designs.${design}`)}
                </Button>
              ))}
              {ACCENTS.map((accent) => (
                <button
                  key={accent}
                  type="button"
                  aria-label={t("biodata.colour")}
                  aria-pressed={draft.accent === accent}
                  onClick={() => update({ accent })}
                  className={cn("h-8 w-8 rounded-full border-2", draft.accent === accent ? "border-foreground" : "border-transparent")}
                  style={{ backgroundColor: accent }}
                />
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
              <ImageUp className="h-4 w-4" aria-hidden />
              {draft.photo ? t("biodata.changePhoto") : t("biodata.addPhoto")}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) update({ photo: await shrinkPhoto(file).catch(() => "") });
                }}
              />
            </label>
            {draft.photo && (
              <button type="button" className="text-xs text-muted underline" onClick={() => update({ photo: "" })}>
                {t("biodata.removePhoto")}
              </button>
            )}
          </CardContent>
        </Card>
        {GROUPS.map((group) => (
          <Card key={group.key}>
            <CardContent className="pt-6">
              <h2 className="mb-3 font-semibold">{labels[group.key]}</h2>
              <div className="grid gap-3 sm:grid-cols-2">{group.fields.map(input)}</div>
            </CardContent>
          </Card>
        ))}
        <p className="text-xs text-muted">{t("biodata.privacy")}</p>
      </div>

      <div className="min-w-0 space-y-3 lg:sticky lg:top-20 lg:self-start">
        <Button variant="gradient" size="lg" className="w-full" onClick={() => void download()} disabled={busy}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          {t("biodata.download")}
        </Button>
        {!premium && <p className="text-center text-xs text-muted">{t("biodata.watermarkNote")}</p>}
        {/* The preview is the real-size sheet, scaled to fit the column */}
        <div className="overflow-hidden rounded-xl border border-border bg-slate-100 p-2 dark:bg-slate-900">
          <div ref={sheet} className="origin-top-left" style={{ width: 794, transform: "scale(var(--bio-scale, 0.5))", height: "calc(1123px * var(--bio-scale, 0.5))" }}>
            <BiodataSheet draft={draft} watermark={!premium} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BiodataMakerPage() {
  const { t } = useTranslation();
  const { lang, lp } = useLang();
  const hydrated = useHydrated();
  const steps = t("biodata.steps", { returnObjects: true }) as Array<{ name: string; text: string }>;
  const faqs = t("biodata.faqs", { returnObjects: true }) as Array<{ q: string; a: string }>;
  const tips = t("biodata.tips", { returnObjects: true }) as string[];

  return (
    <>
      <SEO
        title={t("biodata.seoTitle")}
        description={t("biodata.seoDescription")}
        jsonLd={[
          breadcrumbLd([
            { name: t("nav.home"), path: lp("/") },
            { name: t("biodata.h1"), path: lp("/marriage-biodata-maker") },
          ]),
          howToLd({ name: t("biodata.h1"), description: t("biodata.intro"), steps, lang }),
          faqLd(faqs),
        ]}
      />
      <section className="py-10 md:py-14 [--bio-scale:0.42] sm:[--bio-scale:0.55] lg:[--bio-scale:0.6] xl:[--bio-scale:0.68]">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className="text-3xl font-bold md:text-4xl">{t("biodata.h1")}</h1>
          <p className="mt-3 max-w-3xl text-lg text-muted">{t("biodata.intro")}</p>
          <div className="mt-8">
            {/* After hydration the editor restarts with the draft saved on this device */}
            <BiodataEditor key={hydrated ? "device" : "server"} initial={hydrated ? readDraft(lang) : emptyDraft(lang)} />
          </div>

          <section className="mt-14 max-w-3xl" aria-labelledby="biodata-tips">
            <h2 id="biodata-tips" className="text-2xl font-semibold">{t("biodata.tipsTitle")}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
          <section className="mt-10 max-w-3xl" aria-labelledby="biodata-how">
            <h2 id="biodata-how" className="text-2xl font-semibold">{t("biodata.howTitle")}</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
              {steps.map((step) => (
                <li key={step.name}>
                  <span className="font-medium text-foreground">{step.name}:</span> {step.text}
                </li>
              ))}
            </ol>
          </section>
          <section className="mt-10 max-w-3xl" aria-labelledby="biodata-faq">
            <h2 id="biodata-faq" className="text-2xl font-semibold">{t("landing.faqTitle")}</h2>
            <div className="mt-4 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="rounded-xl border border-border p-4">
                  <summary className="cursor-pointer font-medium">{faq.q}</summary>
                  <p className="mt-2 text-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
          <p className="mt-10 text-sm text-muted">
            {t("biodata.jobNote")}{" "}
            <Link to={lp("/biodata-format")} className="text-primary hover:underline">
              {t("biodata.jobLink")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
