import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ExternalLink, Eye, FileText, Globe, Upload, Users, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { ResumePreview } from "@/components/resume/ResumePreview";
import api, { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Resume } from "@/types";

interface Owner {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  plan: string;
  status: string;
  createdAt: string;
}

interface ResumeRow {
  _id: string;
  userId: string;
  title: string;
  templateId: string;
  format: Resume["format"];
  language: Resume["language"];
  atsScore: number | null;
  isPublic: boolean;
  publicSlug: string | null;
  viewCount: number;
  uploadedFileName: string | null;
  uploadedAt: string | null;
  lastExportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  hasPhoto: boolean;
  counts: Record<"experience" | "education" | "skills" | "projects" | "trainings" | "certifications" | "languages" | "references", number>;
  topSkills: string[];
  latestRole: { position: string; company: string } | null;
  user: Owner | null;
}

interface ListResponse {
  resumes: ResumeRow[];
  total: number;
  page: number;
  pages: number;
  stats: { total: number; public: number; uploaded: number; newThisWeek: number; owners: number };
}

type ResumeDetail = Resume & {
  userId: string;
  viewCount: number;
  lastExportedAt: string | null;
  uploadedFileName: string | null;
  uploadedFileUrl: string | null;
  uploadedFileSize: number | null;
  uploadedAt: string | null;
  uploadedResumeText: string | null;
  coverLetterCount: number;
  user: Owner | null;
};

const FORMAT_LABEL: Record<Resume["format"], string> = {
  ats: "ATS",
  international: "International",
  bangladeshi: "Bangladeshi",
};

const dateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "—");
const date = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "—");

const selectClass =
  "h-10 rounded-lg border border-border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm";

/** Every CV users have made, searchable, with a full read-only view of each one. */
export default function AdminResumesPage() {
  const [params, setParams] = useSearchParams();
  const userId = params.get("userId") ?? "";
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState("");
  const [visibility, setVisibility] = useState("");
  const [source, setSource] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["admin-resumes", page, search, userId, format, visibility, source],
    queryFn: async () => {
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) query.set("search", search);
      if (userId) query.set("userId", userId);
      if (format) query.set("format", format);
      if (visibility) query.set("isPublic", visibility);
      if (source) query.set("uploaded", source);
      return (await api.get(`/admin/resumes?${query}`)).data.data as ListResponse;
    },
    placeholderData: keepPreviousData,
  });

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const filteredUser = userId ? data?.resumes[0]?.user : null;
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All CVs</h1>
        <p className="text-muted">Every CV your users have created or uploaded. Open one to see all of its details.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard icon={FileText} label="Total CVs" value={stats?.total} />
        <StatCard icon={Users} label="Users with a CV" value={stats?.owners} />
        <StatCard icon={Sparkles} label="New this week" value={stats?.newThisWeek} />
        <StatCard icon={Globe} label="Public links" value={stats?.public} />
        <StatCard icon={Upload} label="From uploads" value={stats?.uploaded} />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchDraft.trim());
              setPage(1);
            }}
          >
            <Input
              placeholder="Search by CV title, user name or email…"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className="sm:max-w-md"
              aria-label="Search CVs"
            />
            <Button type="submit">Search</Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setSearchDraft("");
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <select className={selectClass} value={format} onChange={(e) => resetPage(setFormat)(e.target.value)} aria-label="Format">
              <option value="">All formats</option>
              <option value="ats">ATS</option>
              <option value="international">International</option>
              <option value="bangladeshi">Bangladeshi</option>
            </select>
            <select className={selectClass} value={visibility} onChange={(e) => resetPage(setVisibility)(e.target.value)} aria-label="Visibility">
              <option value="">Public and private</option>
              <option value="true">Public link on</option>
              <option value="false">Private</option>
            </select>
            <select className={selectClass} value={source} onChange={(e) => resetPage(setSource)(e.target.value)} aria-label="Source">
              <option value="">Built and uploaded</option>
              <option value="false">Built in the editor</option>
              <option value="true">From an uploaded file</option>
            </select>
            {userId && (
              <Badge variant="secondary" className="gap-1 py-1">
                User: {filteredUser ? `${filteredUser.name} (${filteredUser.email})` : userId}
                <button
                  type="button"
                  aria-label="Show every user's CVs"
                  className="ml-1 rounded hover:text-primary"
                  onClick={() => {
                    params.delete("userId");
                    setParams(params);
                    setPage(1);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            CVs {data ? `(${data.total} ${data.total === 1 ? "match" : "matches"})` : ""}
            {isFetching && !isLoading && <span className="ml-2 text-sm font-normal text-muted">Updating…</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={10} cols={7} />
          ) : isError ? (
            <p className="py-10 text-center text-muted">{getErrorMessage(error, "Couldn't load CVs.")}</p>
          ) : !data?.resumes.length ? (
            <p className="py-10 text-center text-muted">No CVs match.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-2 py-3">CV</th>
                    <th className="px-2 py-3">Owner</th>
                    <th className="px-2 py-3">Format</th>
                    <th className="px-2 py-3">Content</th>
                    <th className="px-2 py-3">ATS</th>
                    <th className="px-2 py-3">Sharing</th>
                    <th className="px-2 py-3">Updated</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.resumes.map((resume) => (
                    <tr key={resume._id} className="border-b border-border align-top hover:bg-secondary/50">
                      <td className="max-w-[260px] px-2 py-3">
                        <button type="button" className="text-left font-medium hover:text-primary hover:underline" onClick={() => setOpenId(resume._id)}>
                          {resume.title || "Untitled CV"}
                        </button>
                        <p className="truncate text-muted">
                          {resume.fullName || "No name"}
                          {resume.jobTitle && ` · ${resume.jobTitle}`}
                        </p>
                        {resume.latestRole?.position && (
                          <p className="truncate text-xs text-muted">
                            {resume.latestRole.position}
                            {resume.latestRole.company && ` at ${resume.latestRole.company}`}
                          </p>
                        )}
                      </td>
                      <td className="max-w-[220px] px-2 py-3">
                        {resume.user ? (
                          <>
                            <p className="truncate font-medium">{resume.user.name}</p>
                            <p className="truncate text-muted">{resume.user.email}</p>
                            <Badge variant={resume.user.plan === "premium" ? "premium" : "secondary"} className="mt-1 capitalize">
                              {resume.user.plan}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-muted">Deleted user</span>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <p>{FORMAT_LABEL[resume.format] ?? resume.format}</p>
                        <p className="text-xs text-muted">
                          {resume.templateId} · {resume.language.toUpperCase()}
                        </p>
                        {resume.uploadedAt && (
                          <Badge variant="outline" className="mt-1">
                            Uploaded
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-muted">
                        <p>
                          {resume.counts.experience} jobs · {resume.counts.education} education
                        </p>
                        <p>
                          {resume.counts.skills} skills · {resume.counts.projects} projects
                        </p>
                        {resume.hasPhoto && <p>Has photo</p>}
                      </td>
                      <td className="px-2 py-3">
                        {resume.atsScore != null ? <AtsBadge score={resume.atsScore} /> : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-2 py-3 text-xs">
                        {resume.isPublic ? (
                          <>
                            <Badge variant="success">Public</Badge>
                            <p className="mt-1 text-muted">{resume.viewCount} views</p>
                          </>
                        ) : (
                          <span className="text-muted">Private</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-muted">
                        <p>{date(resume.updatedAt)}</p>
                        <p className="text-xs">Created {date(resume.createdAt)}</p>
                      </td>
                      <td className="px-2 py-3">
                        <Button size="sm" variant="outline" onClick={() => setOpenId(resume._id)}>
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted">
                Page {data.page} of {data.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ResumeDialog id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value?: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-xl font-bold tabular-nums">{value ?? "—"}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AtsBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      : score >= 60
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
  return <span className={cn("rounded-full px-2 py-1 text-xs font-medium tabular-nums", tone)}>{score}</span>;
}

function ResumeDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [tab, setTab] = useState<"details" | "preview">("details");
  const detail = useQuery({
    queryKey: ["admin-resume", id],
    queryFn: async () => (await api.get(`/admin/resumes/${id}`)).data.data as ResumeDetail,
    enabled: Boolean(id),
    retry: false,
  });
  const resume = detail.data;

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setTab("details");
        }
      }}
      title={resume?.title || "CV details"}
      description={resume?.user ? `${resume.user.name} · ${resume.user.email}` : undefined}
      size="lg"
    >
      {detail.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : detail.isError || !resume ? (
        <p className="text-sm text-muted">{getErrorMessage(detail.error, "This CV isn't available.")}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2" role="tablist">
            <Button size="sm" role="tab" aria-selected={tab === "details"} variant={tab === "details" ? "default" : "outline"} onClick={() => setTab("details")}>
              Details
            </Button>
            <Button size="sm" role="tab" aria-selected={tab === "preview"} variant={tab === "preview" ? "default" : "outline"} onClick={() => setTab("preview")}>
              Preview
            </Button>
          </div>
          <div className="max-h-[70vh] overflow-auto pr-1">
            {tab === "preview" ? (
              <ResumePreview
                content={resume.content}
                templateId={resume.templateId}
                theme={resume.theme}
                sectionOrder={resume.sectionOrder}
                language={resume.language}
              />
            ) : (
              <ResumeDetails resume={resume} />
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Fields({ rows }: { rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!shown.length) return <p className="text-sm text-muted">Nothing filled in.</p>;
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {shown.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Entry({ title, subtitle, meta, children }: { title: ReactNode; subtitle?: ReactNode; meta?: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">{title}</p>
        {meta && <p className="text-xs text-muted">{meta}</p>}
      </div>
      {subtitle && <p className="text-muted">{subtitle}</p>}
      {children}
    </div>
  );
}

const range = (start?: string, end?: string, current?: boolean) =>
  [start, current ? "Present" : end].filter(Boolean).join(" – ");

const link = (url?: string) =>
  url ? (
    <a href={/^https?:\/\//i.test(url) ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {url}
    </a>
  ) : undefined;

function ResumeDetails({ resume }: { resume: ResumeDetail }) {
  const c = resume.content;
  const info = c.personalInfo;
  const pd = c.personalDetails ?? {};

  return (
    <div className="space-y-6">
      <Section title="Owner">
        {resume.user ? (
          <div className="space-y-2">
            <Fields
              rows={[
                ["Name", resume.user.name],
                ["Email", resume.user.email],
                ["Plan", <span className="capitalize">{`${resume.user.plan} (${resume.user.status})`}</span>],
                ["Joined", date(resume.user.createdAt)],
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to={`/admin/resumes?userId=${encodeURIComponent(resume.user._id)}`}>All of this user's CVs</Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link to={`/admin/activity?userId=${encodeURIComponent(resume.user._id)}`}>Activity</Link>
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">The owner's account was deleted.</p>
        )}
      </Section>

      <Section title="CV info">
        <Fields
          rows={[
            ["Format", FORMAT_LABEL[resume.format] ?? resume.format],
            ["Template", resume.templateId],
            ["Language", resume.language === "bn" ? "Bangla" : "English"],
            ["ATS score", resume.atsScore != null ? <AtsBadge score={resume.atsScore} /> : undefined],
            [
              "Public link",
              resume.isPublic && resume.publicSlug ? (
                <a href={`/r/${resume.publicSlug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  /r/{resume.publicSlug} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "Off"
              ),
            ],
            ["Public views", resume.viewCount],
            ["Cover letters", resume.coverLetterCount],
            ["Created", dateTime(resume.createdAt)],
            ["Last edited", dateTime(resume.updatedAt)],
            ["Last exported", dateTime(resume.lastExportedAt)],
            [
              "Uploaded file",
              resume.uploadedFileName
                ? resume.uploadedFileUrl
                  ? <a href={resume.uploadedFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{resume.uploadedFileName}</a>
                  : resume.uploadedFileName
                : undefined,
            ],
            ["Uploaded at", resume.uploadedAt ? dateTime(resume.uploadedAt) : undefined],
          ]}
        />
        {!!resume.atsFeedback?.length && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {resume.atsFeedback.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Personal information">
        <div className="flex gap-4">
          {info.profilePhoto && <img src={info.profilePhoto} alt="" className="h-20 w-20 shrink-0 rounded-lg border border-border object-cover" />}
          <div className="min-w-0 flex-1">
            <Fields
              rows={[
                ["Full name", info.fullName],
                ["Job title", info.jobTitle],
                ["Email", info.email],
                ["Phone", info.phone],
                ["Location", info.location],
                ["LinkedIn", link(info.linkedin)],
                ["GitHub", link(info.github)],
                ["Portfolio", link(info.portfolio)],
                ["Website", link(info.website)],
              ]}
            />
          </div>
        </div>
      </Section>

      {(info.summary || c.careerObjective) && (
        <Section title="Summary & objective">
          {info.summary && <p className="whitespace-pre-wrap text-sm">{info.summary}</p>}
          {c.careerObjective && (
            <p className="whitespace-pre-wrap text-sm">
              <span className="font-medium">Career objective: </span>
              {c.careerObjective}
            </p>
          )}
        </Section>
      )}

      {Object.values(pd).some(Boolean) && (
        <Section title="Personal details">
          <Fields
            rows={[
              ["Father's name", pd.fatherName],
              ["Mother's name", pd.motherName],
              ["Date of birth", pd.dateOfBirth],
              ["Gender", pd.gender],
              ["Nationality", pd.nationality],
              ["Religion", pd.religion],
              ["Marital status", pd.maritalStatus],
              ["NID", pd.nid],
              ["Blood group", pd.bloodGroup],
              ["Permanent address", pd.permanentAddress],
            ]}
          />
        </Section>
      )}

      {!!c.experience?.length && (
        <Section title={`Experience (${c.experience.length})`}>
          {c.experience.map((job) => (
            <Entry key={job.id} title={job.position || "—"} subtitle={[job.company, job.location].filter(Boolean).join(", ")} meta={range(job.startDate, job.endDate, job.current)}>
              {!!job.bullets?.filter(Boolean).length && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {job.bullets.filter(Boolean).map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </Entry>
          ))}
        </Section>
      )}

      {!!c.education?.length && (
        <Section title={`Education (${c.education.length})`}>
          {c.education.map((edu) => (
            <Entry
              key={edu.id}
              title={[edu.degree, edu.field].filter(Boolean).join(" — ") || "—"}
              subtitle={[edu.institution, edu.board].filter(Boolean).join(", ")}
              meta={edu.passingYear || range(edu.startDate, edu.endDate)}
            >
              {edu.gpa && (
                <p className="mt-1 text-muted">
                  Result: {edu.gpa}
                  {edu.gpaScale && ` / ${edu.gpaScale}`}
                </p>
              )}
            </Entry>
          ))}
        </Section>
      )}

      {!!c.trainings?.length && (
        <Section title={`Training (${c.trainings.length})`}>
          {c.trainings.map((t) => (
            <Entry key={t.id} title={t.title} subtitle={t.institute} meta={[t.duration, t.year].filter(Boolean).join(" · ")}>
              {t.description && <p className="mt-1 whitespace-pre-wrap">{t.description}</p>}
            </Entry>
          ))}
        </Section>
      )}

      {!!c.skills?.length && (
        <Section title={`Skills (${c.skills.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {c.skills.map((skill, i) => (
              <Badge key={i} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {!!c.projects?.length && (
        <Section title={`Projects (${c.projects.length})`}>
          {c.projects.map((p) => (
            <Entry key={p.id} title={p.name} meta={link(p.url)}>
              {p.description && <p className="mt-1 whitespace-pre-wrap">{p.description}</p>}
              {!!p.technologies?.length && <p className="mt-1 text-xs text-muted">{p.technologies.join(", ")}</p>}
            </Entry>
          ))}
        </Section>
      )}

      {!!c.languages?.length && (
        <Section title="Languages">
          <p className="text-sm">{c.languages.map((l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ""}`).join(", ")}</p>
        </Section>
      )}

      {!!c.certifications?.length && (
        <Section title={`Certifications (${c.certifications.length})`}>
          {c.certifications.map((cert) => (
            <Entry key={cert.id} title={cert.name} subtitle={cert.issuer} meta={cert.date}>
              {cert.credentialId && <p className="mt-1 text-xs text-muted">ID: {cert.credentialId}</p>}
              {cert.credentialUrl && <p className="mt-1 text-xs">{link(cert.credentialUrl)}</p>}
            </Entry>
          ))}
        </Section>
      )}

      {!!c.courses?.length && (
        <Section title={`Courses (${c.courses.length})`}>
          {c.courses.map((course) => (
            <Entry key={course.id} title={course.name} subtitle={course.provider} meta={course.date} />
          ))}
        </Section>
      )}

      {!!c.awards?.length && (
        <Section title={`Awards (${c.awards.length})`}>
          {c.awards.map((award) => (
            <Entry key={award.id} title={award.title} subtitle={award.issuer} meta={award.date}>
              {award.description && <p className="mt-1 whitespace-pre-wrap">{award.description}</p>}
            </Entry>
          ))}
        </Section>
      )}

      {!!c.publications?.length && (
        <Section title={`Publications (${c.publications.length})`}>
          {c.publications.map((pub) => (
            <Entry key={pub.id} title={pub.title} subtitle={pub.publisher} meta={pub.date}>
              {pub.description && <p className="mt-1 whitespace-pre-wrap">{pub.description}</p>}
              {pub.url && <p className="mt-1 text-xs">{link(pub.url)}</p>}
            </Entry>
          ))}
        </Section>
      )}

      {!!c.volunteerExperience?.length && (
        <Section title={`Volunteering (${c.volunteerExperience.length})`}>
          {c.volunteerExperience.map((v) => (
            <Entry key={v.id} title={v.role} subtitle={v.organization} meta={range(v.startDate, v.endDate, v.current)}>
              {v.description && <p className="mt-1 whitespace-pre-wrap">{v.description}</p>}
            </Entry>
          ))}
        </Section>
      )}

      {!!c.memberships?.length && (
        <Section title={`Memberships (${c.memberships.length})`}>
          {c.memberships.map((m) => (
            <Entry key={m.id} title={m.organization} subtitle={m.role} meta={range(m.startDate, m.endDate, m.current)} />
          ))}
        </Section>
      )}

      {!!c.references?.length && (
        <Section title={`References (${c.references.length})`}>
          {c.references.map((r) => (
            <Entry key={r.id} title={r.name} subtitle={[r.position, r.company].filter(Boolean).join(", ")} meta={r.relationship}>
              <p className="mt-1 text-xs text-muted">{[r.email, r.phone].filter(Boolean).join(" · ")}</p>
            </Entry>
          ))}
        </Section>
      )}

      {!!c.interests?.length && (
        <Section title="Interests">
          <p className="text-sm">{c.interests.join(", ")}</p>
        </Section>
      )}

      {c.customSections?.map((section, i) => (
        <Section key={i} title={section.title || "Custom section"}>
          <p className="whitespace-pre-wrap text-sm">{section.content}</p>
        </Section>
      ))}

      {resume.uploadedResumeText && (
        <Section title="Text extracted from the uploaded file">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-secondary/50 p-3 text-xs">{resume.uploadedResumeText}</pre>
        </Section>
      )}
    </div>
  );
}
