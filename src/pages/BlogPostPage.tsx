import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import api from "@/lib/api";
import type { BlogPost } from "@/types";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const { data } = await api.get(`/blogs/${slug}`);
      return data.data as BlogPost;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="container py-16">Loading...</div>;
  if (!post) return <div className="container py-16">Post not found</div>;

  return (
    <>
      <SEO
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        type="article"
        url={`/blog/${post.slug}`}
        publishedTime={post.publishedAt}
        modifiedTime={post.publishedAt}
        image={post.coverImage || "/og-image.svg"}
      />
      <article className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/blog" className="flex items-center gap-2 text-sm text-muted hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="mb-8 h-64 w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="mb-8 flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 text-4xl font-bold text-primary/30 dark:from-blue-900/30 dark:to-violet-900/30">
              {post.title[0]}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
          <p className="text-muted mb-8">{post.excerpt}</p>
          <div
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
        </div>
      </article>
    </>
  );
}
