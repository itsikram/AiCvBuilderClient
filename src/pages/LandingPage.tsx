import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Target,
  Mail,
  FileText,
  Languages,
  Download,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { usePageContent } from "@/context/PageContentContext";
import { GUIDES } from "@/content/guides";
import { useLang } from "@/lib/useLang";
import { faqLd, organizationLd, webApplicationLd, websiteLd } from "@/lib/jsonld";

const featureIcons = [Sparkles, Target, Mail, FileText, Download, Languages];
const featureKeys = ["aiWriting", "tailor", "coverLetter", "templates", "pdf", "bilingual"] as const;
const stepIcons = [ClipboardList, Wand2, Download];

export default function LandingPage() {
  const { t } = useTranslation();
  const { lang, lp } = useLang();
  const { getPageContent } = usePageContent();
  const homeContent = getPageContent("home");

  // Admin CMS overrides, with translated defaults
  const heroTitle = (homeContent?.heroTitle as string) || t("landing.heroTitle");
  const heroSubtitle = (homeContent?.heroSubtitle as string) || t("landing.heroSubtitle");
  const heroCTA = (homeContent?.heroCTA as string) || t("landing.heroCta");
  const heroCTASecondary = (homeContent?.heroCTASecondary as string) || t("landing.heroCtaSecondary");

  // Stats appear only when an admin enters real numbers in the CMS
  let stats: Array<{ value: string; label: string }> = [];
  if (typeof homeContent?.statsSection === "string") {
    try {
      const parsed = JSON.parse(homeContent.statsSection);
      if (Array.isArray(parsed)) stats = parsed;
    } catch {
      /* ignore malformed CMS JSON */
    }
  }

  const faqs = (t("landing.faqs", { returnObjects: true }) as Array<{ q: string; a: string }>) || [];
  const points = t("landing.bdPoints", { returnObjects: true }) as string[];

  return (
    <>
      <SEO
        title={t("landing.seoTitle")}
        description={t("landing.seoDescription")}
        jsonLd={[organizationLd(), websiteLd(lang), webApplicationLd(lang), faqLd(faqs)]}
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" aria-hidden="true" />
        <div className="container relative mx-auto grid items-center gap-10 px-4 py-12 md:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="text-center lg:text-left">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("landing.badge")}
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              <span className="gradient-text">{heroTitle}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted lg:mx-0">{heroSubtitle}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/register">
                  {heroCTA}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to={lp("/templates")}>{heroCTASecondary}</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted lg:justify-start">
              {(t("landing.heroTrust", { returnObjects: true }) as string[]).map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Lightweight CSS mock of a CV: no image download on the critical path */}
          <div className="mx-auto hidden w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-xl dark:bg-slate-900 sm:block" aria-hidden="true">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-500" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded bg-slate-800 dark:bg-slate-200" />
                <div className="h-2.5 w-1/2 rounded bg-slate-300 dark:bg-slate-600" />
              </div>
            </div>
            {["w-1/3", "w-1/4", "w-2/5"].map((width) => (
              <div key={width} className="mt-6 space-y-2">
                <div className={`h-2.5 ${width} rounded bg-blue-600`} />
                <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2 w-11/12 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="container relative mx-auto grid max-w-3xl grid-cols-2 gap-4 px-4 pb-12 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-background p-4 text-center">
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="mt-1 text-sm text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="py-14 md:py-20" aria-labelledby="how-heading">
        <div className="container mx-auto px-4">
          <h2 id="how-heading" className="text-center text-3xl font-bold">{t("landing.howTitle")}</h2>
          <ol className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
            {(t("landing.steps", { returnObjects: true }) as Array<{ title: string; text: string }>).map((step, index) => {
              const Icon = stepIcons[index] ?? ClipboardList;
              return (
                <li key={step.title} className="rounded-2xl border border-border p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">
                    {(index + 1).toLocaleString(lang === "bn" ? "bn-BD" : "en")}. {step.title}
                  </h3>
                  <p className="mt-2 text-muted">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-secondary/30 py-14 md:py-20" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <h2 id="features-heading" className="text-center text-3xl font-bold">{t("landing.featuresTitle")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureKeys.map((key, index) => {
              const Icon = featureIcons[index];
              return (
                <div key={key} className="h-full rounded-2xl border border-border bg-background p-6">
                  <Icon className="mb-4 h-9 w-9 text-primary" aria-hidden="true" />
                  <h3 className="mb-2 text-lg font-semibold">{t(`landing.features.${key}.title`)}</h3>
                  <p className="text-sm text-muted">{t(`landing.features.${key}.text`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20" aria-labelledby="bd-heading">
        <div className="container mx-auto grid max-w-5xl gap-10 px-4 md:grid-cols-2">
          <div>
            <h2 id="bd-heading" className="text-3xl font-bold">{t("landing.bdTitle")}</h2>
            <p className="mt-3 text-muted">{t("landing.bdText")}</p>
            <ul className="mt-6 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{t("landing.guidesTitle")}</h2>
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
              {GUIDES.map((guide) => (
                <li key={guide.slug}>
                  <Link to={lp(`/${guide.slug}`)} className="flex items-center justify-between gap-3 p-4 transition-colors hover:text-primary">
                    <span>{guide[lang].h1}</span>
                    <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-secondary/30 py-14 md:py-20" aria-labelledby="faq-heading">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 id="faq-heading" className="text-center text-3xl font-bold">{t("landing.faqTitle")}</h2>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-background">
            {faqs.map((faq) => (
              <details key={faq.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>
                <p className="mt-2 text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">{t("landing.finalTitle")}</h2>
          <p className="mt-3 text-muted">{t("landing.finalText")}</p>
          <Button variant="gradient" size="lg" asChild className="mt-6">
            <Link to="/register">{heroCTA}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
