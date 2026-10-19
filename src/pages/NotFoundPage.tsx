import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { GUIDES } from "@/content/guides";
import { useLang } from "@/lib/useLang";

export default function NotFoundPage() {
  const { t } = useTranslation();
  const { lang, lp } = useLang();

  return (
    <>
      <SEO title={t("notFound.title")} description={t("notFound.text")} noIndex />
      <section className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-6xl font-bold text-primary/30">404</p>
        <h1 className="mt-4 text-3xl font-bold">{t("notFound.title")}</h1>
        <p className="mt-3 text-muted">{t("notFound.text")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gradient">
            <Link to={lp("/")}>{t("notFound.home")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/register">{t("hero.cta")}</Link>
          </Button>
        </div>
        <h2 className="mt-12 text-lg font-semibold">{t("notFound.popular")}</h2>
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {GUIDES.slice(0, 4).map((guide) => (
            <li key={guide.slug}>
              <Link to={lp(`/${guide.slug}`)} className="inline-block rounded-full border border-border px-3 py-1 text-sm hover:border-primary">
                {guide[lang].label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
