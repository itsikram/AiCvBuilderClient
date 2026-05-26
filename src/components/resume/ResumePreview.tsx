import type { ResumeContent } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  content: ResumeContent;
  templateId?: string;
  theme?: Record<string, string>;
  className?: string;
  showPageBreaks?: boolean;
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
  "global-corporate": {
    accent: "text-slate-800",
    heading: "text-slate-900 border-slate-300",
    header: "text-left border-b-2 border-slate-300",
    layout: "classic",
  },
  "finance-forward": {
    accent: "text-blue-800",
    heading: "text-blue-900 border-blue-200",
    header: "text-left border-b border-blue-200",
    layout: "compact",
  },
  "consulting-elite": {
    accent: "text-indigo-800",
    heading: "text-indigo-900 border-indigo-200",
    header: "text-left border-b-2 border-indigo-700",
    layout: "classic",
  },
  "product-strategy": {
    accent: "text-teal-800",
    heading: "text-teal-900 border-teal-200",
    header: "text-left border-b border-teal-200",
    layout: "sidebar",
  },
  "data-analytics": {
    accent: "text-cyan-800",
    heading: "text-cyan-900 border-cyan-200",
    header: "text-left border-b border-cyan-200",
    layout: "sidebar",
  },
  "sales-growth": {
    accent: "text-amber-800",
    heading: "text-amber-900 border-amber-200",
    header: "text-left bg-amber-950 text-white -m-8 mb-5 p-8",
    layout: "bold",
  },
  "customer-success": {
    accent: "text-emerald-800",
    heading: "text-emerald-900 border-emerald-200",
    header: "text-left border-b-2 border-emerald-700",
    layout: "classic",
  },
  "remote-global": {
    accent: "text-violet-800",
    heading: "text-violet-900 border-violet-200",
    header: "text-left border-b border-violet-200",
    layout: "compact",
  },
  "legal-counsel": {
    accent: "text-zinc-800",
    heading: "text-zinc-900 border-zinc-300",
    header: "text-center border-b-2 border-zinc-700",
    layout: "classic",
  },
  "healthcare-operations": {
    accent: "text-teal-700",
    heading: "text-teal-900 border-teal-200",
    header: "text-left border-b border-teal-200",
    layout: "classic",
  },
  "public-sector": {
    accent: "text-green-800",
    heading: "text-green-900 border-green-200",
    header: "text-left border-b border-green-200",
    layout: "compact",
  },
  "humanitarian-program": {
    accent: "text-rose-800",
    heading: "text-rose-900 border-rose-200",
    header: "text-left border-b border-rose-200",
    layout: "sidebar",
  },
  "communications-director": {
    accent: "text-pink-800",
    heading: "text-pink-900 border-pink-200",
    header: "text-left bg-pink-950 text-white -m-8 mb-5 p-8",
    layout: "bold",
  },
  "engineering-architecture": {
    accent: "text-sky-800",
    heading: "text-sky-900 border-sky-200",
    header: "text-left border-b-2 border-sky-700",
    layout: "sidebar",
  },
  "cloud-platform": {
    accent: "text-blue-900",
    heading: "text-blue-950 border-blue-200",
    header: "text-left border-b border-blue-200",
    layout: "classic",
  },
  "venture-capital": {
    accent: "text-amber-900",
    heading: "text-amber-950 border-amber-300",
    header: "text-left bg-amber-950 text-white -m-8 mb-5 p-8",
    layout: "bold",
  },
  "operations-precision": {
    accent: "text-gray-800",
    heading: "text-gray-900 border-gray-300",
    header: "text-left border-b border-gray-300",
    layout: "compact",
  },
  "nonprofit-impact": {
    accent: "text-emerald-900",
    heading: "text-emerald-950 border-emerald-200",
    header: "text-left border-b-2 border-emerald-700",
    layout: "classic",
  },
  "recruiter-friendly": {
    accent: "text-orange-800",
    heading: "text-orange-900 border-orange-200",
    header: "text-left border-b border-orange-200",
    layout: "sidebar",
  },
  "sustainability-lead": {
    accent: "text-lime-800",
    heading: "text-lime-900 border-lime-200",
    header: "text-left border-b border-lime-200",
    layout: "classic",
  },
};

const formatList = (items: string[]) => items.filter(Boolean).join(" - ");

export function ResumePreview({ content, templateId = "modern-ats", theme, className, showPageBreaks = false }: Props) {
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

  // A4 page dimensions at 96 DPI
  const pageWidth = 794;

  // Multi-page mode: show full content with page break indicators overlaid
  if (showPageBreaks) {
    return (
      <div
        className={cn("shadow-lg rounded-lg text-sm leading-relaxed", className)}
        style={{ 
          backgroundColor: "#e5e7eb", 
          color: bodyColor, 
          fontFamily,
          maxWidth: `${pageWidth}px`,
          margin: "0 auto",
          padding: "20px",
        }}
      >
        {/* Single tall container with content, page breaks overlaid */}
        <div className="relative bg-white" style={{ position: "relative" }}>
          {/* Page break overlay */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Page 1 break at ~1123px */}
            <div className="absolute left-0 right-0" style={{ top: "1123px" }}>
              <div className="h-0.5 border-b-2 border-dashed border-red-300 bg-red-50/30 relative">
                <span className="absolute -top-5 left-2 text-[10px] text-red-400 bg-red-50 px-2 py-0.5 rounded">
                  Page 1 ends here
                </span>
              </div>
            </div>
            {/* Page 2 break at ~2246px */}
            <div className="absolute left-0 right-0" style={{ top: "2246px" }}>
              <div className="h-0.5 border-b-2 border-dashed border-red-300 bg-red-50/30 relative">
                <span className="absolute -top-5 left-2 text-[10px] text-red-400 bg-red-50 px-2 py-0.5 rounded">
                  Page 2 ends here
                </span>
              </div>
            </div>
          </div>

          {/* Actual content */}
          <div className="p-[40px]">
            <div className={cn("pb-4 mb-4 flex flex-col gap-3", style.header)}>
              {personalInfo.profilePhoto && (
                <div className={cn(
                  "flex",
                  personalInfo.profilePhotoAlignment === "left" ? "justify-start" :
                  personalInfo.profilePhotoAlignment === "right" ? "justify-end" : "justify-center"
                )}>
                  <img
                    src={personalInfo.profilePhoto}
                    alt={personalInfo.fullName || "Owner profile"}
                    className={cn(
                      "rounded-full object-cover border-2 border-white shadow",
                      personalInfo.profilePhotoSize === "large" ? "h-32 w-32" :
                      personalInfo.profilePhotoSize === "small" ? "h-16 w-16" : "h-24 w-24"
                    )}
                  />
                </div>
              )}
              <div className={cn(
                personalInfo.profilePhotoAlignment === "left" ? "text-left" :
                personalInfo.profilePhotoAlignment === "right" ? "text-right" : "text-center"
              )}>
                <h1 className={cn("text-2xl font-bold", style.layout === "bold" ? "text-white" : "")}
                  style={style.layout === "bold" ? undefined : { color: headingColor }}>
                  {personalInfo.fullName || "Your Name"}
                </h1>
                <p className={cn("mt-1 text-xs", style.layout === "bold" ? "text-violet-100" : "")}
                  style={style.layout === "bold" ? undefined : { color: bodyColor }}>
                  {[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(" | ")}
                </p>
                {(personalInfo.linkedin || personalInfo.portfolio || personalInfo.github || personalInfo.website) && (
                  <p className={cn("text-xs mt-1", style.layout === "bold" ? "text-violet-100" : "")}
                    style={{ color: accentColor }}>
                    {[personalInfo.linkedin, personalInfo.portfolio, personalInfo.github, personalInfo.website]
                      .filter(Boolean).join(" | ")}
                  </p>
                )}
              </div>
            </div>

            <div className={cn(isSidebar && "grid grid-cols-[0.9fr_1.5fr] gap-6")}>
              {isSidebar && <aside>{sidebarBlocks}</aside>}
              <main className="resume-preview">
                {personalInfo.summary && (
                  <section className={`resume-section ${sectionClass}`}>
                    <SectionTitle>Professional Summary</SectionTitle>
                    <p className="text-current">{personalInfo.summary}</p>
                  </section>
                )}
                {experience.length > 0 && (
                  <section className={`resume-section ${sectionClass}`}>
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
                  <section className={`resume-section ${sectionClass}`}>
                    <SectionTitle>Education</SectionTitle>
                    {education.map((edu) => (
                      <div key={edu.id} className="mb-2">
                        <p className="font-semibold text-current">
                          {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
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
                  <section className={`resume-section ${sectionClass}`}>
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
                  <section className={`resume-section ${sectionClass}`}>
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
                  <section className={`resume-section ${sectionClass}`}>
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
                  <section className={`resume-section ${sectionClass}`}>
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
                  <section className={`resume-section ${sectionClass}`}>
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
                  <section className={`resume-section ${sectionClass}`}>
                    <SectionTitle>Interests</SectionTitle>
                    <p className="text-current">{formatList(interests)}</p>
                  </section>
                )}
                {courses.length > 0 && (
                  <section className={`resume-section ${sectionClass}`}>
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
                  <section className={`resume-section ${sectionClass}`}>
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
                  <section className={`resume-section ${sectionClass}`}>
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
        </div>

        {/* Page count info */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>
            <strong>Page breaks shown with red dashed lines.</strong> 
            Content between lines will appear on separate pages in the exported PDF.
          </p>
        </div>
      </div>
    );
  }

  // Single page mode (default preview without page breaks)
  return (
    <div
      className={cn("shadow-lg rounded-lg text-sm leading-relaxed p-8", className)}
      style={{ 
        backgroundColor, 
        color: bodyColor, 
        fontFamily,
        minHeight: "800px",
      }}
    >
            <div className={cn("pb-4 mb-4 flex flex-col gap-3", style.header, personalInfo.profilePhoto && "has-profile-photo")}>
        {personalInfo.profilePhoto && (
          <div className={cn(
            "flex",
            personalInfo.profilePhotoAlignment === "left" ? "justify-start" :
            personalInfo.profilePhotoAlignment === "right" ? "justify-end" : "justify-center"
          )}>
            <img
              src={personalInfo.profilePhoto}
              alt={personalInfo.fullName || "Owner profile"}
              className={cn(
                "rounded-full object-cover border-2 border-white shadow",
                personalInfo.profilePhotoSize === "large" ? "h-32 w-32" :
                personalInfo.profilePhotoSize === "small" ? "h-16 w-16" : "h-24 w-24"
              )}
            />
          </div>
        )}
        <div className={cn(
          personalInfo.profilePhotoAlignment === "left" ? "text-left" :
          personalInfo.profilePhotoAlignment === "right" ? "text-right" : "text-center"
        )}>
          <h1 className={cn("text-2xl font-bold", style.layout === "bold" ? "text-white" : "")}
            style={style.layout === "bold" ? undefined : { color: headingColor }}>
            {personalInfo.fullName || "Your Name"}
          </h1>
          <p className={cn("mt-1 text-xs", style.layout === "bold" ? "text-violet-100" : "")}
            style={style.layout === "bold" ? undefined : { color: bodyColor }}>
            {[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(" | ")}
          </p>
          {(personalInfo.linkedin || personalInfo.portfolio || personalInfo.github || personalInfo.website) && (
            <p className={cn("text-xs mt-1", style.layout === "bold" ? "text-violet-100" : "")}
              style={{ color: accentColor }}>
              {[personalInfo.linkedin, personalInfo.portfolio, personalInfo.github, personalInfo.website]
                .filter(Boolean).join(" | ")}
            </p>
          )}
        </div>
      </div>

      <div className={cn(isSidebar && "grid grid-cols-[0.9fr_1.5fr] gap-6")}>
        {isSidebar && <aside>{sidebarBlocks}</aside>}
        <main className="resume-preview">
          {personalInfo.summary && (
            <section className={`resume-section ${sectionClass}`}>
              <SectionTitle>Professional Summary</SectionTitle>
              <p className="text-current">{personalInfo.summary}</p>
            </section>
          )}
          {experience.length > 0 && (
            <section className={`resume-section ${sectionClass}`}>
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
            <section className={`resume-section ${sectionClass}`}>
              <SectionTitle>Education</SectionTitle>
              {education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <p className="font-semibold text-current">
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
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
            <section className={`resume-section ${sectionClass}`}>
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
            <section className={`resume-section ${sectionClass}`}>
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
            <section className={`resume-section ${sectionClass}`}>
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
            <section className={`resume-section ${sectionClass}`}>
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
            <section className={`resume-section ${sectionClass}`}>
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
            <section className={`resume-section ${sectionClass}`}>
              <SectionTitle>Interests</SectionTitle>
              <p className="text-current">{formatList(interests)}</p>
            </section>
          )}
          {courses.length > 0 && (
            <section className={`resume-section ${sectionClass}`}>
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
            <section className={`resume-section ${sectionClass}`}>
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
            <section className={`resume-section ${sectionClass}`}>
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