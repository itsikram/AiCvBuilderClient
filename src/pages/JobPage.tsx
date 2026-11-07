import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CalendarClock, ExternalLink, FileText, ImageUp } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { AdSlot } from "@/components/AdSlot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { breadcrumbLd } from "@/lib/jsonld";
import { useLang } from "@/lib/useLang";
import { localNumber } from "@/lib/trial";
import type { JobCircular } from "@/types";
import NotFoundPage from "./NotFoundPage";
import { formatDeadline, jobPath } from "@/lib/jobs";

/**
 * Google JobPosting data. Only sent for an open circular with a deadline, as Google asks;
 * the organisation is the employer and the description is our summary of the circular.
 */
const jobPostingLd = (job: JobCircular) => ({
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: job.title,
  description: job.summary.split(/\n{2,}/).map((p) => `<p>${p.replace(/[<>&]/g, "")}</p>`).join(""),
  datePosted: job.publishedAt ?? job.createdAt,
  validThrough: job.deadline,
  hiringOrganization: { "@type": "Organization", name: job.organization, ...(job.sourceUrl && { sameAs: job.sourceUrl }) },
  jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "BD", ...(job.location && { addressLocality: job.location }) } },
  ...(job.vacancies ? { totalJobOpenings: job.vacancies } : {}),
  ...(job.education ? { educationRequirements: job.education } : {}),
  directApply: false,
  url: absoluteUrl(jobPath(job)),
});

export default function JobPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { lang, lp } = useLang();

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ["job", slug],
    queryFn: async () => (await api.get(`/jobs/${slug}`)).data.data as JobCircular,
    enabled: Boolean(slug),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-14">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (isError || !job) return <NotFoundPage />;

  const path = jobPath(job);
  const facts: Array<[string, string | null | undefined]> = [
    [t("jobs.organization"), job.organization],
    [t("jobs.vacanciesLabel"), job.vacancies ? localNumber(job.vacancies, lang) : null],
    [t("jobs.education"), job.education],
    [t("jobs.salary"), job.salary],
    [t("jobs.location"), job.location],
    [t("jobs.applyStart"), job.applyStart ? formatDeadline(job.applyStart, lang) : null],
    [t("jobs.deadlineLabel"), job.deadline ? formatDeadline(job.deadline, lang) : null],
  ];
  const share = `${job.title}: ${absoluteUrl(path)}`;

  return (
    <>
      <SEO
        title={job.title}
        description={`${job.organization}: ${job.summary.replace(/\s+/g, " ").slice(0, 140)}`}
        type="article"
        alternates={false}
        canonicalPath={path}
        publishedTime={job.publishedAt ?? undefined}
        modifiedTime={job.updatedAt}
        jsonLd={[
          breadcrumbLd([
            { name: t("nav.home"), path: lp("/") },
            { name: t("jobs.h1"), path: lp("/jobs") },
            { name: job.title, path },
          ]),
          ...(job.isOpen && job.deadline ? [jobPostingLd(job)] : []),
        ]}
      />
      <article className="py-10 md:py-14" lang={job.language}>
        <div className="container mx-auto max-w-3xl px-4">
          <Link to={lp("/jobs")} className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("jobs.h1")}
          </Link>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{t(`jobs.categories.${job.category}`)}</Badge>
            {job.isOpen ? <Badge variant="success">{t("jobs.open")}</Badge> : <Badge variant="outline">{t("jobs.closed")}</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{job.title}</h1>

          <dl className="mt-6 grid gap-x-6 gap-y-2 rounded-2xl border border-border p-5 sm:grid-cols-[auto_1fr]">
            {facts
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
          </dl>

          <div className="mt-6 space-y-4 leading-relaxed">
            {job.summary.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {job.applyUrl && job.isOpen && (
              <Button variant="gradient" asChild>
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                  {t("jobs.apply")}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </Button>
            )}
            {job.sourceUrl && (
              <Button variant="outline" asChild>
                <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {t("jobs.source")}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">{t("jobs.disclaimer")}</p>

          {job.photoSpec && (
            <Link to={lp("/photo-signature-resizer")} className="mt-8 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 hover:border-primary">
              <ImageUp className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block font-semibold">{job.photoSpec}</span>
                <span className="text-sm text-muted">{t("jobs.resizerText")}</span>
              </span>
            </Link>
          )}

          <div className="mt-6 rounded-2xl border border-border p-5">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-semibold">{t("jobs.cvTitle")}</p>
                <p className="text-sm text-muted">{t("jobs.cvText")}</p>
                <Button variant="gradient" size="sm" className="mt-3" asChild>
                  <Link to="/register">{t("landing.heroCta")}</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">{t("jobs.share")}</span>
            <Button variant="outline" size="sm" asChild>
              <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absoluteUrl(path))}`} target="_blank" rel="noopener noreferrer">Facebook</a>
            </Button>
          </div>

          {job.deadline && (
            <p className="mt-6 flex items-center gap-1 text-sm text-muted">
              <CalendarClock className="h-4 w-4" aria-hidden />
              {t("jobs.deadline", { date: formatDeadline(job.deadline, lang) })} · {SITE_NAME}
            </p>
          )}
          <AdSlot className="mt-10" />
        </div>
      </article>
    </>
  );
}
