import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { articleLd, breadcrumbLd } from "@/lib/jsonld";
import { useLang } from "@/lib/useLang";
import type { BlogPost } from "@/types";
import NotFoundPage from "./NotFoundPage";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { lang, lp } = useLang();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const { data } = await api.get(`/blogs/${slug}`);
      return data.data as BlogPost;
    },
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-14">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }
  if (isError || !post) return <NotFoundPage />;

  const path = lp(`/blog/${post.slug}`);
  const published = post.publishedAt || post.createdAt;
  const modified = post.updatedAt || published;

  return (
    <>
      <SEO
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        type="article"
        alternates={false}
        canonicalPath={post.language === "bn" ? `/bn/blog/${post.slug}` : `/blog/${post.slug}`}
        publishedTime={published}
        modifiedTime={modified}
        image={post.coverImage}
        jsonLd={[
          articleLd({
            headline: post.title,
            description: post.metaDescription || post.excerpt,
            path,
            lang,
            datePublished: published ?? "",
            dateModified: modified ?? "",
            image: post.coverImage,
          }),
          breadcrumbLd([
            { name: t("nav.home"), path: lp("/") },
            { name: t("nav.guides"), path: lp("/blog") },
            { name: post.title, path },
          ]),
        ]}
      />
      <article className="py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <Link to={lp("/blog")} className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("nav.guides")}
          </Link>
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">{post.title}</h1>
          {published && (
            <time dateTime={published} className="text-sm text-muted">
              {new Date(published).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { dateStyle: "long" })}
            </time>
          )}
          {post.coverImage && (
            <img src={post.coverImage} alt="" className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover" width="1200" height="675" />
          )}
          <p className="mt-6 text-lg text-muted">{post.excerpt}</p>
          <div className="blog-content mt-8" dangerouslySetInnerHTML={{ __html: post.content || "" }} />
        </div>
      </article>
    </>
  );
}
