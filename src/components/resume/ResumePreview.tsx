import type { ResumeContent } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  content: ResumeContent;
  className?: string;
}

export function ResumePreview({ content, className }: Props) {
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
  } = content;

  return (
    <div
      className={cn(
        "bg-white text-gray-900 p-8 shadow-lg rounded-lg text-sm leading-relaxed min-h-[800px]",
        className
      )}
    >
      <div className="text-center border-b border-gray-200 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{personalInfo.fullName || "Your Name"}</h1>
        <p className="text-gray-600 mt-1 text-xs">
          {[personalInfo.email, personalInfo.phone, personalInfo.location]
            .filter(Boolean)
            .join(" | ")}
        </p>
        {(personalInfo.linkedin || personalInfo.portfolio || personalInfo.github || personalInfo.website) && (
          <p className="text-blue-600 text-xs mt-1">
            {[personalInfo.linkedin, personalInfo.portfolio, personalInfo.github, personalInfo.website]
              .filter(Boolean)
              .join(" | ")}
          </p>
        )}
      </div>

      {personalInfo.summary && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-gray-700">{personalInfo.summary}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Experience
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{exp.position}</p>
                  <p className="text-gray-600">{exp.company}</p>
                </div>
                <p className="text-gray-500 text-xs whitespace-nowrap">
                  {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                </p>
              </div>
              <ul className="mt-1 list-disc list-inside text-gray-700 space-y-0.5">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <p className="font-semibold">
                {edu.degree}
                {edu.field ? ` in ${edu.field}` : ""}
              </p>
              <p className="text-gray-600">
                {edu.institution} | {edu.startDate} – {edu.endDate}
              </p>
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Skills
          </h2>
          <p className="text-gray-700">{skills.join(" • ")}</p>
        </section>
      )}

      {projects.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Projects
          </h2>
          {projects.map((proj) => (
            <div key={proj.id} className="mb-2">
              <p className="font-semibold">{proj.name}</p>
              <p className="text-gray-700">{proj.description}</p>
              {proj.technologies.length > 0 && (
                <p className="text-gray-500 text-xs">{proj.technologies.join(", ")}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {languages.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Languages
          </h2>
          <p className="text-gray-700">
            {languages.map((lang) => `${lang.name} (${lang.proficiency})`).join(" • ")}
          </p>
        </section>
      )}

      {certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Certifications
          </h2>
          {certifications.map((cert) => (
            <div key={cert.id} className="mb-2">
              <p className="font-semibold">{cert.name}</p>
              <p className="text-gray-600 text-xs">
                {cert.issuer} | {cert.date}
              </p>
            </div>
          ))}
        </section>
      )}

      {awards.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Awards
          </h2>
          {awards.map((award) => (
            <div key={award.id} className="mb-2">
              <p className="font-semibold">{award.title}</p>
              <p className="text-gray-600 text-xs">
                {award.issuer} | {award.date}
              </p>
              {award.description && <p className="text-gray-700 text-xs mt-1">{award.description}</p>}
            </div>
          ))}
        </section>
      )}

      {publications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Publications
          </h2>
          {publications.map((pub) => (
            <div key={pub.id} className="mb-2">
              <p className="font-semibold">{pub.title}</p>
              <p className="text-gray-600 text-xs">
                {pub.publisher} | {pub.date}
              </p>
              {pub.description && <p className="text-gray-700 text-xs mt-1">{pub.description}</p>}
            </div>
          ))}
        </section>
      )}

      {volunteerExperience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Volunteer Experience
          </h2>
          {volunteerExperience.map((vol) => (
            <div key={vol.id} className="mb-2">
              <p className="font-semibold">{vol.role}</p>
              <p className="text-gray-600 text-xs">
                {vol.organization} | {vol.startDate} – {vol.current ? "Present" : vol.endDate}
              </p>
              {vol.description && <p className="text-gray-700 text-xs mt-1">{vol.description}</p>}
            </div>
          ))}
        </section>
      )}

      {references.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            References
          </h2>
          {references.map((ref) => (
            <div key={ref.id} className="mb-2">
              <p className="font-semibold">{ref.name}</p>
              <p className="text-gray-600 text-xs">
                {ref.position} at {ref.company}
              </p>
              <p className="text-gray-500 text-xs">
                {ref.email && `${ref.email} | `}{ref.phone}
              </p>
            </div>
          ))}
        </section>
      )}

      {interests.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Interests
          </h2>
          <p className="text-gray-700">{interests.join(" • ")}</p>
        </section>
      )}

      {courses.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Courses
          </h2>
          {courses.map((course) => (
            <div key={course.id} className="mb-2">
              <p className="font-semibold">{course.name}</p>
              <p className="text-gray-600 text-xs">
                {course.provider} | {course.date}
              </p>
            </div>
          ))}
        </section>
      )}

      {memberships.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Professional Memberships
          </h2>
          {memberships.map((mem) => (
            <div key={mem.id} className="mb-2">
              <p className="font-semibold">{mem.organization}</p>
              <p className="text-gray-600 text-xs">
                {mem.role && `${mem.role} | `}{mem.startDate} – {mem.current ? "Present" : mem.endDate}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
