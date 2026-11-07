import * as React from "react";
import { cn } from "@/lib/utils";
import type { Localized } from "@/lib/i18n";

const fieldBase =
  "w-full rounded-xl border border-brand-950/15 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/15 disabled:cursor-not-allowed disabled:bg-brand-950/5";

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: string | null;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wider text-brand-900">
          {label}
          {required ? <span className="ms-1 text-red-700">*</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="text-xs leading-relaxed text-muted">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, "h-11", className)} {...props} />;
  }
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(fieldBase, "min-h-24 resize-y leading-relaxed", className)} {...props} />;
  }
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(fieldBase, "h-11 pe-8", className)} {...props}>
        {children}
      </select>
    );
  }
);

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Checkbox({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-brand-950/25 text-brand-800 accent-brand-900 focus:ring-brand-700",
          className
        )}
        {...props}
      />
    );
  }
);

export function CheckRow({
  label,
  hint,
  className,
  children
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border border-brand-950/10 bg-white/60 p-3", className)}>
      <span className="mt-0.5">{children}</span>
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

export function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  error,
  required,
  hint
}: {
  label: React.ReactNode;
  value: Localized | undefined | null;
  onChange: (next: Localized) => void;
  multiline?: boolean;
  rows?: number;
  error?: string | null;
  required?: boolean;
  hint?: React.ReactNode;
}) {
  const current = value || { en: "", ur: "", ar: "" };
  const fields: Array<{ key: keyof Localized; label: string; dir: "ltr" | "rtl" }> = [
    { key: "en", label: "English", dir: "ltr" },
    { key: "ur", label: "اردو", dir: "rtl" },
    { key: "ar", label: "العربية", dir: "rtl" }
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-900">
          {label}
          {required ? <span className="ms-1 text-red-700">*</span> : null}
        </span>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <span className="block text-[11px] font-medium text-muted">{field.label}</span>
            {multiline ? (
              <textarea
                dir={field.dir}
                rows={rows}
                value={current[field.key] || ""}
                onChange={(event) => onChange({ ...current, [field.key]: event.target.value })}
                className={cn(fieldBase, "min-h-24", field.key === "en" && "text-left")}
              />
            ) : (
              <input
                dir={field.dir}
                value={current[field.key] || ""}
                onChange={(event) => onChange({ ...current, [field.key]: event.target.value })}
                className={cn(fieldBase, "h-11")}
              />
            )}
          </div>
        ))}
      </div>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
