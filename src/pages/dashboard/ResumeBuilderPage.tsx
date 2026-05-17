import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Save, Download, Sparkles, Share2, ChevronUp, ChevronDown, Plus, Trash2, Upload } from "lucide-react";
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
  const [sectionOrder, setSectionOrder] = useState(["summary", "experience", "education", "skills", "projects"]);
  const [aiModal, setAiModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [pendingTemplate, setPendingTemplate] = useState("");
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
      return data.data as { _id: string; name: string; slug: string; description: string; category: string; isPremium: boolean; thumbnail: string }[];
    },
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
        const { data } = await api.post("/resumes", { title, templateId: templateFromUrl });
        await api.patch(`/resumes/${data.data._id}`, { content, sectionOrder });
        // Apply pending template if exists
        if (pendingTemplate) {
          await api.patch(`/resumes/${data.data._id}/template`, { templateId: pendingTemplate });
        }
        return data.data._id as string;
      }
      await api.patch(`/resumes/${id}`, { title, content, sectionOrder });
      return id!;
    },
    onSuccess: (resumeId) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.add("Resume saved!", "success");
      if (isNew) {
        navigate(`/dashboard/resumes/${resumeId}`, { replace: true });
        setPendingTemplate("");
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

  const handleResumeUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/resumes/upload-parse", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const parsedContent = data.data;
      setContent((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          ...parsedContent.personalInfo,
        },
        experience: parsedContent.experience?.map((exp: any) => ({
          id: crypto.randomUUID(),
          company: exp.company || "",
          position: exp.position || "",
          location: exp.location || "",
          startDate: exp.startDate || "",
          endDate: exp.endDate || "",
          current: exp.current || false,
          bullets: exp.bullets || [""],
        })) || [],
        education: parsedContent.education?.map((edu: any) => ({
          id: crypto.randomUUID(),
          institution: edu.institution || "",
          degree: edu.degree || "",
          field: edu.field || "",
          startDate: edu.startDate || "",
          endDate: edu.endDate || "",
          gpa: edu.gpa || "",
        })) || [],
        skills: parsedContent.skills || [],
        languages: parsedContent.languages?.map((lang: any) => ({
          id: crypto.randomUUID(),
          name: lang.name || "",
          proficiency: lang.proficiency || "intermediate",
        })) || [],
        certifications: parsedContent.certifications?.map((cert: any) => ({
          id: crypto.randomUUID(),
          name: cert.name || "",
          issuer: cert.issuer || "",
          date: cert.date || "",
          credentialId: cert.credentialId || "",
          credentialUrl: cert.credentialUrl || "",
        })) || [],
        awards: parsedContent.awards?.map((award: any) => ({
          id: crypto.randomUUID(),
          title: award.title || "",
          issuer: award.issuer || "",
          date: award.date || "",
          description: award.description || "",
        })) || [],
        publications: parsedContent.publications?.map((pub: any) => ({
          id: crypto.randomUUID(),
          title: pub.title || "",
          publisher: pub.publisher || "",
          date: pub.date || "",
          url: pub.url || "",
          description: pub.description || "",
        })) || [],
        volunteerExperience: parsedContent.volunteerExperience?.map((vol: any) => ({
          id: crypto.randomUUID(),
          organization: vol.organization || "",
          role: vol.role || "",
          startDate: vol.startDate || "",
          endDate: vol.endDate || "",
          current: vol.current || false,
          description: vol.description || "",
        })) || [],
        references: parsedContent.references?.map((ref: any) => ({
          id: crypto.randomUUID(),
          name: ref.name || "",
          position: ref.position || "",
          company: ref.company || "",
          email: ref.email || "",
          phone: ref.phone || "",
          relationship: ref.relationship || "",
        })) || [],
        interests: parsedContent.interests || [],
        courses: parsedContent.courses?.map((course: any) => ({
          id: crypto.randomUUID(),
          name: course.name || "",
          provider: course.provider || "",
          date: course.date || "",
          certificateUrl: course.certificateUrl || "",
        })) || [],
        memberships: parsedContent.memberships?.map((mem: any) => ({
          id: crypto.randomUUID(),
          organization: mem.organization || "",
          role: mem.role || "",
          startDate: mem.startDate || "",
          endDate: mem.endDate || "",
          current: mem.current || false,
        })) || [],
        projects: parsedContent.projects?.map((proj: any) => ({
          id: crypto.randomUUID(),
          name: proj.name || "",
          description: proj.description || "",
          url: proj.url || "",
          technologies: proj.technologies || [],
        })) || [],
      }));
      setUploadModal(false);
      toast.add("Resume uploaded and parsed!", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Upload failed", "error");
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

      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Upload Current Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Upload your existing resume (PDF or DOCX)</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleResumeUpload(file);
                  }}
                  className="w-full text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setUploadModal(false)}>Cancel</Button>
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
                    className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${
                      selectedTemplate === template.slug ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setSelectedTemplate(template.slug)}
                  >
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 flex items-center justify-center mb-3 rounded">
                      <span className="text-3xl font-bold text-primary/30">{template.name[0]}</span>
                    </div>
                    <h3 className="font-semibold mb-1">{template.name}</h3>
                    <p className="text-sm text-muted mb-2">{template.description}</p>
                    <span className="text-xs capitalize bg-secondary px-2 py-1 rounded">{template.category}</span>
                    {template.isPremium && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Premium</span>}
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
                      if (isNew) {
                        // For new resumes, save the resume first, then update the template
                        setPendingTemplate(selectedTemplate);
                        await saveMutation.mutateAsync();
                        toast.add("Template applied!", "success");
                      } else {
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
