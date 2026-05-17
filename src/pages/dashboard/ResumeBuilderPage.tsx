import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Save, Download, Sparkles, Share2, ChevronUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Resume, ResumeContent, Experience } from "@/types";

const defaultContent = (): ResumeContent => ({
  personalInfo: { fullName: "", email: "", phone: "", location: "Dhaka, Bangladesh", summary: "" },
  experience: [],
  education: [],
  projects: [],
  skills: [],
  languages: ["Bangla", "English"],
  certifications: [],
  customSections: [],
});

export default function ResumeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [title, setTitle] = useState("My Resume");
  const [content, setContent] = useState<ResumeContent>(defaultContent());
  const [sectionOrder, setSectionOrder] = useState(["summary", "experience", "education", "skills", "projects"]);
  const [aiModal, setAiModal] = useState(false);
  const [aiForm, setAiForm] = useState({
    name: "",
    jobTitle: "",
    skills: "",
    experience: "",
    education: "",
    projects: "",
  });

  const { data: resume, isLoading } = useQuery({
    queryKey: ["resume", id],
    queryFn: async () => {
      const { data } = await api.get(`/resumes/${id}`);
      return data.data as Resume;
    },
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (resume) {
      setTitle(resume.title);
      setContent(resume.content);
      setSectionOrder(resume.sectionOrder);
    }
  }, [resume]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        const { data } = await api.post("/resumes", { title });
        await api.patch(`/resumes/${data.data._id}`, { content, sectionOrder });
        return data.data._id as string;
      }
      await api.patch(`/resumes/${id}`, { title, content, sectionOrder });
      return id!;
    },
    onSuccess: (resumeId) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.add("Resume saved!", "success");
      if (isNew) navigate(`/dashboard/resumes/${resumeId}`, { replace: true });
    },
    onError: () => toast.add("Failed to save", "error"),
  });

  const generateAI = async () => {
    try {
      const { data } = await api.post("/resumes/ai/generate", {
        ...aiForm,
        resumeId: isNew ? undefined : id,
        language: "en",
      });
      const result = data.data;
      setContent((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: aiForm.name,
          summary: result.summary,
        },
        skills: result.skills,
      }));
      setAiModal(false);
      toast.add("AI content generated!", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "AI generation failed", "error");
    }
  };

  const exportPDF = async () => {
    try {
      const res = await api.get(`/resumes/${id}/export-pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.pdf`;
      a.click();
      toast.add("PDF downloaded!", "success");
    } catch {
      toast.add("Export failed", "error");
    }
  };

  const toggleShare = async () => {
    const { data } = await api.post(`/resumes/${id}/toggle-public`);
    toast.add(data.data.isPublic ? "Resume is now public" : "Resume is private", "success");
  };

  const updatePersonal = (field: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const addExperience = () => {
    const exp: Experience = {
      id: crypto.randomUUID(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [""],
    };
    setContent((prev) => ({ ...prev, experience: [...prev.experience, exp] }));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...sectionOrder];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setSectionOrder(newOrder);
  };

  if (!isNew && isLoading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-xs font-semibold text-lg border-none shadow-none focus-visible:ring-0"
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAiModal(true)}>
            <Sparkles className="h-4 w-4" />
            {t("resume.generateAI")}
          </Button>
          <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" />
            {t("resume.save")}
          </Button>
          {!isNew && (
            <>
              <Button variant="outline" onClick={exportPDF}>
                <Download className="h-4 w-4" />
                {t("resume.export")}
              </Button>
              <Button variant="outline" onClick={toggleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("resume.personalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {(["fullName", "email", "phone", "location", "linkedin", "summary"] as const).map((field) => (
                <div key={field}>
                  <label className="text-xs font-medium capitalize">{field}</label>
                  {field === "summary" ? (
                    <textarea
                      className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
                      value={content.personalInfo[field] || ""}
                      onChange={(e) => updatePersonal(field, e.target.value)}
                    />
                  ) : (
                    <Input
                      className="mt-1"
                      value={content.personalInfo[field] || ""}
                      onChange={(e) => updatePersonal(field, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("resume.experience")}</CardTitle>
              <Button size="sm" variant="outline" onClick={addExperience}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.experience.map((exp, idx) => (
                <div key={exp.id} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Position" value={exp.position} onChange={(e) => {
                      const exps = [...content.experience];
                      exps[idx] = { ...exp, position: e.target.value };
                      setContent({ ...content, experience: exps });
                    }} />
                    <Input placeholder="Company" value={exp.company} onChange={(e) => {
                      const exps = [...content.experience];
                      exps[idx] = { ...exp, company: e.target.value };
                      setContent({ ...content, experience: exps });
                    }} />
                  </div>
                  <Input placeholder="Bullet point" value={exp.bullets[0] || ""} onChange={(e) => {
                    const exps = [...content.experience];
                    exps[idx] = { ...exp, bullets: [e.target.value] };
                    setContent({ ...content, experience: exps });
                  }} />
                  <Button size="sm" variant="ghost" onClick={() => {
                    setContent({ ...content, experience: content.experience.filter((_, i) => i !== idx) });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Section Order (drag via arrows)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sectionOrder.map((section, i) => (
                <div key={section} className="flex items-center justify-between p-2 border border-border rounded">
                  <span className="capitalize text-sm">{section}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveSection(i, "up")}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveSection(i, "down")}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("resume.skills")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="React, Node.js, MongoDB (comma separated)"
                value={content.skills.join(", ")}
                onChange={(e) =>
                  setContent({
                    ...content,
                    skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4">
          <p className="text-sm font-medium mb-2">{t("resume.preview")}</p>
          <ResumePreview content={content} className="w-full" />
        </div>
      </div>

      {aiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>AI Resume Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(aiForm).map(([key, val]) => (
                <div key={key}>
                  <label className="text-xs font-medium capitalize">{key}</label>
                  <Input
                    value={val}
                    onChange={(e) => setAiForm({ ...aiForm, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="gradient" onClick={generateAI}>Generate</Button>
                <Button variant="outline" onClick={() => setAiModal(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
