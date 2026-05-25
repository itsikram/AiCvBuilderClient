import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Download, Loader2, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { normalizeLanguage } from "@/lib/language";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Resume } from "@/types";

interface CoverLetter {
  _id: string;
  title: string;
  companyName: string;
  jobTitle: string;
  content: string;
  createdAt: string;
}

export default function CoverLetterPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const [form, setForm] = useState({
    companyName: "",
    jobTitle: "",
    jobDescription: "",
  });
  const [generated, setGenerated] = useState("");
  const [resumeSource, setResumeSource] = useState<"saved" | "upload">("saved");
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedResumeLabel, setSelectedResumeLabel] = useState("Select a resume to personalize the letter");
  const [uploadStatus, setUploadStatus] = useState("Upload a PDF resume to personalize your cover letter.");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const { data: letters } = useQuery({
    queryKey: ["cover-letters"],
    queryFn: async () => {
      const { data } = await api.get("/cover-letters");
      return data.data as CoverLetter[];
    },
  });

  const { data: resumes = [] } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: async () => {
      const { data } = await api.get("/resumes");
      return data.data as Resume[];
    },
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post("/cover-letters/generate", {
        ...form,
        resumeId: selectedResumeId || undefined,
        language: normalizeLanguage(i18n.language),
      }),
    onSuccess: (res) => {
      setGenerated(res.data.data.letter.content);
      queryClient.invalidateQueries({ queryKey: ["cover-letters"] });
      toast.add("Cover letter generated!", "success");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Generation failed", "error");
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

      setUploadProgress(100);
      setUploadStatus("Resume uploaded and ready to use.");
      setSelectedResumeId(data.data.resumeId);
      setSelectedResumeLabel(data.data.title || file.name);
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

  const exportPDF = async (id: string) => {
    const res = await api.get(`/cover-letters/${id}/export-pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.pdf";
    a.click();
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-7 w-7 text-primary" />
            Cover Letter Generator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a saved resume or upload a new one, then let AI write a tailored cover letter for the job.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Generate New Cover Letter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Company Name"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
            <Input
              placeholder="Job Title"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            />
            <div>
              <label className="mb-1 block text-sm font-medium">Job description</label>
              <textarea
                className="w-full min-h-[180px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Paste the job description here..."
                value={form.jobDescription}
                onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
              />
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Resume source</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedResumeLabel}
                  </p>
                </div>
                {selectedResumeId && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedResumeId("");
                    setSelectedResumeLabel("Select a resume to personalize the letter");
                    setResumeSource("saved");
                  }}>
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex rounded-lg bg-background p-1">
                {(["saved", "upload"] as const).map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setResumeSource(source)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                      resumeSource === source ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {source === "saved" ? "Saved resumes" : "Upload new"}
                  </button>
                ))}
              </div>

              {resumeSource === "saved" ? (
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
                          }}
                          className={`w-full rounded-lg border p-3 text-left transition ${
                            isSelected ? "border-primary bg-primary/5" : "hover:border-primary"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{resume.title}</p>
                              <p className="text-xs text-muted-foreground">Last updated {formatDate(resume.updatedAt)}</p>
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
                    <p className="text-sm text-muted-foreground">PDF uploads are supported for AI parsing</p>
                    <span className="mt-3 inline-flex rounded-md border border-border bg-background px-3 py-1 text-sm">
                      Choose file
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      disabled={isUploadingResume}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleResumeUpload(file);
                      }}
                      className="sr-only"
                    />
                  </label>

                  <div className="rounded-lg border bg-background p-4 space-y-3">
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
            </div>

            <Button
              variant="gradient"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Generate with AI
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Cover Letter</CardTitle>
          </CardHeader>
          <CardContent>
            {generated ? (
              <div className="rounded-lg border border-border bg-secondary/30 p-4 whitespace-pre-wrap text-sm leading-7">
                {generated}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Your AI-generated cover letter will appear here after you generate it.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {letters && letters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Cover Letters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {letters.map((letter) => (
              <div
                key={letter._id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div>
                  <p className="font-medium">{letter.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(letter.createdAt)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportPDF(letter._id)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
