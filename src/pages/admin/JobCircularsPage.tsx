import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import api, { getErrorMessage } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import type { JobCircular } from "@/types";

const CATEGORIES: Array<[JobCircular["category"], string]> = [
  ["government", "Government"],
  ["bank", "Bank"],
  ["private", "Private"],
  ["ngo", "NGO"],
  ["international", "International / abroad"],
  ["other", "Other"],
];

const TELETALK_SPEC = "Photo 300×300 px (max 100 KB), signature 300×80 px (max 60 KB)";

const empty = () => ({
  title: "",
  organization: "",
  category: "government" as JobCircular["category"],
  language: "bn" as JobCircular["language"],
  summary: "",
  vacancies: "",
  location: "",
  salary: "",
  education: "",
  applyStart: "",
  deadline: "",
  applyUrl: "",
  sourceUrl: "",
  photoSpec: "",
  slug: "",
  isPublished: false,
});
type Form = ReturnType<typeof empty>;

const dateOnly = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }) : "");
/** A date picked in the form is that day in Bangladesh */
const toIso = (day: string) => (day ? new Date(`${day}T00:00:00+06:00`).toISOString() : null);

const fromJob = (job: JobCircular): Form => ({
  title: job.title,
  organization: job.organization,
  category: job.category,
  language: job.language,
  summary: job.summary,
  vacancies: job.vacancies?.toString() ?? "",
  location: job.location ?? "",
  salary: job.salary ?? "",
  education: job.education ?? "",
  applyStart: dateOnly(job.applyStart),
  deadline: dateOnly(job.deadline),
  applyUrl: job.applyUrl ?? "",
  sourceUrl: job.sourceUrl ?? "",
  photoSpec: job.photoSpec ?? "",
  slug: job.slug,
  isPublished: job.isPublished,
});

/** Job circulars for the public /jobs pages: summarise the circular and link the official source. */
export default function AdminJobCircularsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => (await api.get("/admin/jobs")).data.data as JobCircular[],
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        title: form.title,
        organization: form.organization,
        category: form.category,
        language: form.language,
        summary: form.summary,
        vacancies: form.vacancies === "" ? null : Number(form.vacancies),
        location: form.location || null,
        salary: form.salary || null,
        education: form.education || null,
        applyStart: toIso(form.applyStart),
        deadline: toIso(form.deadline),
        applyUrl: form.applyUrl || null,
        sourceUrl: form.sourceUrl || null,
        photoSpec: form.photoSpec || null,
        isPublished: form.isPublished,
      };
      return editing === "new" ? api.post("/admin/jobs", { ...body, slug: form.slug || undefined }) : api.patch(`/admin/jobs/${editing}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.add(form.isPublished ? "Saved and published" : "Saved as a draft", "success");
      setEditing(null);
    },
    onError: (error) => toast.add(getErrorMessage(error, "Couldn't save the circular"), "error"),
  });

  const remove = async (job: JobCircular) => {
    if (!(await confirmAction({ title: `Delete "${job.title}"?`, text: "Its public page disappears.", confirmLabel: "Delete", destructive: true }))) return;
    await api.delete(`/admin/jobs/${job._id}`).catch(() => undefined);
    queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
  };

  const text = (key: keyof Form, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-1">
      <Label htmlFor={`job-${key}`}>{label}</Label>
      <Input id={`job-${key}`} value={form[key] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Job circulars</h1>
          <p className="max-w-2xl text-muted">
            Publish summaries of job circulars at /jobs. Write them in your own words, always link the official circular, and
            add the photo and signature rules so readers can use the free resizer. New circulars appear at once and reach the
            sitemap on the next site build.
          </p>
        </div>
        {!editing && (
          <Button
            onClick={() => {
              setForm(empty());
              setEditing("new");
            }}
          >
            <Plus className="h-4 w-4" />
            New circular
          </Button>
        )}
      </div>

      {editing && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">{editing === "new" ? "New circular" : "Edit circular"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate();
              }}
            >
              <div className="md:col-span-2">{text("title", "Title", { required: true, minLength: 3, placeholder: "বাংলাদেশ ব্যাংক সহকারী পরিচালক নিয়োগ ২০২৬" })}</div>
              {text("organization", "Organisation", { required: true, placeholder: "Bangladesh Bank" })}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="job-category">Category</Label>
                  <select id="job-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Form["category"] })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-base sm:text-sm">
                    {CATEGORIES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="job-language">Written in</Label>
                  <select id="job-language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as Form["language"] })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-base sm:text-sm">
                    <option value="bn">Bangla (/bn/jobs/…)</option>
                    <option value="en">English (/jobs/…)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="job-summary">Details (blank line between paragraphs)</Label>
                <textarea id="job-summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={8} required minLength={20} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base sm:text-sm" />
              </div>
              {text("vacancies", "Vacancies", { type: "number", min: 0 })}
              {text("location", "Location", { placeholder: "Dhaka / anywhere in Bangladesh" })}
              {text("salary", "Salary", { placeholder: "Grade 9: BDT 22,000–53,060" })}
              {text("education", "Education", { placeholder: "Graduate in any subject" })}
              {text("applyStart", "Applications open", { type: "date" })}
              {text("deadline", "Deadline", { type: "date" })}
              {text("applyUrl", "Apply link", { type: "url", placeholder: "https://…teletalk.com.bd" })}
              {text("sourceUrl", "Official circular link", { type: "url", placeholder: "https://…" })}
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="job-photoSpec">Photo and signature rules</Label>
                <div className="flex gap-2">
                  <Input id="job-photoSpec" value={form.photoSpec} onChange={(e) => setForm({ ...form, photoSpec: e.target.value })} className="min-w-0 flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, photoSpec: TELETALK_SPEC })}>
                    Teletalk standard
                  </Button>
                </div>
              </div>
              {editing === "new" && text("slug", "URL slug (optional, English)", { pattern: "[a-z0-9-]{3,120}", placeholder: "bangladesh-bank-ad-2026" })}
              <div className="flex items-center gap-3 md:col-span-2">
                <Switch id="job-published" checked={form.isPublished} onCheckedChange={(checked) => setForm({ ...form, isPublished: checked })} />
                <Label htmlFor="job-published">Published</Label>
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" variant="gradient" disabled={save.isPending}>
                  Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !jobs?.length ? (
        <p className="py-6 text-center text-muted">No circulars yet.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job._id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div className="min-w-0">
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-sm text-muted">
                    {job.organization} · {job.category}
                    {job.deadline && ` · deadline ${new Date(job.deadline).toLocaleDateString()}`}
                  </p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant={job.isPublished ? "success" : "secondary"}>{job.isPublished ? "Published" : "Draft"}</Badge>
                    {!job.isOpen && <Badge variant="outline">Closed</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {job.isPublished && (
                    <Button variant="ghost" size="icon" asChild aria-label="Open public page">
                      <a href={`${job.language === "bn" ? "/bn" : ""}/jobs/${job.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setForm(fromJob(job));
                      setEditing(job._id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => void remove(job)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
