"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Eye, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, queryString } from "@/lib/api";
import { useApi, useDebounced } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatStatus } from "@/lib/format";
import type { Admission, CrudList } from "@/lib/types";
import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { DataTable, Pagination, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/ui/feedback";

const statuses = ["submitted", "under_review", "additional_information_required", "approved", "rejected"] as const;
const statusTones: Record<string, "success" | "neutral" | "warning" | "danger" | "info" | "gold"> = {
  submitted: "info",
  under_review: "warning",
  additional_information_required: "gold",
  approved: "success",
  rejected: "danger"
};

export default function AdminAdmissionsPage() {
  const { locale, localized } = useLanguage();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const [selected, setSelected] = useState<Admission | null>(null);
  const [review, setReview] = useState({ status: "under_review", note: "", reviewNotes: "" });
  const [saving, setSaving] = useState(false);

  const path = `/admin/admissions${queryString({ search: debounced, status, page, limit: 20 })}`;
  const { data, error, loading, reload } = useApi<CrudList<Admission>>(path);
  const rows = useMemo(() => data?.items || [], [data]);

  const openDetail = (admission: Admission) => {
    setSelected(admission);
    setReview({
      status: admission.status,
      note: "",
      reviewNotes: admission.reviewNotes || ""
    });
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await api(`/admin/admissions/${selected._id}/status`, {
        method: "PATCH",
        body: {
          status: review.status,
          note: review.note || "Status updated by administrator.",
          reviewNotes: review.reviewNotes
        }
      });
      toast.success(review.status === "approved" ? "Application approved and student record created" : "Application updated");
      setSelected(null);
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await api<{ student?: { studentId?: string }; alreadyLinked?: boolean }>(
        `/admin/admissions/${selected._id}/approve`,
        { method: "POST", body: { note: review.note || "Application approved by administrator." } }
      );
      toast.success(
        result.student?.studentId
          ? `Approved. Student ID ${result.student.studentId} created.`
          : "Application approved."
      );
      setSelected(null);
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Admission>[] = [
    {
      key: "reference",
      label: "Reference",
      render: (admission) => <span className="font-mono text-xs font-medium text-brand-800">{admission.reference}</span>
    },
    {
      key: "studentName",
      label: "Applicant",
      render: (admission) => (
        <div>
          <p className="font-medium text-brand-950">{admission.studentName}</p>
          <p className="text-xs text-muted">
            {admission.guardianName} · {admission.phone}
          </p>
        </div>
      )
    },
    {
      key: "program",
      label: "Program",
      render: (admission) =>
        admission.program && typeof admission.program === "object"
          ? localized(admission.program.title) || "—"
          : "—"
    },
    {
      key: "session",
      label: "Session",
      render: (admission) =>
        admission.session && typeof admission.session === "object" ? admission.session.name || "—" : "—"
    },
    {
      key: "createdAt",
      label: "Applied",
      render: (admission) => <span className="text-xs text-muted">{formatDate(admission.createdAt, locale)}</span>
    },
    {
      key: "status",
      label: "Status",
      render: (admission) => (
        <Badge tone={statusTones[admission.status] || "neutral"}>{formatStatus(admission.status, locale)}</Badge>
      )
    },
    {
      key: "actions",
      label: "",
      className: "text-end",
      headerClassName: "text-end",
      render: (admission) => (
        <Button type="button" variant="ghost" size="sm" onClick={() => openDetail(admission)}>
          <Eye className="h-4 w-4" /> View
        </Button>
      )
    }
  ];

  const selectedProgram =
    selected?.program && typeof selected.program === "object" ? localized(selected.program.title) : "—";
  const selectedSession =
    selected?.session && typeof selected.session === "object" ? selected.session.name : "—";
  const locked = selected?.status === "approved" || selected?.status === "rejected";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">Admissions</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Applications</h1>
        <p className="mt-1 text-sm text-muted">Review applications, download documents and enrol approved students.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[{ value: "", label: "All" }, ...statuses.map((value) => ({ value, label: formatStatus(value, locale) }))]}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search reference, name or phone…"
            className="w-72 ps-9"
          />
        </div>
      </div>

      {error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            keyFor={(admission) => admission._id}
            loading={loading}
            onRowClick={openDetail}
            empty={
              <EmptyState
                title="No applications"
                description="New admissions submitted from the public site will appear here."
              />
            }
          />
          {data?.pagination ? (
            <Pagination
              page={data.pagination.page}
              pages={data.pagination.pages}
              onChange={setPage}
              label={(value) => `Page ${value} of ${data.pagination?.pages || 1}`}
            />
          ) : null}
        </>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.studentName : "Application"}
        description={selected ? `${selected.reference} · applied ${formatDate(selected.createdAt, locale)}` : undefined}
        size="lg"
        footer={
          selected ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
              {selected.status !== "approved" && selected.status !== "rejected" ? (
                <Button type="button" variant="secondary" onClick={() => void approve()} loading={saving}>
                  <CheckCircle2 className="h-4 w-4" /> Approve & enrol
                </Button>
              ) : null}
              <Button type="submit" form="review-form" loading={saving} disabled={locked}>
                Save review
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <CardDescription>Applicant</CardDescription>
                <p className="mt-1 font-semibold text-brand-950">{selected.studentName}</p>
                <p className="text-xs text-muted">
                  Born {formatDate(selected.dob, locale)} · {selected.gender || "Not specified"}
                </p>
                <p className="mt-2 text-sm text-ink">{selected.address}</p>
                {selected.previousEducation ? (
                  <p className="mt-2 text-xs text-muted">Previous education: {selected.previousEducation}</p>
                ) : null}
              </Card>
              <Card className="p-4">
                <CardDescription>Guardian</CardDescription>
                <p className="mt-1 font-semibold text-brand-950">{selected.guardianName}</p>
                <p className="text-xs text-muted">
                  {selected.relationship || "Guardian"} · {selected.phone}
                </p>
                {selected.email ? <p className="text-xs text-muted">{selected.email}</p> : null}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <span className="rounded-lg bg-brand-950/[0.03] px-2 py-1.5">
                    <span className="block text-[10px] uppercase tracking-wider text-muted">Program</span>
                    {selectedProgram}
                  </span>
                  <span className="rounded-lg bg-brand-950/[0.03] px-2 py-1.5">
                    <span className="block text-[10px] uppercase tracking-wider text-muted">Session</span>
                    {selectedSession}
                  </span>
                </div>
              </Card>
            </div>

            {selected.documents?.length ? (
              <Card className="p-4">
                <CardHeader>
                  <div>
                    <CardTitle className="text-lg">Documents</CardTitle>
                    <CardDescription>Uploaded with the application.</CardDescription>
                  </div>
                </CardHeader>
                <div className="space-y-2">
                  {selected.documents.map((document) => (
                    <a
                      key={document.filename}
                      href={`/api/admin/admissions/${selected._id}/documents/${encodeURIComponent(document.filename)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-brand-950/10 bg-white/60 px-3 py-2 text-sm hover:border-brand-950/30"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand-700" /> {document.originalName}
                      </span>
                      <span className="text-xs text-muted">Download</span>
                    </a>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card className="p-4">
              <CardHeader>
                <div>
                  <CardTitle className="text-lg">Review</CardTitle>
                  <CardDescription>
                    Current status: {formatStatus(selected.status, locale)}
                    {selected.reviewNotes ? ` · ${selected.reviewNotes}` : ""}
                  </CardDescription>
                </div>
                <Badge tone={statusTones[selected.status] || "neutral"}>{formatStatus(selected.status, locale)}</Badge>
              </CardHeader>
              <form id="review-form" onSubmit={submitReview} className="space-y-4">
                <FormField label="Set status" required>
                  <Select
                    value={review.status}
                    onChange={(event) => setReview({ ...review, status: event.target.value })}
                    disabled={locked}
                  >
                    {statuses.map((value) => (
                      <option key={value} value={value}>
                        {formatStatus(value, locale)}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Review notes" hint="Visible internally only.">
                  <Textarea
                    value={review.reviewNotes}
                    onChange={(event) => setReview({ ...review, reviewNotes: event.target.value })}
                    rows={3}
                    disabled={locked}
                  />
                </FormField>
                <FormField label="Timeline note" hint="A short note for the status history.">
                  <Input
                    value={review.note}
                    onChange={(event) => setReview({ ...review, note: event.target.value })}
                    disabled={locked}
                  />
                </FormField>
                {locked ? (
                  <p className="rounded-xl bg-brand-950/[0.03] p-3 text-xs text-muted">
                    Approved and rejected applications cannot be reopened from this screen.
                  </p>
                ) : null}
              </form>
            </Card>

            {selected.statusHistory?.length ? (
              <div>
                <h3 className="font-display text-lg font-semibold text-brand-950">History</h3>
                <ol className="mt-3 space-y-3 border-s border-brand-950/10 ps-4">
                  {[...selected.statusHistory].reverse().map((entry, index) => (
                    <li key={index} className="relative">
                      <span className="absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold-500 ring-4 ring-ivory" />
                      <p className="text-sm font-medium text-brand-950">{formatStatus(entry.status, locale)}</p>
                      <p className="text-xs text-muted">
                        {formatDate(entry.at, locale, true)} {entry.note ? `· ${entry.note}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
