import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CalendarClock, ImageUp } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { breadcrumbLd } from "@/lib/jsonld";
import { useLang } from "@/lib/useLang";
import { localNumber } from "@/lib/trial";
import type { JobCircular } from "@/types";
import { formatDeadline, JOB_CATEGORIES, jobPath } from "@/lib/jobs";

/** Job circulars from Admin -> Job circulars, newest first, with category and open-only filters. */
export default function JobsPage() {
  const { t } = useTranslation();
  const { lang, lp } = useLang();
  const [category, setCategory] = useState<JobCircular["category"] | "">("");
  const [openOnly, setOpenOnly] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => (await api.get("/jobs?limit=100")).data.data as { jobs: JobCircular[]; total: number },
  });
  const jobs = (data?.jobs ?? []).filter((job) => (!category || job.category === category) && (!openOnly || job.isOpen));

  return (
    <>
      <SEO
        title={t("jobs.seoTitle")}
        description={t("jobs.seoDescription")}
        jsonLd={breadcrumbLd([
          { name: t("nav.home"), path: lp("/") },
          { name: t("jobs.h1"), path: lp("/jobs") },
        ])}
      />
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <h1 className="text-3xl font-bold md:text-4xl">{t("jobs.h1")}</h1>
          <p className="mt-3 max-w-3xl text-muted">{t("jobs.intro")}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label={t("jobs.filter")}>
            <Button size="sm" variant={category === "" ? "default" : "outline"} onClick={() => setCategory("")}>
              {t("jobs.all")}
            </Button>
            {JOB_CATEGORIES.map((value) => (
              <Button key={value} size="sm" variant={category === value ? "default" : "outline"} onClick={() => setCategory(value)}>
                {t(`jobs.categories.${value}`)}
              </Button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm">
              <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="h-4 w-4 accent-primary" />
              {t("jobs.openOnly")}
            </label>
          </div>

          {isLoading ? (
            <div className="mt-6 space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            </div>
          ) : !jobs.length ? (
            <p className="mt-10 text-center text-muted">{t("jobs.empty")}</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {jobs.map((job) => (
                <li key={job._id}>
                  <Link to={jobPath(job)} lang={job.language} className="block rounded-2xl border border-border p-5 transition-colors hover:border-primary">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{t(`jobs.categories.${job.category}`)}</Badge>
                      {!job.isOpen && <Badge variant="outline">{t("jobs.closed")}</Badge>}
                      {job.vacancies ? <span className="text-xs text-muted">{t("jobs.vacancies", { n: localNumber(job.vacancies, lang) })}</span> : null}
                    </div>
                    <h2 className="mt-2 text-lg font-semibold">{job.title}</h2>
                    <p className="text-sm text-muted">{job.organization}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{job.summary}</p>
                    {job.deadline && (
                      <p className="mt-2 flex items-center gap-1 text-sm font-medium">
                        <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
                        {t("jobs.deadline", { date: formatDeadline(job.deadline, lang) })}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Link to={lp("/photo-signature-resizer")} className="flex items-start gap-3 rounded-2xl border border-border p-5 hover:border-primary">
              <ImageUp className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block font-semibold">{t("jobs.resizerTitle")}</span>
                <span className="text-sm text-muted">{t("jobs.resizerText")}</span>
              </span>
            </Link>
            <Link to={lp("/government-job-cv")} className="flex items-start gap-3 rounded-2xl border border-border p-5 hover:border-primary">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block font-semibold">{t("jobs.cvGuideTitle")}</span>
                <span className="text-sm text-muted">{t("jobs.cvGuideText")}</span>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
