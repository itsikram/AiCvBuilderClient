import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/seo/SEO";
import { LEGAL, LEGAL_SLUGS, LEGAL_UPDATED, type LegalSlug } from "@/content/legal";
import { breadcrumbLd } from "@/lib/jsonld";
import { useLang } from "@/lib/useLang";

/** Privacy policy, terms of service or refund policy, in the page's language. */
export default function LegalPage({ slug }: { slug: LegalSlug }) {
  const { t } = useTranslation();
  const { lang, lp } = useLang();
  const doc = LEGAL[slug][lang];
  const updated = new Date(`${LEGAL_UPDATED}T00:00:00+06:00`).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { dateStyle: "long", timeZone: "Asia/Dhaka" });

  return (
    <>
      <SEO
        title={doc.title}
        description={doc.description}
        modifiedTime={LEGAL_UPDATED}
        jsonLd={breadcrumbLd([
          { name: t("nav.home"), path: lp("/") },
          { name: doc.h1, path: lp(`/${slug}`) },
        ])}
      />
      <article className="py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="text-3xl font-bold md:text-4xl">{doc.h1}</h1>
          <p className="mt-2 text-sm text-muted">{t("legal.updated", { date: updated })}</p>
          <p className="mt-6 text-lg leading-relaxed">{doc.intro}</p>
          {doc.sections.map((section) => (
            <section key={section.heading} className="mt-8">
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              {section.paragraphs?.map((text) => (
                <p key={text} className="mt-3 leading-relaxed text-muted">
                  {text}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                  {section.bullets.map((text) => (
                    <li key={text} className="leading-relaxed">
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <nav aria-label={t("legal.related")} className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
            {LEGAL_SLUGS.filter((other) => other !== slug).map((other) => (
              <Link key={other} to={lp(`/${other}`)} className="text-primary hover:underline">
                {LEGAL[other][lang].h1}
              </Link>
            ))}
            <Link to={lp("/contact")} className="text-primary hover:underline">
              {t("nav.contact")}
            </Link>
          </nav>
        </div>
      </article>
    </>
  );
}
