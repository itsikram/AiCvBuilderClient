import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { PrintableResume } from "@/components/resume/PrintableResume";
import { downloadResumePdf } from "@/lib/resume/pdf";
import type { CvLang } from "@/lib/resume/model";
import api from "@/lib/api";
import type { ResumeContent } from "@/types";

interface PublicResume {
  title: string;
  content: ResumeContent;
  templateId: string;
  theme?: Record<string, string>;
  sectionOrder?: string[];
  language?: CvLang;
  watermark?: boolean;
}

export default function PublicResumePage() {
  const { slug } = useParams<{ slug: string }>();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-resume", slug],
    queryFn: async () => {
      const { data } = await api.get(`/resumes/public/${slug}`);
      return data.data as PublicResume;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (error || !data) return <div className="flex min-h-screen items-center justify-center">Resume not found</div>;

  const description = data.content.personalInfo.summary || `${data.title} — a public resume created with AI CV Builder BD.`;
  // The same props as the owner's editor preview, so this page and its PDF match it
  const cv = {
    content: data.content,
    templateId: data.templateId,
    theme: data.theme,
    sectionOrder: data.sectionOrder,
    language: data.language,
    watermark: data.watermark,
  };

  const download = async () => {
    setBusy(true);
    try {
      await downloadResumePdf(data.title);
    } catch (err) {
      console.error("PDF download failed", err);
      toast.add("The PDF could not be made. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Shared CVs contain personal contact details, so keep them out of search results */}
      <SEO title={data.title} description={description} noIndex />
      <div className="min-h-screen bg-secondary/30 px-3 py-6 sm:px-4 sm:py-8">
        <div className="mx-auto max-w-[800px]">
          <div className="mb-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-center text-sm text-muted sm:text-left">
              {data.title} — Powered by <span className="gradient-text font-semibold">AI CV Builder BD</span>
            </p>
            <Button variant="gradient" size="sm" onClick={() => void download()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Preparing PDF…" : "Download PDF"}
            </Button>
          </div>
          <ResumePreview {...cv} />
          <PrintableResume {...cv} />
        </div>
      </div>
    </>
  );
}
