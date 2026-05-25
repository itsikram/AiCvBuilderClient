import type { ResumeContent } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  content: ResumeContent;
  templateId?: string;
  theme?: Record<string, string>;
  className?: string;
}

type PreviewStyle = {
  accent: string;
  heading: string;
  header: string;
  layout: "classic" | "sidebar" | "compact" | "bold";
};

const templateStyles: Record<string, PreviewStyle> = {
  "modern-ats": {
    accent: "text-blue-700",
    heading: "text-blue-800 border-blue-200",
    header: "text-center border-b border-gray-200",
    layout: "classic",
  },
  "professional-bd": {
    accent: "text-emerald-700",
    heading: "text-emerald-800 border-emerald-200",
    header: "text-left border-b-2 border-emerald-600",
    layout: "classic",
  },
  "executive-pro": {
    accent: "text-zinc-800",
    heading: "text-zinc-900 border-zinc-400",
    header: "text-left border-b-2 border-zinc-900",
    layout: "compact",
  },
  "creative-portfolio": {
    accent: "text-rose-700",
    heading: "text-rose-800 border-rose-200",
    header: "text-left",
    layout: "sidebar",
  },
  international: {
    accent: "text-indigo-700",
    heading: "text-indigo-800 border-indigo-200",
    header: "text-center border-b border-indigo-100",
    layout: "classic",
  },
  "minimalist-clean": {
    accent: "text-gray-700",
    heading: "text-gray-800 border-gray-200",
    header: "text-left border-b border-gray-200",
    layout: "compact",
  },
  "tech-professional": {
    accent: "text-cyan-700",
    heading: "text-cyan-800 border-cyan-200",
    header: "text-left border-b-2 border-cyan-600",
    layout: "sidebar",
  },
  "bd-government": {
    accent: "text-green-700",
    heading: "text-green-800 border-green-200",
    header: "text-center border-b-2 border-green-700",
    layout: "classic",
  },
  "bold-modern": {
    accent: "text-violet-700",
    heading: "text-violet-800 border-violet-200",
    header: "text-left bg-violet-950 text-white -m-8 mb-5 p-8",
    layout: "bold",
  },
  "academic-cv": {
    accent: "text-stone-700",
    heading: "text-stone-800 border-stone-300",
    header: "text-left border-b border-stone-300",
    layout: "classic",
  },
  "startup-ready": {
    accent: "text-sky-700",
    heading: "text-sky-800 border-sky-200",
    header: "text-left",
    layout: "sidebar",
  },
  "classic-professional": {
    accent: "text-slate-700",
    heading: "text-slate-800 border-slate-300",
    header: "text-center border-b-2 border-slate-700",
    layout: "classic",
  },
};

const formatList = (items: string[]) => items.filter(Boolean).join(" - ");

export function ResumePreview({ content, templateId = "modern-ats", theme, className }: Props) {
  const {
    personalInfo,
    experience,
    education,
    skills,
    projects,
    languages,
    certifications,
    awards,
    publications,
    volunteerExperience,
    references,
    interests,
    courses,
    memberships,
    customSections,
  } = content;

  const style = templateStyles[templateId] || templateStyles["modern-ats"];
  const isSidebar = style.layout === "sidebar";
  const sectionClass = style.layout === "compact" ? "mb-3" : "mb-4";
  const fontFamily = theme?.fontFamily || "Inter, ui-sans-serif, system-ui";
  const bodyColor = theme?.textColor || "#111827";
  const headingColor = theme?.headingColor || bodyColor;
  const accentColor = theme?.accentColor || "#2563eb";
  const backgroundColor = theme?.backgroundColor || "#ffffff";

  const SectionTitle = ({ children }: { children: string }) => (
    <h2
      className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
      style={{ borderColor: accentColor, color: headingColor, fontFamily }}
    >
      {children}
    </h2>
  );

  const sidebarBlocks = (
    <>
      {skills.length > 0 && (
        <section className={sectionClass}>
          <SectionTitle>Skills</SectionTitle>
          <p className="text-current">{formatList(skills)}</p>
        </section>
      )}
      {languages.length > 0 && (
        <section className={sectionClass}>
          <SectionTitle>Languages</SectionTitle>
          <p className="text-current">
            {languages.map((lang) => `${lang.name} (${lang.proficiency})`).join(" - ")}
          </p>
        </section>
      )}
      {certifications.length > 0 && (
        <section className={sectionClass}>
          <SectionTitle>Certifications</SectionTitle>
          {certifications.map((cert) => (
            <div key={cert.id} className="mb-2">
              <p className="font-semibold text-current">{cert.name}</p>
              <p className="text-xs text-current opacity-80">
                {cert.issuer} | {cert.date}
              </p>
            </div>
          ))}
        </section>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "p-8 shadow-lg rounded-lg text-sm leading-relaxed min-h-[800px]",
        className
      )}
      style={{ backgroundColor, color: bodyColor, fontFamily }}
    >
      <div className={cn("pb-4 mb-4 flex flex-col gap-3", style.header)}>
        {personalInfo.profilePhoto && (
          <div
            className={cn(
              "flex",
              personalInfo.profilePhotoAlignment === "left"
                ? "justify-start"
                : personalInfo.profilePhotoAlignment === "right"
                  ? "justify-end"
                  : "justify-center"
            )}
          >
            <img
              src={personalInfo.profilePhoto}
              alt={personalInfo.fullName || "Owner profile"}
              className={cn(
                "rounded-full object-cover border-2 border-white shadow",
                personalInfo.profilePhotoSize === "large"
                  ? "h-32 w-32"
                  : personalInfo.profilePhotoSize === "small"
                    ? "h-16 w-16"
                    : "h-24 w-24"
              )}
            />
          </div>
        )}
        <div
          className={cn(
            personalInfo.profilePhotoAlignment === "left"
              ? "text-left"
              : personalInfo.profilePhotoAlignment === "right"
                ? "text-right"
                : "text-center"
          )}
        >
          <h1
            className={cn("text-2xl font-bold", style.layout === "bold" ? "text-white" : "")}
            style={style.layout === "bold" ? undefined : { color: headingColor }}
          >
            {personalInfo.fullName || "Your Name"}
          </h1>
          <p
            className={cn("mt-1 text-xs", style.layout === "bold" ? "text-violet-100" : "")}
            style={style.layout === "bold" ? undefined : { color: bodyColor }}
          >
            {[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(" | ")}
          </p>
          {(personalInfo.linkedin || personalInfo.portfolio || personalInfo.github || personalInfo.website) && (
            <p
              className={cn("text-xs mt-1", style.layout === "bold" ? "text-violet-100" : "")}
              style={{ color: accentColor }}
            >
              {[personalInfo.linkedin, personalInfo.portfolio, personalInfo.github, personalInfo.website]
                .filter(Boolean)
                .join(" | ")}
            </p>
          )}
        </div>
      </div>

      <div className={cn(isSidebar && "grid grid-cols-[0.9fr_1.5fr] gap-6")}>
        {isSidebar && <aside>{sidebarBlocks}</aside>}

        <main>
          {personalInfo.summary && (
            <section className={sectionClass}>
              <SectionTitle>Professional Summary</SectionTitle>
              <p className="text-current">{personalInfo.summary}</p>
            </section>
          )}

          {experience.length > 0 && (
            <section className={sectionClass}>
              <SectionTitle>Experience</SectionTitle>
              {experience.map((exp) => (
                <div key={exp.id} className="mb-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold text-current">{exp.position}</p>
                      <p className="text-current opacity-80">{exp.company}</p>
                    </div>
                    <p className="text-xs whitespace-nowrap text-current opacity-70">
                      {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                    </p>
                  </div>
                  <ul className="mt-1 list-disc list-inside text-current space-y-0.5">
                    {exp.bullets.filter(Boolean).map((bullet, index) => (
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {education.length > 0 && (
            <section className={sectionClass}>
              <SectionTitle>Education</SectionTitle>
              {education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <p className="font-semibold text-current">
                    {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ""}
                  </p>
                  <p className="text-current opacity-80">
                    {edu.institution} | {edu.startDate} - {edu.endDate}
                  </p>
                </div>
              ))}
            </section>
          )}

          {!isSidebar && sidebarBlocks}

          {projects.length > 0 && (
            <section className={sectionClass}>
              <SectionTitle>Projects</SectionTitle>
              {projects.map((project) => (
                <div key={project.id} className="mb-2">
                  <p className="font-semibold text-current">{project.name}</p>
                  <p className="text-current">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <p className="text-xs text-current opacity-70">{project.technologies.join(", ")}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {awards.length > 0 && (
            <section className={sectionClass}>
              <SectionTitle>Awards</SectionTitle>
              {awards.map((award) => (
                <div key={award.id} className="mb-2">
                  <p className="font-semibold text-current">{award.title}</p>
                  <p className="text-xs text-current opacity-80">
                    {award.issuer} | {award.date}
                  </p>
                  {award.description && <p className="text-xs mt-1 text-current">{award.description}</p>}
                </div>
              ))}
            </section>
          )}

          {publications.length > 0 && (
            <section className={sectionClass}>
              <SectionTitle>Publications</SectionTitle>
              {publications.map((publication) => (
                <div key={publication.id} className="mb-2">
                  <p className="font-semibold text-current">{publication.title}</p>
                  <p className="text-xs text-current opacity-80">
                    {publication.publisher} | {publication.date}
                  </p>
                  {publication.description && (
                    <p className="text-xs mt-1 text-current">{publication.description}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {volunteerExperience.length > 0 && (
            <section className={sectionClass}>
              <SectionTitle>Volunteer Experience</SectionTitle>
              {volunteerExperience.map((volunteer) => (
                <div key={volunteer.id} className="mb-2">
                  <p className="font-semibold text-current">{volunteer.role}</p>
                  <p className="text-xs text-current opacity-80">
                    {volunteer.organization} | {volunteer.startDate} - {volunteer.current ? "Present" : volunteer.endDate}
                  </p>
                  {volunteer.description && (
                    <p className="text-xs mt-1 text-current">{volunteer.description}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {references.length > 0 && (
            <section className={sectionClass}>
              <SectionTitle>References</SectionTitle>
              {references.map((reference) => (
                <div key={reference.id} className="mb-2">
                  <p className="font-semibold text-current">{reference.name}</p>
                  <p className="text-xs text-current opacity-80">
                    {reference.position} at {reference.company}
                  </p>
                  <p className="text-xs text-current opacity-70">
                    {[reference.email, reference.phone].filter(Boolean).join(" | ")}
                  </p>
                </div>
              ))}
            </section>
          )}

          {interests.length > 0 && (
            <section className={sectionClass}>
              <SectionTitle>Interests</SectionTitle>
              <p className="text-current">{formatList(interests)}</p>
            </section>
          )}

          {courses.length > 0 && (
            <section className={sectionClass}>
              <SectionTitle>Courses</SectionTitle>
              {courses.map((course) => (
                <div key={course.id} className="mb-2">
                  <p className="font-semibold text-current">{course.name}</p>
                  <p className="text-xs text-current opacity-80">
                    {course.provider} | {course.date}
                  </p>
                </div>
              ))}
            </section>
          )}

          {memberships.length > 0 && (
            <section className={sectionClass}>
              <SectionTitle>Professional Memberships</SectionTitle>
              {memberships.map((membership) => (
                <div key={membership.id} className="mb-2">
                  <p className="font-semibold text-current">{membership.organization}</p>
                  <p className="text-xs text-current opacity-80">
                    {[membership.role, membership.startDate].filter(Boolean).join(" | ")}
                    {membership.current ? " - Present" : membership.endDate ? ` - ${membership.endDate}` : ""}
                  </p>
                </div>
              ))}
            </section>
          )}

          {customSections.length > 0 && (
            <section className={sectionClass}>
              {customSections.map((section) => (
                <div key={section.title} className="mb-2">
                  <SectionTitle>{section.title}</SectionTitle>
                  <p className="text-current">{section.content}</p>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
