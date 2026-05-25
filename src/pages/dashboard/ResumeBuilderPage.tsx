import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Save, Download, Sparkles, Share2, ChevronUp, ChevronDown, Plus, Trash2, Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Resume, ResumeContent, Experience, Template } from "@/types";

type ResumeWithUploadMeta = Resume & {
  uploadedAt?: string;
  uploadedFileName?: string;
  uploadedFileUrl?: string;
};

type UploadTab = "new" | "previous";

const defaultSectionOrder = ["summary", "experience", "education", "skills", "projects"];
const fontOptions = [
  "Inter, ui-sans-serif, system-ui",
  "Georgia, serif",
  "Arial, sans-serif",
  "Poppins, sans-serif",
  "Times New Roman, serif",
];

const defaultContent = (): ResumeContent => ({
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "Dhaka, Bangladesh",
    summary: "",
    profilePhotoSize: "medium",
    profilePhotoAlignment: "center",
  },
  experience: [],
  education: [],
  projects: [],
  skills: [],
  languages: [
    { id: crypto.randomUUID(), name: "Bangla", proficiency: "native" },
    { id: crypto.randomUUID(), name: "English", proficiency: "fluent" },
  ],
  certifications: [],
  awards: [],
  publications: [],
  volunteerExperience: [],
  references: [],
  interests: [],
  courses: [],
  memberships: [],
  customSections: [],
});

export default function ResumeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";
  const [searchParams] = useSearchParams();
  const templateFromUrl = searchParams.get("template");

  const [title, setTitle] = useState("My Resume");
  const [content, setContent] = useState<ResumeContent>(defaultContent());
  const [sectionOrder, setSectionOrder] = useState(defaultSectionOrder);
  const [aiModal, setAiModal] = useState(false);
  const [tailorModal, setTailorModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(templateFromUrl || "modern-ats");
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [uploadTab, setUploadTab] = useState<UploadTab>("new");
  const [selectedPreviousUploadId, setSelectedPreviousUploadId] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("Choose a PDF or DOCX file to import your resume.");
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isTailoringResume, setIsTailoringResume] = useState(false);
  const [tailorJobDescription, setTailorJobDescription] = useState("");
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

  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data } = await api.get("/templates");
      return data.data as Template[];
    },
  });

  const { data: resumes = [] } = useQuery<ResumeWithUploadMeta[]>({
    queryKey: ["resumes"],
    queryFn: async () => {
      const { data } = await api.get("/resumes");
      return data.data as ResumeWithUploadMeta[];
    },
    enabled: uploadModal,
  });

  useEffect(() => {
    if (resume) {
      setTitle(resume.title);
      setContent(resume.content);
      setSectionOrder(resume.sectionOrder);
      setSelectedTemplate(resume.templateId || "modern-ats");
      setTheme((resume.theme as Record<string, string>) || {});
    }
  }, [resume]);

  useEffect(() => {
    if (!uploadModal) {
      setUploadTab("new");
      setSelectedPreviousUploadId("");
      setUploadProgress(0);
      setAnalysisProgress(0);
      setUploadStatus("Choose a PDF or DOCX file to import your resume.");
      setIsUploadingResume(false);
    }
  }, [uploadModal]);

  const saveMutation = useMutation({
    mutationFn: async (options?: { templateId?: string }) => {
      const templateId = options?.templateId || selectedTemplate || templateFromUrl || "modern-ats";
      const themePayload = theme && Object.keys(theme).length > 0 ? theme : {}; 

      if (isNew) {
        const { data } = await api.post("/resumes", { title, templateId });
        await api.patch(`/resumes/${data.data._id}`, { content, sectionOrder, theme: themePayload });
        return data.data._id as string;
      }

      await api.patch(`/resumes/${id}`, { title, content, sectionOrder, theme: themePayload });
      return id!;
    },
    onSuccess: (resumeId) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.add("Resume saved!", "success");
      if (isNew) {
        navigate(`/dashboard/resumes/${resumeId}`, { replace: true });
      }
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

  const tailorResumeForJob = async () => {
    if (isNew || !id) {
      toast.add("Save this resume first before tailoring it for a job description.", "error");
      return;
    }

    if (!tailorJobDescription.trim()) {
      toast.add("Please paste a job description to tailor your resume.", "error");
      return;
    }

    try {
      setIsTailoringResume(true);
      const { data } = await api.post("/resumes/ai/tailor", {
        resumeId: id,
        jobDescription: tailorJobDescription,
        language: "en",
      });

      const tailored = data.data as {
        summary?: string;
        skills?: string[];
        experienceBullets?: Array<{ bullets?: string[] }>;
      };

      setContent((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          summary: tailored.summary || prev.personalInfo.summary,
        },
        skills: tailored.skills?.length ? tailored.skills : prev.skills,
        experience: prev.experience.map((experience, index) => {
          const tailoredBullets = tailored.experienceBullets?.[index]?.bullets;
          if (tailoredBullets?.length) {
            return { ...experience, bullets: tailoredBullets };
          }
          return experience;
        }),
      }));

      queryClient.invalidateQueries({ queryKey: ["resume", id] });
      setTailorModal(false);
      setTailorJobDescription("");
      toast.add("Resume tailored for the job description!", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Resume tailoring failed", "error");
    } finally {
      setIsTailoringResume(false);
    }
  };

  const applyImportedResume = (
    nextTitle: string,
    nextContent: ResumeContent,
    nextSectionOrder?: string[],
    nextTemplateId?: string,
    nextTheme?: Record<string, string>
  ) => {
    setTitle(nextTitle || "My Resume");
    setContent(nextContent);
    setSectionOrder(nextSectionOrder && nextSectionOrder.length ? nextSectionOrder : defaultSectionOrder);
    if (nextTemplateId) {
      setSelectedTemplate(nextTemplateId);
    }
    setTheme(nextTheme || {});
  };

  const loadPreviousUpload = (resumeToLoad: ResumeWithUploadMeta) => {
    setUploadModal(false);
    if (!isNew && id !== resumeToLoad._id) {
      navigate(`/dashboard/resumes/${resumeToLoad._id}`, { replace: false });
      return;
    }

    applyImportedResume(
      resumeToLoad.title,
      resumeToLoad.content,
      resumeToLoad.sectionOrder,
      resumeToLoad.templateId,
      (resumeToLoad.theme as Record<string, string>) || {}
    );
    toast.add(`Loaded ${resumeToLoad.title}`, "success");
  };

  const handleResumeUpload = async (file: File) => {
    let analysisInterval: ReturnType<typeof setInterval> | undefined;

    try {
      setIsUploadingResume(true);
      setUploadProgress(5);
      setAnalysisProgress(0);
      setUploadStatus("Uploading your resume file...");

      const formData = new FormData();
      formData.append("file", file);
      if (!isNew && id) {
        formData.append("resumeId", id);
      }

      const { data } = await api.post("/resumes/upload-parse", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.max(5, Math.min(95, percent)));
          }
        },
      });

      setUploadProgress(100);
      setUploadStatus("AI is analyzing the uploaded resume...");
      setAnalysisProgress(10);

      analysisInterval = setInterval(() => {
        setAnalysisProgress((current) => {
          if (current >= 95) {
            return current;
          }
          return Math.min(95, current + 8);
        });
      }, 240);

      const parsedContent = data.data.content as ResumeContent;
      applyImportedResume(data.data.title || title, parsedContent);
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      if (isNew && data.data.resumeId) {
        navigate(`/dashboard/resumes/${data.data.resumeId}`, { replace: true });
      } else if (id) {
        queryClient.invalidateQueries({ queryKey: ["resume", id] });
      }

      setAnalysisProgress(100);
      setUploadStatus("Resume uploaded and parsed successfully.");
      toast.add("Resume uploaded and parsed!", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setUploadStatus(msg || "Upload failed. Please try again.");
      toast.add(msg || "Upload failed", "error");
    } finally {
      if (analysisInterval) {
        clearInterval(analysisInterval);
      }
      setIsUploadingResume(false);
      setUploadModal(false);
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

  const setThemeValue = (key: string, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const handleOwnerPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.add("Please choose an image file for your profile picture.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setContent((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, profilePhoto: result },
      }));
    };
    reader.readAsDataURL(file);
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

  const addEducation = () => {
    const edu = {
      id: crypto.randomUUID(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: "",
    };
    setContent((prev) => ({ ...prev, education: [...prev.education, edu] }));
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
          <Button variant="outline" onClick={() => setTemplateModal(true)}>
            <Upload className="h-4 w-4" />
            Change Template
          </Button>
          <Button variant="outline" onClick={() => setUploadModal(true)}>
            <Upload className="h-4 w-4" />
            Upload Resume
          </Button>
          <Button variant="outline" onClick={() => setAiModal(true)}>
            <Sparkles className="h-4 w-4" />
            {t("resume.generateAI")}
          </Button>
          <Button variant="outline" onClick={() => setTailorModal(true)}>
            <Sparkles className="h-4 w-4" />
            Tailor for job
          </Button>
          <Button variant="outline" onClick={() => saveMutation.mutate({})} disabled={saveMutation.isPending}>
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
              <div className="rounded-lg border border-dashed border-border p-4">
                <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                  <span className="text-sm font-medium">Upload owner picture</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, or WEBP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOwnerPhotoUpload}
                    className="sr-only"
                  />
                  <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs">Choose image</span>
                </label>
                {content.personalInfo.profilePhoto && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={content.personalInfo.profilePhoto}
                      alt="Owner preview"
                      className={`rounded-full object-cover border ${
                        content.personalInfo.profilePhotoSize === "large"
                          ? "h-32 w-32"
                          : content.personalInfo.profilePhotoSize === "small"
                            ? "h-16 w-16"
                            : "h-24 w-24"
                      }`}
                    />
                  </div>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium">Image size</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={content.personalInfo.profilePhotoSize || "medium"}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          personalInfo: {
                            ...content.personalInfo,
                            profilePhotoSize: e.target.value as "small" | "medium" | "large",
                          },
                        })
                      }
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Image alignment</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={content.personalInfo.profilePhotoAlignment || "center"}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          personalInfo: {
                            ...content.personalInfo,
                            profilePhotoAlignment: e.target.value as "left" | "center" | "right",
                          },
                        })
                      }
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
              {(["fullName", "email", "phone", "location", "linkedin", "portfolio", "github", "website", "summary"] as const).map((field) => (
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
            <CardHeader>
              <CardTitle className="text-base">Typography & Colors</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div>
                <label className="text-xs font-medium">Font family</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={theme.fontFamily || fontOptions[0]}
                  onChange={(e) => setThemeValue("fontFamily", e.target.value)}
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font.split(",")[0]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium">
                  Heading color
                  <input
                    type="color"
                    className="mt-1 h-10 w-full rounded border border-border bg-transparent"
                    value={theme.headingColor || "#0f172a"}
                    onChange={(e) => setThemeValue("headingColor", e.target.value)}
                  />
                </label>
                <label className="text-xs font-medium">
                  Body color
                  <input
                    type="color"
                    className="mt-1 h-10 w-full rounded border border-border bg-transparent"
                    value={theme.textColor || "#111827"}
                    onChange={(e) => setThemeValue("textColor", e.target.value)}
                  />
                </label>
                <label className="text-xs font-medium">
                  Accent color
                  <input
                    type="color"
                    className="mt-1 h-10 w-full rounded border border-border bg-transparent"
                    value={theme.accentColor || "#1d4ed8"}
                    onChange={(e) => setThemeValue("accentColor", e.target.value)}
                  />
                </label>
              </div>
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
                <div key={exp.id} className="p-3 border border-border rounded-lg space-y-3">
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
                  <div className="space-y-2">
                    {exp.bullets.map((bullet, bulletIdx) => (
                      <div key={`${exp.id}-${bulletIdx}`} className="flex gap-2">
                        <Input
                          placeholder={`Bullet ${bulletIdx + 1}`}
                          value={bullet}
                          onChange={(e) => {
                            const exps = [...content.experience];
                            const bullets = [...exp.bullets];
                            bullets[bulletIdx] = e.target.value;
                            exps[idx] = { ...exp, bullets };
                            setContent({ ...content, experience: exps });
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const exps = [...content.experience];
                            const bullets = exp.bullets.filter((_, currentIdx) => currentIdx !== bulletIdx);
                            exps[idx] = { ...exp, bullets: bullets.length ? bullets : [""] };
                            setContent({ ...content, experience: exps });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const exps = [...content.experience];
                        exps[idx] = { ...exp, bullets: [...exp.bullets, ""] };
                        setContent({ ...content, experience: exps });
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add bullet
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setContent({ ...content, experience: content.experience.filter((_, i) => i !== idx) });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Education</CardTitle>
              <Button size="sm" variant="outline" onClick={addEducation}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.education.map((edu, idx) => (
                <div key={edu.id} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => {
                        const education = [...content.education];
                        education[idx] = { ...edu, institution: e.target.value };
                        setContent({ ...content, education });
                      }}
                    />
                    <Input
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(e) => {
                        const education = [...content.education];
                        education[idx] = { ...edu, degree: e.target.value };
                        setContent({ ...content, education });
                      }}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Field of study"
                      value={edu.field || ""}
                      onChange={(e) => {
                        const education = [...content.education];
                        education[idx] = { ...edu, field: e.target.value };
                        setContent({ ...content, education });
                      }}
                    />
                    <Input
                      placeholder="GPA"
                      value={edu.gpa || ""}
                      onChange={(e) => {
                        const education = [...content.education];
                        education[idx] = { ...edu, gpa: e.target.value };
                        setContent({ ...content, education });
                      }}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      type="date"
                      value={edu.startDate}
                      onChange={(e) => {
                        const education = [...content.education];
                        education[idx] = { ...edu, startDate: e.target.value };
                        setContent({ ...content, education });
                      }}
                    />
                    <Input
                      type="date"
                      value={edu.endDate}
                      onChange={(e) => {
                        const education = [...content.education];
                        education[idx] = { ...edu, endDate: e.target.value };
                        setContent({ ...content, education });
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setContent({ ...content, education: content.education.filter((_, i) => i !== idx) });
                    }}
                  >
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Languages</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                setContent({
                  ...content,
                  languages: [...content.languages, { id: crypto.randomUUID(), name: "", proficiency: "intermediate" }],
                });
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.languages.map((lang, idx) => (
                <div key={lang.id} className="flex gap-2">
                  <Input
                    placeholder="Language"
                    value={lang.name}
                    onChange={(e) => {
                      const langs = [...content.languages];
                      langs[idx] = { ...langs[idx], name: e.target.value };
                      setContent({ ...content, languages: langs });
                    }}
                  />
                  <select
                    className="border rounded px-2 py-1"
                    value={lang.proficiency}
                    onChange={(e) => {
                      const langs = [...content.languages];
                      langs[idx] = { ...langs[idx], proficiency: e.target.value as any };
                      setContent({ ...content, languages: langs });
                    }}
                  >
                    <option value="native">Native</option>
                    <option value="fluent">Fluent</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="basic">Basic</option>
                  </select>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setContent({ ...content, languages: content.languages.filter((_, i) => i !== idx) });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Certifications</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                setContent({
                  ...content,
                  certifications: [...content.certifications, { id: crypto.randomUUID(), name: "", issuer: "", date: "", credentialId: "", credentialUrl: "" }],
                });
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.certifications.map((cert, idx) => (
                <div key={cert.id} className="p-3 border border-border rounded-lg space-y-2">
                  <Input placeholder="Certification Name" value={cert.name} onChange={(e) => {
                    const certs = [...content.certifications];
                    certs[idx] = { ...certs[idx], name: e.target.value };
                    setContent({ ...content, certifications: certs });
                  }} />
                  <Input placeholder="Issuer" value={cert.issuer} onChange={(e) => {
                    const certs = [...content.certifications];
                    certs[idx] = { ...certs[idx], issuer: e.target.value };
                    setContent({ ...content, certifications: certs });
                  }} />
                  <Input type="date" value={cert.date} onChange={(e) => {
                    const certs = [...content.certifications];
                    certs[idx] = { ...certs[idx], date: e.target.value };
                    setContent({ ...content, certifications: certs });
                  }} />
                  <Button size="sm" variant="ghost" onClick={() => {
                    setContent({ ...content, certifications: content.certifications.filter((_, i) => i !== idx) });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Awards</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                setContent({
                  ...content,
                  awards: [...content.awards, { id: crypto.randomUUID(), title: "", issuer: "", date: "", description: "" }],
                });
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.awards.map((award, idx) => (
                <div key={award.id} className="p-3 border border-border rounded-lg space-y-2">
                  <Input placeholder="Award Title" value={award.title} onChange={(e) => {
                    const awards = [...content.awards];
                    awards[idx] = { ...awards[idx], title: e.target.value };
                    setContent({ ...content, awards });
                  }} />
                  <Input placeholder="Issuer" value={award.issuer} onChange={(e) => {
                    const awards = [...content.awards];
                    awards[idx] = { ...awards[idx], issuer: e.target.value };
                    setContent({ ...content, awards });
                  }} />
                  <Input type="date" value={award.date} onChange={(e) => {
                    const awards = [...content.awards];
                    awards[idx] = { ...awards[idx], date: e.target.value };
                    setContent({ ...content, awards });
                  }} />
                  <Button size="sm" variant="ghost" onClick={() => {
                    setContent({ ...content, awards: content.awards.filter((_, i) => i !== idx) });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Publications</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                setContent({
                  ...content,
                  publications: [...content.publications, { id: crypto.randomUUID(), title: "", publisher: "", date: "", url: "", description: "" }],
                });
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.publications.map((pub, idx) => (
                <div key={pub.id} className="p-3 border border-border rounded-lg space-y-2">
                  <Input placeholder="Publication Title" value={pub.title} onChange={(e) => {
                    const pubs = [...content.publications];
                    pubs[idx] = { ...pubs[idx], title: e.target.value };
                    setContent({ ...content, publications: pubs });
                  }} />
                  <Input placeholder="Publisher" value={pub.publisher} onChange={(e) => {
                    const pubs = [...content.publications];
                    pubs[idx] = { ...pubs[idx], publisher: e.target.value };
                    setContent({ ...content, publications: pubs });
                  }} />
                  <Input type="date" value={pub.date} onChange={(e) => {
                    const pubs = [...content.publications];
                    pubs[idx] = { ...pubs[idx], date: e.target.value };
                    setContent({ ...content, publications: pubs });
                  }} />
                  <Button size="sm" variant="ghost" onClick={() => {
                    setContent({ ...content, publications: content.publications.filter((_, i) => i !== idx) });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Volunteer Experience</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                setContent({
                  ...content,
                  volunteerExperience: [...content.volunteerExperience, { id: crypto.randomUUID(), organization: "", role: "", startDate: "", endDate: "", current: false, description: "" }],
                });
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.volunteerExperience.map((vol, idx) => (
                <div key={vol.id} className="p-3 border border-border rounded-lg space-y-2">
                  <Input placeholder="Organization" value={vol.organization} onChange={(e) => {
                    const vols = [...content.volunteerExperience];
                    vols[idx] = { ...vols[idx], organization: e.target.value };
                    setContent({ ...content, volunteerExperience: vols });
                  }} />
                  <Input placeholder="Role" value={vol.role} onChange={(e) => {
                    const vols = [...content.volunteerExperience];
                    vols[idx] = { ...vols[idx], role: e.target.value };
                    setContent({ ...content, volunteerExperience: vols });
                  }} />
                  <div className="flex gap-2">
                    <Input type="date" value={vol.startDate} onChange={(e) => {
                      const vols = [...content.volunteerExperience];
                      vols[idx] = { ...vols[idx], startDate: e.target.value };
                      setContent({ ...content, volunteerExperience: vols });
                    }} />
                    <Input type="date" value={vol.endDate} onChange={(e) => {
                      const vols = [...content.volunteerExperience];
                      vols[idx] = { ...vols[idx], endDate: e.target.value };
                      setContent({ ...content, volunteerExperience: vols });
                    }} />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setContent({ ...content, volunteerExperience: content.volunteerExperience.filter((_, i) => i !== idx) });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">References</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                setContent({
                  ...content,
                  references: [...content.references, { id: crypto.randomUUID(), name: "", position: "", company: "", email: "", phone: "", relationship: "" }],
                });
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.references.map((ref, idx) => (
                <div key={ref.id} className="p-3 border border-border rounded-lg space-y-2">
                  <Input placeholder="Name" value={ref.name} onChange={(e) => {
                    const refs = [...content.references];
                    refs[idx] = { ...refs[idx], name: e.target.value };
                    setContent({ ...content, references: refs });
                  }} />
                  <Input placeholder="Position" value={ref.position} onChange={(e) => {
                    const refs = [...content.references];
                    refs[idx] = { ...refs[idx], position: e.target.value };
                    setContent({ ...content, references: refs });
                  }} />
                  <Input placeholder="Company" value={ref.company} onChange={(e) => {
                    const refs = [...content.references];
                    refs[idx] = { ...refs[idx], company: e.target.value };
                    setContent({ ...content, references: refs });
                  }} />
                  <Button size="sm" variant="ghost" onClick={() => {
                    setContent({ ...content, references: content.references.filter((_, i) => i !== idx) });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Reading, Hiking, Photography (comma separated)"
                value={content.interests.join(", ")}
                onChange={(e) =>
                  setContent({
                    ...content,
                    interests: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Courses</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                setContent({
                  ...content,
                  courses: [...content.courses, { id: crypto.randomUUID(), name: "", provider: "", date: "", certificateUrl: "" }],
                });
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.courses.map((course, idx) => (
                <div key={course.id} className="p-3 border border-border rounded-lg space-y-2">
                  <Input placeholder="Course Name" value={course.name} onChange={(e) => {
                    const courses = [...content.courses];
                    courses[idx] = { ...courses[idx], name: e.target.value };
                    setContent({ ...content, courses });
                  }} />
                  <Input placeholder="Provider" value={course.provider} onChange={(e) => {
                    const courses = [...content.courses];
                    courses[idx] = { ...courses[idx], provider: e.target.value };
                    setContent({ ...content, courses });
                  }} />
                  <Input type="date" value={course.date} onChange={(e) => {
                    const courses = [...content.courses];
                    courses[idx] = { ...courses[idx], date: e.target.value };
                    setContent({ ...content, courses });
                  }} />
                  <Button size="sm" variant="ghost" onClick={() => {
                    setContent({ ...content, courses: content.courses.filter((_, i) => i !== idx) });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Professional Memberships</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                setContent({
                  ...content,
                  memberships: [...content.memberships, { id: crypto.randomUUID(), organization: "", role: "", startDate: "", endDate: "", current: false }],
                });
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.memberships.map((mem, idx) => (
                <div key={mem.id} className="p-3 border border-border rounded-lg space-y-2">
                  <Input placeholder="Organization" value={mem.organization} onChange={(e) => {
                    const mems = [...content.memberships];
                    mems[idx] = { ...mems[idx], organization: e.target.value };
                    setContent({ ...content, memberships: mems });
                  }} />
                  <Input placeholder="Role" value={mem.role} onChange={(e) => {
                    const mems = [...content.memberships];
                    mems[idx] = { ...mems[idx], role: e.target.value };
                    setContent({ ...content, memberships: mems });
                  }} />
                  <div className="flex gap-2">
                    <Input type="date" value={mem.startDate} onChange={(e) => {
                      const mems = [...content.memberships];
                      mems[idx] = { ...mems[idx], startDate: e.target.value };
                      setContent({ ...content, memberships: mems });
                    }} />
                    <Input type="date" value={mem.endDate} onChange={(e) => {
                      const mems = [...content.memberships];
                      mems[idx] = { ...mems[idx], endDate: e.target.value };
                      setContent({ ...content, memberships: mems });
                    }} />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setContent({ ...content, memberships: content.memberships.filter((_, i) => i !== idx) });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4">
          <p className="text-sm font-medium mb-2">{t("resume.preview")}</p>
          <ResumePreview content={content} templateId={selectedTemplate} theme={theme} className="w-full" />
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

      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Upload Current Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex rounded-lg bg-secondary p-1">
                {(["new", "previous"] as UploadTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setUploadTab(tab)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                      uploadTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {tab === "new" ? "Upload new" : "Previous uploads"}
                  </button>
                ))}
              </div>

              {uploadTab === "new" ? (
                <div className="space-y-4">
                  <label className="block cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center transition hover:border-primary">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Upload your existing resume (PDF or DOCX)</p>
                    <span className="inline-flex rounded-md border border-border bg-secondary px-3 py-1 text-sm">Choose file</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      disabled={isUploadingResume}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleResumeUpload(file);
                      }}
                      className="sr-only"
                    />
                  </label>

                  <div className="rounded-lg border bg-secondary/30 p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{uploadStatus}</span>
                      <span className="text-muted-foreground">{isUploadingResume ? `${Math.max(uploadProgress, analysisProgress)}%` : "Idle"}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${isUploadingResume ? Math.max(uploadProgress, analysisProgress) : 0}%` }}
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">Uploading</p>
                        <p>{uploadProgress}% complete</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">AI analyzing</p>
                        <p>{analysisProgress}% complete</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(resumes as ResumeWithUploadMeta[])
                    .filter((resumeItem) => resumeItem.uploadedAt || resumeItem.uploadedFileName)
                    .map((resumeItem) => {
                      const isSelected = selectedPreviousUploadId === resumeItem._id;
                      return (
                        <button
                          key={resumeItem._id}
                          type="button"
                          onClick={() => setSelectedPreviousUploadId(resumeItem._id)}
                          className={`w-full rounded-lg border p-4 text-left transition ${
                            isSelected ? "border-primary bg-primary/5" : "hover:border-primary"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <FileText className="h-5 w-5 text-primary mt-0.5" />
                              <div>
                                <p className="font-semibold">{resumeItem.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Uploaded {resumeItem.uploadedAt ? formatDate(resumeItem.uploadedAt) : "recently"}
                                  {resumeItem.uploadedFileName ? ` · ${resumeItem.uploadedFileName}` : ""}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs rounded-full bg-secondary px-2 py-1">{resumeItem.format}</span>
                          </div>
                        </button>
                      );
                    })}

                  {!(resumes as ResumeWithUploadMeta[]).some((resumeItem) => resumeItem.uploadedAt || resumeItem.uploadedFileName) && (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No previous uploads yet. Upload a resume to build your first imported draft.
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setUploadModal(false)} disabled={isUploadingResume}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const selected = (resumes as ResumeWithUploadMeta[]).find((resumeItem) => resumeItem._id === selectedPreviousUploadId);
                        if (selected) loadPreviousUpload(selected);
                      }}
                      disabled={!selectedPreviousUploadId || isUploadingResume}
                    >
                      Load selected
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {uploadTab === "new" && (
                  <Button variant="outline" onClick={() => setUploadModal(false)} disabled={isUploadingResume}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tailorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Tailor this resume for a job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste the job description and AI will rewrite the summary, skills, and matching experience bullets for this resume.
              </p>
              <textarea
                className="w-full min-h-[220px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Paste the job description here..."
                value={tailorJobDescription}
                onChange={(e) => setTailorJobDescription(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTailorModal(false)} disabled={isTailoringResume}>
                  Cancel
                </Button>
                <Button variant="gradient" onClick={tailorResumeForJob} disabled={isTailoringResume}>
                  {isTailoringResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Tailor Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {templateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Choose a Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.map((template) => (
                  <div
                    key={template._id}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedTemplate === template.slug ? "border-primary bg-primary/5" : ""
                    } ${template.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary"}`}
                    onClick={() => {
                      if (!template.locked) setSelectedTemplate(template.slug);
                    }}
                  >
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 flex items-center justify-center mb-3 rounded">
                      <span className="text-3xl font-bold text-primary/30">{template.name[0]}</span>
                    </div>
                    <h3 className="font-semibold mb-1">{template.name}</h3>
                    <p className="text-sm text-muted mb-2">{template.description}</p>
                    <span className="text-xs capitalize bg-secondary px-2 py-1 rounded">{template.category}</span>
                    {template.isPremium && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Premium</span>}
                    {template.locked && <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">Locked</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4 justify-end">
                <Button variant="outline" onClick={() => setTemplateModal(false)}>Cancel</Button>
                <Button
                  variant="gradient"
                  onClick={async () => {
                    if (!selectedTemplate) return;
                    try {
                      const chosenTemplate = templates?.find((template) => template.slug === selectedTemplate);
                      if (chosenTemplate?.defaultTheme) {
                        setTheme((chosenTemplate.defaultTheme as Record<string, string>) || {});
                      }
                      if (isNew) {
                        await saveMutation.mutateAsync({ templateId: selectedTemplate });
                        toast.add("Template applied!", "success");
                      } else {
                        if (!id) {
                          toast.add("Unable to apply template right now.", "error");
                          return;
                        }
                        await api.patch(`/resumes/${id}/template`, { templateId: selectedTemplate });
                        toast.add("Template updated!", "success");
                        queryClient.invalidateQueries({ queryKey: ["resume", id] });
                      }
                      setTemplateModal(false);
                    } catch {
                      toast.add("Failed to update template", "error");
                    }
                  }}
                  disabled={!selectedTemplate}
                >
                  Apply Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
