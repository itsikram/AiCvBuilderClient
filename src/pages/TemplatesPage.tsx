import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Template } from "@/types";
import { useEffect, useState } from "react";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data } = await api.get("/templates");
      return data.data as Template[];
    },
  });

  const isFreeUser = Boolean(user && user.subscription?.plan === "free");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/me");
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleUseTemplate = (templateSlug: string) => {
    if (isAuthenticated) {
      navigate(`/dashboard/resumes/new?template=${templateSlug}`);
    } else {
      navigate("/register");
    }
  };

  return (
    <>
      <SEO title="Resume Templates" description="ATS-friendly resume templates for Bangladesh" />
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-4">Resume Templates</h1>
          <p className="text-muted text-center mb-4 max-w-xl mx-auto">
            Professional templates optimized for Bangladeshi and international job markets
          </p>

          {isFreeUser && (
            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-blue-50 to-violet-50 px-5 py-4 dark:from-blue-950/30 dark:to-violet-950/30">
              <div>
                <p className="font-semibold">Unlock premium template designs</p>
                <p className="text-sm text-muted">Upgrade to Premium to access exclusive layouts and advanced features.</p>
              </div>
              <Button variant="gradient" onClick={() => navigate("/dashboard/billing")}>
                Upgrade to Premium
              </Button>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates?.map((template) => {
              const imageSrc = (template.thumbnail || "/templates/fallback.svg").replace(/\.png$/i, ".svg");

              return (
                <Card key={template._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-40 overflow-hidden bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30">
                    <img
                      src={imageSrc}
                      alt={template.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = "/templates/fallback.svg";
                      }}
                    />
                  </div>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      {template.isPremium && <Badge variant="premium">Premium</Badge>}
                    </div>
                    <p className="text-sm text-muted mb-4">{template.description}</p>
                    <Badge variant="outline" className="mb-4 capitalize">{template.category}</Badge>
                    {template.locked ? (
                      <Button variant="outline" className="w-full" disabled>
                        <Lock className="h-4 w-4" />
                        Premium Only
                      </Button>
                    ) : (
                      <Button variant="gradient" className="w-full" onClick={() => handleUseTemplate(template.slug)}>
                        Use Template
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
