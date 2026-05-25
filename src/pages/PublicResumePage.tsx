import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ResumePreview } from "@/components/resume/ResumePreview";
import api from "@/lib/api";
import type { ResumeContent } from "@/types";

export default function PublicResumePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-resume", slug],
    queryFn: async () => {
      const { data } = await api.get(`/resumes/public/${slug}`);
      return data.data as { title: string; content: ResumeContent; templateId: string; theme?: Record<string, string> };
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !data) return <div className="min-h-screen flex items-center justify-center">Resume not found</div>;

  return (
    <div className="min-h-screen bg-secondary/30 py-8 px-4">
      <div className="max-w-[800px] mx-auto">
        <p className="text-center text-sm text-muted mb-4">
          {data.title} — Powered by <span className="font-semibold gradient-text">ChakriCV</span>
        </p>
        <ResumePreview content={data.content} templateId={data.templateId} theme={data.theme} />
      </div>
    </div>
  );
}
