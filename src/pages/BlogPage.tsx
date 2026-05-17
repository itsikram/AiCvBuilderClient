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
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Career Blog</h1>
          <div className="space-y-6">
            {data?.blogs?.map((post) => (
              <Card key={post._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <Link to={`/blog/${post.slug}`}>
                    <h2 className="text-xl font-semibold hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-muted mt-2">{post.excerpt}</p>
                    <p className="text-xs text-muted mt-3">
                      {post.publishedAt && formatDate(post.publishedAt)} · {post.viewCount} views
                    </p>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {!data?.blogs?.length && (
              <p className="text-muted text-center py-12">No blog posts yet. Check back soon!</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
