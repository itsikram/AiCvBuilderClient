import { use } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { getGuide, getLoadedGuideBody, loadGuideBody } from "@/content/guides";
import { useLang } from "@/lib/useLang";
import { breadcrumbLd, faqLd, howToLd, articleLd } from "@/lib/jsonld";

export default function GuidePage({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const { lang, lp } = useLang();
  const guide = getGuide(slug);
  // Suspends until this guide's body chunk has loaded (prerendering waits for it too)
  const body = getLoadedGuideBody(slug) ?? use(loadGuideBody(slug));
  if (!guide) return null;

  const copy = { ...guide[lang], ...body[lang] };
  const path = lp(`/${guide.slug}`);
  const stepSection = copy.sections.find((section) => section.steps?.length);

  const jsonLd: object[] = [
    articleLd({
      headline: copy.h1,
      description: copy.description,
      path,
      lang,
      datePublished: guide.updated,
      dateModified: guide.updated,
    }),
    breadcrumbLd([
      { name: t("nav.home"), path: lp("/") },
      { name: t("nav.guides"), path: lp("/blog") },
      { name: copy.label, path },
    ]),
  ];
  if (copy.faqs.length) jsonLd.push(faqLd(copy.faqs));
  if (stepSection?.steps) {
    jsonLd.push(
      howToLd({ name: copy.h1, description: copy.lead, steps: stepSection.steps, lang })
    );
  }

  return (
    <>
      <SEO title={copy.title} description={copy.description} type="article" modifiedTime={guide.updated} jsonLd={jsonLd} />
      <article className="py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <nav aria-label={t("common.breadcrumb")} className="mb-6 text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link to={lp("/")} className="hover:text-primary">{t("nav.home")}</Link></li>
              <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
              <li><Link to={lp("/blog")} className="hover:text-primary">{t("nav.guides")}</Link></li>
              <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
              <li aria-current="page" className="text-foreground">{copy.label}</li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold leading-tight md:text-4xl">{copy.h1}</h1>
          <p className="mt-2 text-sm text-muted">
            {t("guides.updated")}{" "}
            <time dateTime={guide.updated}>
              {new Date(guide.updated).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </p>

          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("guides.quickAnswer")}</p>
            <p className="mt-2 leading-relaxed">{copy.lead}</p>
            <Button asChild variant="gradient" className="mt-4">
              <Link to={guide.ctaHref}>
                {copy.cta.button} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {copy.sections.map((section) => (
            <section key={section.heading} className="mt-10">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-3 leading-relaxed text-foreground/90">{paragraph}</p>
              ))}
              {section.steps && (
                <ol className="mt-4 space-y-4">
                  {section.steps.map((step, index) => (
                    <li key={step.name} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {(index + 1).toLocaleString(lang === "bn" ? "bn-BD" : "en")}
                      </span>
                      <div>
                        <h3 className="font-semibold">{step.name}</h3>
                        <p className="mt-1 leading-relaxed text-foreground/90">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              {section.bullets && (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 40)} className="flex gap-2 leading-relaxed">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.example && (
                <figure className="mt-4 overflow-x-auto rounded-xl border border-border bg-secondary/40 p-4">
                  <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{section.example.title}</figcaption>
                  <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{section.example.lines.join("\n")}</pre>
                </figure>
              )}
            </section>
          ))}

          {copy.faqs.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold">{t("guides.faq")}</h2>
              <div className="mt-4 divide-y divide-border rounded-xl border border-border">
                {copy.faqs.map((faq) => (
                  <details key={faq.q} className="group p-4">
                    <summary className="cursor-pointer list-none font-medium marker:hidden">
                      <span className="flex items-center justify-between gap-4">
                        {faq.q}
                        <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
                      </span>
                    </summary>
                    <p className="mt-2 leading-relaxed text-foreground/90">{faq.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <section className="mt-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-6 text-white md:p-8">
            <h2 className="text-2xl font-semibold">{copy.cta.title}</h2>
            <p className="mt-2 text-white/90">{copy.cta.text}</p>
            <Button asChild className="mt-5 bg-white text-blue-700 hover:bg-white/90">
              <Link to={guide.ctaHref}>{copy.cta.button}</Link>
            </Button>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-semibold">{t("guides.related")}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {guide.related.map((relatedSlug) => {
                const related = getGuide(relatedSlug);
                if (!related) return null;
                return (
                  <li key={relatedSlug}>
                    <Link
                      to={lp(`/${relatedSlug}`)}
                      className="block rounded-xl border border-border p-4 transition-colors hover:border-primary"
                    >
                      <span className="font-medium">{related[lang].h1}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link to={lp("/templates")} className="block rounded-xl border border-border p-4 transition-colors hover:border-primary">
                  <span className="font-medium">{t("guides.browseTemplates")}</span>
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </>
  );
}
