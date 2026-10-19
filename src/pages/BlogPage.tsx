import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { GUIDES } from "@/content/guides";
import api from "@/lib/api";
import { breadcrumbLd } from "@/lib/jsonld";
import { useLang } from "@/lib/useLang";
import type { BlogPost } from "@/types";

export default function BlogPage() {
  const { t } = useTranslation();
  const { lang, lp } = useLang();

  const { data, isLoading } = useQuery({
    queryKey: ["blogs", lang],
    queryFn: async () => {
      const { data } = await api.get("/blogs", { params: { language: lang } });
      return data.data as { blogs: BlogPost[] };
    },
  });

  return (
    <>
      <SEO
        title={t("guides.hubSeoTitle")}
        description={t("guides.hubSeoDescription")}
        jsonLd={breadcrumbLd([
          { name: t("nav.home"), path: lp("/") },
          { name: t("nav.guides"), path: lp("/blog") },
        ])}
      />
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className="text-3xl font-bold md:text-4xl">{t("guides.hubTitle")}</h1>
          <p className="mt-3 max-w-2xl text-muted">{t("guides.hubIntro")}</p>

          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link
                  to={lp(`/${guide.slug}`)}
                  className="flex h-full flex-col rounded-2xl border border-border p-5 transition-colors hover:border-primary"
                >
                  <h2 className="text-lg font-semibold">{guide[lang].h1}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{guide[lang].description}</p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary">
                    {guide[lang].label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mt-14 text-2xl font-semibold">{t("guides.latestPosts")}</h2>
          {isLoading ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : data?.blogs?.length ? (
            <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {data.blogs.map((post) => (
                <li key={post._id}>
                  <Link to={lp(`/blog/${post.slug}`)} className="flex h-full flex-col overflow-hidden rounded-2xl border border-border transition-shadow hover:shadow-md">
                    {post.coverImage && (
                      <img src={post.coverImage} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" width="640" height="360" />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>
                      {post.publishedAt && (
                        <time dateTime={post.publishedAt} className="mt-auto pt-4 text-xs text-muted">
                          {new Date(post.publishedAt).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium" })}
                        </time>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-muted">{t("guides.noPosts")}</p>
          )}
        </div>
      </section>
    </>
  );
}
