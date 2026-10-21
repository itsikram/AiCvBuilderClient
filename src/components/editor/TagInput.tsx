import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface TagInputProps {
  label: ReactNode;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  hint?: ReactNode;
  max?: number;
}

/** Chips with a text box: Enter or comma adds, Backspace on an empty box removes the last one. */
export function TagInput({ label, values, onChange, placeholder, hint, max = 60 }: TagInputProps) {
  const { t } = useTranslation();
  const id = useId();
  const [draft, setDraft] = useState("");
  const clean = values.filter((v) => v.trim());

  const commit = (raw: string) => {
    const parts = raw.split(/[,\n،]/).map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return;
    const seen = new Set(clean.map((v) => v.toLowerCase()));
    const next = [...clean];
    for (const part of parts) {
      if (!seen.has(part.toLowerCase()) && next.length < max) {
        next.push(part);
        seen.add(part.toLowerCase());
      }
    }
    onChange(next);
    setDraft("");
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 rounded-lg border bg-background p-2 focus-within:ring-2 focus-within:ring-primary">
        {clean.map((value, i) => (
          <span key={`${value}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
            {value}
            <button
              type="button"
              className="-mr-1 rounded-full p-1 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() => onChange(clean.filter((_, j) => j !== i))}
              aria-label={t("editor.skills.remove", { skill: value })}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          id={id}
          className="min-w-[10rem] flex-1 bg-transparent px-1 py-1 text-base outline-none sm:text-sm"
          value={draft}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          enterKeyHint="done"
          onChange={(e) => (/[,،]/.test(e.target.value) ? commit(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && clean.length) {
              onChange(clean.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
        />
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
