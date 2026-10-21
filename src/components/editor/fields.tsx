import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-base sm:text-sm placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";

interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: (id: string, describedBy?: string) => ReactNode;
}

/** Label + control + hint, wired up with ids for screen readers. */
function FieldShell({ label, hint, className, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children(id, hintId)}
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: ReactNode;
  value: string | undefined;
  onChange: (value: string) => void;
  hint?: ReactNode;
};

export function TextField({ label, value, onChange, hint, className, ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} className={className}>
      {(id, describedBy) => (
        <input id={id} aria-describedby={describedBy} className={cn(inputClass, "h-11 sm:h-10")} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...props} />
      )}
    </FieldShell>
  );
}

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  label: ReactNode;
  value: string | undefined;
  onChange: (value: string) => void;
  hint?: ReactNode;
  /** Extra controls under the label (e.g. an AI button) */
  actions?: ReactNode;
};

export function TextAreaField({ label, value, onChange, hint, className, actions, rows = 4, ...props }: TextAreaProps) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      className={className}
    >
      {(id, describedBy) => (
        <>
          <textarea id={id} aria-describedby={describedBy} rows={rows} className={cn(inputClass, "min-h-[88px] resize-y leading-relaxed")} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...props} />
          {actions && <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div>}
        </>
      )}
    </FieldShell>
  );
}

interface SelectFieldProps {
  label: ReactNode;
  value: string | undefined;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: ReactNode;
  className?: string;
}

export function SelectField({ label, value, onChange, options, hint, className }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint} className={className}>
      {(id, describedBy) => (
        <select id={id} aria-describedby={describedBy} className={cn(inputClass, "h-11 sm:h-10")} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export function CheckboxField({ label, checked, onChange, className }: { label: ReactNode; checked: boolean; onChange: (checked: boolean) => void; className?: string }) {
  const id = useId();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input id={id} type="checkbox" className="h-5 w-5 rounded border-border accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
    </div>
  );
}

/** A titled block of the editor form. */
export function EditorSection({
  title,
  hint,
  actions,
  children,
  id,
}: {
  title: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const headingId = useId();
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-24 rounded-xl border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-semibold">
            {title}
          </h2>
          {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export const Grid = ({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) => (
  <div className={cn("grid gap-3", cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>{children}</div>
);
