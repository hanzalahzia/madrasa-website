"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, queryString, uploadImage } from "@/lib/api";
import type { CrudList } from "@/lib/types";
import type { Localized } from "@/lib/i18n";
import { useApi, useDebounced, invalidateApiCache } from "@/lib/use-api";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea, CheckRow, FormField, LocalizedField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, Pagination, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/ui/feedback";

export type AdminFieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "multiselect"
  | "date"
  | "datetime"
  | "localized"
  | "localizedTextarea"
  | "tags"
  | "image"
  | "json"
  | "repeater";

export interface AdminField {
  name: string;
  label: string;
  type: AdminFieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  subfields?: AdminField[];
  addLabel?: string;
  span?: 1 | 2;
  editDisabled?: boolean;
}

type Values = Record<string, unknown>;

const emptyLocalized: Localized = { en: "", ur: "", ar: "" };

function localizedValue(value: unknown): Localized {
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    return {
      en: String(source.en || ""),
      ur: String(source.ur || ""),
      ar: String(source.ar || "")
    };
  }
  if (typeof value === "string") return { ...emptyLocalized, en: value };
  return { ...emptyLocalized };
}

function dateValue(value: unknown, withTime = false): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return withTime ? date.toISOString().slice(0, 16) : date.toISOString().slice(0, 10);
}

function initialValue(field: AdminField, row: Values | null): unknown {
  const value = row ? row[field.name] : undefined;
  if (field.type === "localized" || field.type === "localizedTextarea") return localizedValue(value);
  if (field.type === "checkbox") return Boolean(value);
  if (field.type === "date") return dateValue(value);
  if (field.type === "datetime") return dateValue(value, true);
  if (field.type === "multiselect") {
    return Array.isArray(value)
      ? value.map((entry) => (entry && typeof entry === "object" ? String((entry as Values)._id || "") : String(entry))).filter(Boolean)
      : [];
  }
  if (field.type === "tags") return Array.isArray(value) ? value.join(", ") : "";
  if (field.type === "json") return value ? JSON.stringify(value, null, 2) : "{}";
  if (field.type === "repeater") {
    const rows = Array.isArray(value) ? value : [];
    return rows.map((entry) => {
      const item = (entry || {}) as Values;
      const result: Values = {};
      for (const sub of field.subfields || []) {
        const raw = item[sub.name];
        result[sub.name] =
          sub.type === "date"
            ? dateValue(raw)
            : sub.type === "number"
              ? raw ?? ""
              : raw && typeof raw === "object"
                ? String((raw as Values)._id || "")
                : raw ?? "";
      }
      return result;
    });
  }
  return value ?? "";
}

function cleanValue(field: AdminField, value: unknown): unknown {
  switch (field.type) {
    case "localized":
    case "localizedTextarea":
      return localizedValue(value);
    case "checkbox":
      return Boolean(value);
    case "number":
      return value === "" || value === null || value === undefined ? undefined : Number(value);
    case "date":
    case "datetime":
      return value ? String(value) : undefined;
    case "tags":
      return typeof value === "string"
        ? value.split(",").map((entry) => entry.trim()).filter(Boolean)
        : [];
    case "json": {
      if (typeof value !== "string" || !value.trim()) return {};
      return JSON.parse(value);
    }
    case "repeater":
      return (Array.isArray(value) ? value : []).map((entry) => {
        const item = (entry || {}) as Values;
        const output: Values = {};
        for (const sub of field.subfields || []) {
          const raw = item[sub.name];
          if (sub.type === "number") output[sub.name] = raw === "" || raw === undefined ? 0 : Number(raw);
          else if (sub.type === "date") output[sub.name] = raw ? String(raw) : null;
          else output[sub.name] = raw ?? "";
        }
        return output;
      });
    default:
      return value;
  }
}

function RepeaterInput({
  field,
  value,
  onChange
}: {
  field: AdminField;
  value: Values[];
  onChange: (next: Values[]) => void;
}) {
  const add = () => {
    const blank: Values = {};
    for (const sub of field.subfields || []) blank[sub.name] = "";
    onChange([...value, blank]);
  };

  return (
    <div className="space-y-3">
      {value.length ? (
        value.map((row, index) => (
          <div key={index} className="rounded-xl border border-brand-950/10 bg-white/60 p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(field.subfields || []).map((sub) => (
                <div key={sub.name} className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-900">{sub.label}</span>
                  {sub.type === "select" ? (
                    <Select
                      value={String(row[sub.name] ?? "")}
                      onChange={(event) =>
                        onChange(value.map((entry, i) => (i === index ? { ...entry, [sub.name]: event.target.value } : entry)))
                      }
                    >
                      <option value="">Select…</option>
                      {(sub.options || []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      type={sub.type === "number" ? "number" : sub.type === "date" ? "date" : "text"}
                      value={String(row[sub.name] ?? "")}
                      onChange={(event) =>
                        onChange(value.map((entry, i) => (i === index ? { ...entry, [sub.name]: event.target.value } : entry)))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="rounded-xl border border-dashed border-brand-950/15 bg-white/40 px-4 py-6 text-center text-xs text-muted">
          No entries yet.
        </p>
      )}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3.5 w-3.5" /> {field.addLabel || "Add entry"}
      </Button>
    </div>
  );
}

function readOnlyValue(field: AdminField, value: unknown): string {
  if (field.type === "checkbox") return value ? "Yes" : "No";
  if (field.type === "localized" || field.type === "localizedTextarea") {
    const localized = localizedValue(value);
    return localized.en || localized.ur || localized.ar || "—";
  }
  if (field.type === "repeater") return `${Array.isArray(value) ? value.length : 0} entries`;
  if (field.type === "json") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }
  if (value === "" || value === null || value === undefined) return "—";
  return String(value);
}

function FieldInput({
  field,
  value,
  onChange,
  onUpload
}: {
  field: AdminField;
  value: unknown;
  onChange: (next: unknown) => void;
  onUpload: (file: File) => Promise<void>;
}) {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          step="any"
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "checkbox":
      return (
        <CheckRow label={field.label} hint={field.hint}>
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-900"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
        </CheckRow>
      );
    case "select":
      return (
        <Select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select…</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      );
    case "multiselect": {
      const selected = Array.isArray(value) ? value.map(String) : [];
      return (
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-brand-950/10 bg-white/60 p-2">
          {(field.options || []).length ? (
            (field.options || []).map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-brand-950/5">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-900"
                  checked={selected.includes(option.value)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...selected, option.value]
                        : selected.filter((entry) => entry !== option.value)
                    )
                  }
                />
                {option.label}
              </label>
            ))
          ) : (
            <p className="px-2 py-3 text-xs text-muted">No options available.</p>
          )}
        </div>
      );
    }
    case "date":
      return <Input type="date" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />;
    case "datetime":
      return (
        <Input type="datetime-local" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />
      );
    case "localized":
    case "localizedTextarea":
      return (
        <LocalizedField
          label={field.label}
          value={localizedValue(value)}
          multiline={field.type === "localizedTextarea"}
          required={field.required}
          hint={field.hint}
          onChange={(next) => onChange(next)}
        />
      );
    case "tags":
      return (
        <Input
          value={String(value ?? "")}
          placeholder={field.placeholder || "Comma-separated values"}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "image":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={String(value ?? "")}
              placeholder="/uploads/… or https://…"
              onChange={(event) => onChange(event.target.value)}
            />
            <label className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-brand-950/15 bg-white px-3 text-xs font-semibold text-brand-900 hover:border-brand-950/30">
              <ImagePlus className="h-4 w-4" />
              Upload
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onUpload(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={String(value)} alt="" className="h-24 w-full max-w-xs rounded-xl border border-brand-950/10 object-cover" />
          ) : null}
        </div>
      );
    case "json":
      return (
        <Textarea
          rows={6}
          value={String(value ?? "{}")}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-xs"
        />
      );
    case "repeater":
      return (
        <RepeaterInput
          field={field}
          value={Array.isArray(value) ? (value as Values[]) : []}
          onChange={(next) => onChange(next)}
        />
      );
    default:
      return (
        <Input
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}

export function ResourceManager<T>({
  endpoint,
  title,
  description,
  createLabel = "Add new",
  columns,
  fields,
  keyFor,
  defaults,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  canCreate = true,
  canDelete = true,
  updateMethod = "PUT",
  transform,
  renderActions,
  searchable = true
}: {
  endpoint: string;
  title: string;
  description?: string;
  createLabel?: string;
  columns: Column<T>[];
  fields: AdminField[];
  keyFor: (row: T) => string;
  defaults?: Values;
  emptyTitle?: string;
  emptyDescription?: string;
  canCreate?: boolean;
  canDelete?: boolean;
  updateMethod?: "PUT" | "PATCH";
  transform?: (values: Values, editing: Values | null) => Values;
  renderActions?: (row: T, reload: () => void) => React.ReactNode;
  searchable?: boolean;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [values, setValues] = useState<Values>({});
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const initialSnapshot = useRef("");
  const listPath = `${endpoint}${queryString({
    ...(searchable && debounced ? { q: debounced } : {}),
    ...(page > 1 ? { page } : {})
  })}`;
  const { data, loading, error, reload } = useApi<CrudList<T>>(listPath);
  const rows = useMemo(() => data?.items || [], [data]);
  const pagination = data?.pagination;
  const total = pagination?.total ?? rows.length;
  const dirty = open && JSON.stringify(values) !== initialSnapshot.current;

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (!searchable) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchable]);

  const openCreate = () => {
    const next: Values = {};
    for (const field of fields) next[field.name] = initialValue(field, defaults || null);
    setEditing(null);
    setValues(next);
    initialSnapshot.current = JSON.stringify(next);
    setOpen(true);
  };

  const openEdit = (row: T) => {
    const next: Values = {};
    for (const field of fields) next[field.name] = initialValue(field, row as unknown as Values);
    setEditing(row);
    setValues(next);
    initialSnapshot.current = JSON.stringify(next);
    setOpen(true);
  };

  const requestClose = () => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    setOpen(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: Values = {};
      for (const field of fields) payload[field.name] = cleanValue(field, values[field.name]);
      const finalPayload = transform ? transform(payload, editing as unknown as Values | null) : payload;
      if (editing) {
        await api(`${endpoint}/${keyFor(editing)}`, { method: updateMethod, body: finalPayload });
        toast.success(`${title} updated`);
      } else {
        await api(endpoint, { method: "POST", body: finalPayload });
        toast.success(`${title} created`);
      }
      initialSnapshot.current = JSON.stringify(values);
      setOpen(false);
      invalidateApiCache();
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`${endpoint}/${keyFor(pendingDelete)}`, { method: "DELETE" });
      toast.success(`${title} deleted`);
      setPendingDelete(null);
      invalidateApiCache();
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  };

  const tableColumns: Column<T>[] = [
    ...columns,
    {
      key: "__actions",
      label: "",
      headerClassName: "text-end",
      className: "text-end whitespace-nowrap",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {renderActions ? renderActions(row, reload) : null}
          <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-700 hover:bg-red-50"
              onClick={() => setPendingDelete(row)}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <section className="space-y-4">
      <div className="sticky top-16 z-20 rounded-2xl border border-brand-950/10 bg-ivory/90 p-4 shadow-card backdrop-blur-xl sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-semibold text-brand-950">{title}</h2>
              <span className="rounded-full border border-brand-950/10 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                {total} {total === 1 ? "record" : "records"}
              </span>
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-gold-600" /> : null}
            </div>
            {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {searchable ? (
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search…  ( / )"
                  className="h-10 w-full min-w-52 ps-9 pe-9"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition hover:bg-brand-950/5 hover:text-brand-950"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ) : null}
            <Button type="button" variant="outline" size="icon" onClick={reload} aria-label="Refresh" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            {canCreate ? (
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" /> {createLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : (
        <>
          <DataTable
            columns={tableColumns}
            rows={rows}
            keyFor={keyFor}
            loading={loading}
            empty={
              <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                action={
                  canCreate ? (
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="h-4 w-4" /> {createLabel}
                    </Button>
                  ) : undefined
                }
              />
            }
          />
          {pagination ? (
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onChange={setPage}
              label={(next) => `Page ${next} of ${pagination.pages}`}
            />
          ) : null}
        </>
      )}

      <Modal
        open={open}
        onClose={requestClose}
        title={editing ? `Edit ${title.toLowerCase()}` : `New ${title.toLowerCase()}`}
        description={description}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" form="admin-resource-form" loading={saving}>
              {editing ? "Save changes" : "Create"}
            </Button>
          </div>
        }
      >
        <form id="admin-resource-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => {
            const fullWidth =
              field.span === 2 ||
              ["localized", "localizedTextarea", "multiselect", "json", "repeater", "image"].includes(field.type);
            if (editing && field.editDisabled) {
              return (
                <FormField
                  key={field.name}
                  label={field.label}
                  hint={field.hint || "This value is locked after creation."}
                  className={fullWidth ? "md:col-span-2" : undefined}
                >
                  <div className="flex min-h-11 items-center rounded-xl border border-brand-950/10 bg-brand-950/[0.03] px-3 py-2 text-sm text-muted">
                    {readOnlyValue(field, values[field.name])}
                  </div>
                </FormField>
              );
            }
            if (field.type === "checkbox") {
              return (
                <div key={field.name} className="md:col-span-2">
                  <FieldInput
                    field={field}
                    value={values[field.name]}
                    onChange={(next) => setValues((current) => ({ ...current, [field.name]: next }))}
                    onUpload={async (file) => {
                      try {
                        const uploaded = await uploadImage(file);
                        setValues((current) => ({ ...current, [field.name]: uploaded.url }));
                        toast.success("Image uploaded");
                      } catch (caught) {
                        toast.error(errorMessage(caught));
                      }
                    }}
                  />
                </div>
              );
            }
            if (["localized", "localizedTextarea"].includes(field.type)) {
              return (
                <div key={field.name} className="md:col-span-2">
                  <FieldInput
                    field={field}
                    value={values[field.name]}
                    onChange={(next) => setValues((current) => ({ ...current, [field.name]: next }))}
                    onUpload={async () => undefined}
                  />
                </div>
              );
            }
            return (
              <FormField
                key={field.name}
                label={field.label}
                required={field.required}
                hint={field.hint}
                className={fullWidth ? "md:col-span-2" : undefined}
              >
                <FieldInput
                  field={field}
                  value={values[field.name]}
                  onChange={(next) => setValues((current) => ({ ...current, [field.name]: next }))}
                  onUpload={async (file) => {
                    try {
                      const uploaded = await uploadImage(file);
                      setValues((current) => ({ ...current, [field.name]: uploaded.url }));
                      toast.success("Image uploaded");
                    } catch (caught) {
                      toast.error(errorMessage(caught));
                    }
                  }}
                />
              </FormField>
            );
          })}
        </form>
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={`Delete ${title.toLowerCase()}?`}
        description="This action cannot be undone. The record will be permanently removed."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
            <Button type="button" variant="danger" onClick={() => void remove()} loading={deleting}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p>
            You are about to delete <strong>{pendingDelete ? keyFor(pendingDelete) : ""}</strong>. Related data may also be
            affected.
          </p>
        </div>
      </Modal>
    </section>
  );
}
