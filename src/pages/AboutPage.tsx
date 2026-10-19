import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Target, Lightbulb, Award, Heart, Globe, Shield } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { usePageContent } from "@/context/PageContentContext";
import { useLang } from "@/lib/useLang";
import { breadcrumbLd, organizationLd } from "@/lib/jsonld";

const featureIcons = [Target, Lightbulb, Award, Heart, Globe, Shield];

export default function AboutPage() {
  const { t } = useTranslation();
  const { lp } = useLang();
  const { getPageContent } = usePageContent();
  const aboutContent = getPageContent("about");

  // Admin CMS overrides, with translated defaults
  const title = (aboutContent?.title as string) || t("about.title");
  const subtitle = (aboutContent?.subtitle as string) || t("about.subtitle");
  const missionTitle = (aboutContent?.missionTitle as string) || t("about.missionTitle");
  const missionDescription = (aboutContent?.missionDescription as string) || t("about.missionText");
  const visionTitle = (aboutContent?.visionTitle as string) || t("about.visionTitle");
  const visionDescription = (aboutContent?.visionDescription as string) || t("about.visionText");
  const teamTitle = (aboutContent?.teamTitle as string) || t("about.whyTitle");
  const storyContent = (aboutContent?.storyContent as string) || t("about.story");
  const features = t("about.features", { returnObjects: true }) as Array<{ title: string; text: string }>;

  return (
    <>
      <SEO
        title={t("about.seoTitle")}
        description={t("about.seoDescription")}
        jsonLd={[organizationLd(), breadcrumbLd([{ name: t("nav.home"), path: lp("/") }, { name: t("nav.about"), path: lp("/about") }])]}
      />

      <section className="bg-gradient-to-b from-primary/5 to-transparent py-14 md:py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">{subtitle}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
          {[
            { Icon: Target, heading: missionTitle, text: missionDescription },
            { Icon: Lightbulb, heading: visionTitle, text: visionDescription },
          ].map(({ Icon, heading, text }) => (
            <div key={heading} className="rounded-2xl border border-border p-6">
              <div className="mb-3 flex items-center gap-3">
                <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                <h2 className="text-2xl font-bold">{heading}</h2>
              </div>
              <p className="leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/30 py-12">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">{t("about.storyTitle")}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">{storyContent}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">{teamTitle}</h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = featureIcons[index] ?? Target;
              return (
                <li key={feature.title} className="flex items-start gap-4 rounded-2xl border border-border p-6">
                  <span className="rounded-lg bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-1 text-sm text-muted">{feature.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-violet-600 py-14 text-white">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">{t("about.ctaTitle")}</h2>
          <p className="mt-3 text-white/90">{t("about.ctaText")}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-white/90">
              <Link to="/register">{t("hero.cta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link to={lp("/pricing")}>{t("nav.pricing")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
