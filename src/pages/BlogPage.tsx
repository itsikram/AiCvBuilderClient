import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/types";

export default function BlogPage() {
  const { data } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => {
      const { data } = await api.get("/blogs");
      return data.data as { blogs: BlogPost[] };
    },
  });

  return (
    <>
      <SEO title="Blog" description="Resume tips and career advice for Bangladesh job seekers" />
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Career Blog</h1>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data?.blogs?.map((post) => (
              <Card key={post._id} className="h-full overflow-hidden transition-shadow hover:shadow-md">
                <Link to={`/blog/${post.slug}`} className="flex h-full flex-col">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-bold text-primary/30">
                        {post.title[0]}
                      </div>
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col pt-6">
                    <h2 className="text-xl font-semibold transition-colors hover:text-primary">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-muted">{post.excerpt}</p>
                    <p className="mt-auto pt-4 text-xs text-muted">
                      {post.publishedAt && formatDate(post.publishedAt)} · {post.viewCount} views
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
          {!data?.blogs?.length && (
            <p className="text-muted text-center py-12">No blog posts yet. Check back soon!</p>
          )}
        </div>
      </section>
    </>
  );
}
