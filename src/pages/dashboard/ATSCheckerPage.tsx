import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Target, Loader2, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { normalizeLanguage } from "@/lib/language";
import { useToast } from "@/components/ui/toast";
import type { Resume, ResumeContent } from "@/types";

interface ATSResult {
  score: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  keywordAnalysis: { found: string[]; missing: string[] };
  recommendations: string[];
}

const buildResumeTextFromContent = (content: ResumeContent) => {
  const lines = [
    content.personalInfo.fullName,
    content.personalInfo.email,
    content.personalInfo.phone,
    content.personalInfo.location,
    content.personalInfo.summary,
    content.skills.length ? `Skills: ${content.skills.join(", ")}` : "",
    content.projects.length
      ? `Projects: ${content.projects.map((project) => `${project.name} - ${project.description}`).join(" | ")}`
      : "",
    content.experience.length
      ? `Experience: ${content.experience
          .map((experience) => `${experience.position} at ${experience.company} - ${experience.bullets.filter(Boolean).join(" | ")}`)
          .join(" | ")}`
      : "",
    content.education.length
      ? `Education: ${content.education
          .map((education) => `${education.degree} at ${education.institution}`)
          .join(" | ")}`
      : "",
    content.languages.length
      ? `Languages: ${content.languages.map((language) => `${language.name} (${language.proficiency})`).join(", ")}`
      : "",
    content.certifications.length
      ? `Certifications: ${content.certifications.map((certification) => certification.name).join(", ")}`
      : "",
    content.awards.length ? `Awards: ${content.awards.map((award) => award.title).join(", ")}` : "",
    content.publications.length
      ? `Publications: ${content.publications.map((publication) => publication.title).join(", ")}`
      : "",
    content.volunteerExperience.length
      ? `Volunteer: ${content.volunteerExperience.map((volunteer) => volunteer.role).join(", ")}`
      : "",
    content.references.length
      ? `References: ${content.references.map((reference) => reference.name).join(", ")}`
      : "",
    content.interests.length ? `Interests: ${content.interests.join(", ")}` : "",
    content.courses.length ? `Courses: ${content.courses.map((course) => course.name).join(", ")}` : "",
    content.memberships.length
      ? `Memberships: ${content.memberships.map((membership) => membership.organization).join(", ")}`
      : "",
  ].filter(Boolean);

  return lines.join("\n");
};

export default function ATSCheckerPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);
  const [resumeSource, setResumeSource] = useState<"text" | "saved" | "upload">("text");
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedResumeLabel, setSelectedResumeLabel] = useState("Choose a saved resume or upload one to analyze.");
  const [uploadStatus, setUploadStatus] = useState("Upload a PDF or DOCX resume to use it in the ATS check.");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const { data: resumes = [] } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: async () => {
      const { data } = await api.get("/resumes");
      return data.data as Resume[];
    },
  });

  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    setUploadProgress(5);
    setUploadStatus("Uploading your resume...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/resumes/upload-parse", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.max(5, Math.min(95, percent)));
          }
        },
      });

      const parsedContent = data.data.content as ResumeContent;
      const parsedText = buildResumeTextFromContent(parsedContent);

      setUploadProgress(100);
      setUploadStatus("Resume uploaded and ready to analyze.");
      setSelectedResumeId(data.data.resumeId);
      setSelectedResumeLabel(data.data.title || file.name);
      setResumeText(parsedText);
      setResumeSource("upload");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.add("Resume uploaded and ready to use", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setUploadStatus(msg || "Upload failed. Please try again.");
      toast.add(msg || "Upload failed", "error");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const resolveResumeText = () => {
    if (resumeSource === "saved") {
      const selected = resumes.find((resume) => resume._id === selectedResumeId);
      if (!selected) {
        return "";
      }
      return buildResumeTextFromContent(selected.content);
    }

    if (resumeSource === "upload") {
      return resumeText.trim();
    }

    return resumeText.trim();
  };

  const handleCheck = async () => {
    const textToCheck = resolveResumeText();

    if (textToCheck.length < 50) {
      toast.add("Please provide at least 50 characters of resume text", "error");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/resumes/ai/ats-check", {
        resumeText: textToCheck,
        jobDescription,
        language: normalizeLanguage(i18n.language),
      });
      setResult(data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "ATS check failed. Premium may be required.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-7 w-7 text-primary" />
          ATS Score Checker
        </h1>
        <p className="text-sm text-muted-foreground">
          Analyze a saved resume, an uploaded resume, or paste your own text for ATS compatibility.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resume source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">Selected resume</p>
                <p className="text-sm text-muted-foreground">{selectedResumeLabel}</p>
              </div>
              {selectedResumeId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedResumeId("");
                    setSelectedResumeLabel("Choose a saved resume or upload one to analyze.");
                    setResumeSource("text");
                    setResumeText("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex rounded-lg bg-secondary p-1">
              {(["text", "saved", "upload"] as const).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setResumeSource(source)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                    resumeSource === source ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {source === "text" ? "Paste text" : source === "saved" ? "Saved resumes" : "Upload new"}
                </button>
              ))}
            </div>

            {resumeSource === "text" ? (
              <div>
                <label className="mb-1 block text-sm font-medium">Resume text</label>
                <textarea
                  className="w-full min-h-[260px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Paste your resume content here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
            ) : resumeSource === "saved" ? (
              <div className="space-y-2">
                {resumes.length > 0 ? (
                  resumes.map((resume) => {
                    const isSelected = selectedResumeId === resume._id;
                    return (
                      <button
                        key={resume._id}
                        type="button"
                        onClick={() => {
                          setSelectedResumeId(resume._id);
                          setSelectedResumeLabel(resume.title);
                          setResumeText(buildResumeTextFromContent(resume.content));
                        }}
                        className={`w-full rounded-lg border p-3 text-left transition ${
                          isSelected ? "border-primary bg-primary/5" : "hover:border-primary"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{resume.title}</p>
                            <p className="text-xs text-muted-foreground">Last updated {new Date(resume.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    You don’t have any saved resumes yet. Upload a new resume to get started.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block cursor-pointer rounded-lg border-2 border-dashed border-border p-5 text-center transition hover:border-primary">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload your existing resume</p>
                  <p className="text-sm text-muted-foreground">PDF or DOCX uploads are supported</p>
                  <span className="mt-3 inline-flex rounded-md border border-border bg-background px-3 py-1 text-sm">
                    Choose file
                  </span>
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
                    <span className="text-muted-foreground">{isUploadingResume ? `${uploadProgress}%` : "Ready"}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${isUploadingResume ? uploadProgress : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Job description (optional)</label>
              <textarea
                className="w-full min-h-[180px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Paste job description for targeted ATS analysis..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <Button variant="gradient" onClick={handleCheck} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              Check ATS Score
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold gradient-text">{result.score}%</div>
                  <Badge variant={result.score >= 80 ? "success" : "secondary"} className="text-lg px-3">
                    Grade {result.grade}
                  </Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2 text-green-600">Strengths</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {result.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-red-600">Weaknesses</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {result.weaknesses.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {result.keywordAnalysis.missing.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.keywordAnalysis.missing.map((k) => (
                        <Badge key={k} variant="outline">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {result.recommendations.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Your ATS score will appear here after you run the analysis.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
