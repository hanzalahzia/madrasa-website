"use client";

import { useMemo, useState } from "react";
import { Download, KeyRound, Pencil, Plus, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, queryString } from "@/lib/api";
import { useApi, useDebounced } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatStatus } from "@/lib/format";
import type { AcademicSession, CrudList, Program, SchoolClass, Student } from "@/lib/types";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, Pagination, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/ui/feedback";

const statusOptions = ["active", "inactive", "transferred", "graduated"] as const;
const statusTones: Record<string, "success" | "neutral" | "warning" | "info"> = {
  active: "success",
  inactive: "neutral",
  transferred: "info",
  graduated: "warning"
};

interface StudentForm {
  name: string;
  dob: string;
  gender: string;
  address: string;
  previousEducation: string;
  guardianName: string;
  relationship: string;
  phone: string;
  email: string;
  program: string;
  class: string;
  session: string;
  status: string;
}

const blankForm: StudentForm = {
  name: "",
  dob: "",
  gender: "",
  address: "",
  previousEducation: "",
  guardianName: "",
  relationship: "",
  phone: "",
  email: "",
  program: "",
  class: "",
  session: "",
  status: "active"
};

function idOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "object") return String((value as { _id?: string })._id || "");
  return String(value);
}

export default function AdminStudentsPage() {
  const { locale, localized } = useLanguage();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const [editing, setEditing] = useState<Student | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<StudentForm>(blankForm);
  const [saving, setSaving] = useState(false);
  const [accountFor, setAccountFor] = useState<{ student: Student; type: "student" | "guardian" } | null>(null);
  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [accountSaving, setAccountSaving] = useState(false);

  const path = `/admin/students${queryString({ search: debounced, status, page, limit: 20 })}`;
  const { data, error, loading, reload } = useApi<CrudList<Student>>(path);
  const programs = useApi<CrudList<Program>>("/admin/programs?limit=200");
  const classes = useApi<CrudList<SchoolClass>>("/admin/classes?limit=200");
  const sessions = useApi<CrudList<AcademicSession>>("/admin/sessions?limit=200");

  const rows = useMemo(() => data?.items || [], [data]);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setFormOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setForm({
      name: student.name,
      dob: student.dob ? student.dob.slice(0, 10) : "",
      gender: student.gender || "",
      address: student.address || "",
      previousEducation: student.previousEducation || "",
      guardianName: student.guardian?.name || "",
      relationship: student.guardian?.relationship || "",
      phone: student.guardian?.phone || "",
      email: student.guardian?.email || "",
      program: idOf(student.program),
      class: idOf(student.class),
      session: idOf(student.session),
      status: student.status || "active"
    });
    setFormOpen(true);
  };

  const update = (key: keyof StudentForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        dob: form.dob || null,
        gender: form.gender,
        address: form.address,
        previousEducation: form.previousEducation,
        guardian: {
          name: form.guardianName,
          relationship: form.relationship,
          phone: form.phone,
          email: form.email
        },
        program: form.program || null,
        class: form.class || null,
        session: form.session || null,
        status: form.status
      };
      if (editing) {
        await api(`/admin/students/${editing._id}`, { method: "PUT", body: payload });
        toast.success("Student updated");
      } else {
        await api("/admin/students", { method: "POST", body: payload });
        toast.success("Student created");
      }
      setFormOpen(false);
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const openAccount = (student: Student, type: "student" | "guardian") => {
    setAccountFor({ student, type });
    setAccount({
      name: type === "student" ? student.name : student.guardian?.name || "",
      email: "",
      password: ""
    });
  };

  const submitAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountFor) return;
    setAccountSaving(true);
    try {
      const path =
        accountFor.type === "student"
          ? `/admin/students/${accountFor.student._id}/account`
          : `/admin/students/${accountFor.student._id}/guardian-account`;
      await api(path, { method: "POST", body: account });
      toast.success(`${accountFor.type === "student" ? "Student" : "Guardian"} portal account created`);
      setAccountFor(null);
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setAccountSaving(false);
    }
  };

  const columns: Column<Student>[] = [
    {
      key: "studentId",
      label: "ID",
      render: (student) => <span className="font-mono text-xs font-medium text-brand-800">{student.studentId}</span>
    },
    {
      key: "name",
      label: "Student",
      render: (student) => (
        <div>
          <p className="font-medium text-brand-950">{student.name}</p>
          <p className="text-xs text-muted">
            {student.guardian?.name || "No guardian"} {student.guardian?.phone ? `· ${student.guardian.phone}` : ""}
          </p>
        </div>
      )
    },
    {
      key: "program",
      label: "Program",
      render: (student) => (
        <span className="text-sm">
          {student.program && typeof student.program === "object"
            ? localized(student.program.title) || "—"
            : "—"}
        </span>
      )
    },
    {
      key: "class",
      label: "Class",
      render: (student) =>
        student.class && typeof student.class === "object"
          ? `${student.class.name || ""} ${student.class.section || ""}`.trim() || "—"
          : "—"
    },
    {
      key: "status",
      label: "Status",
      render: (student) => (
        <Badge tone={statusTones[student.status] || "neutral"}>{formatStatus(student.status, locale)}</Badge>
      )
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (student) => <span className="text-xs text-muted">{formatDate(student.createdAt, locale)}</span>
    },
    {
      key: "accounts",
      label: "Portal",
      render: (student) => (
        <div className="flex flex-wrap gap-1">
          {student.user ? (
            <Badge tone="success">Student</Badge>
          ) : (
            <button
              type="button"
              onClick={() => openAccount(student, "student")}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand-950/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted hover:border-brand-950/40 hover:text-brand-950"
            >
              <UserPlus className="h-3 w-3" /> Student
            </button>
          )}
          <button
            type="button"
            onClick={() => openAccount(student, "guardian")}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand-950/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted hover:border-brand-950/40 hover:text-brand-950"
          >
            <UserPlus className="h-3 w-3" /> Guardian
          </button>
        </div>
      )
    },
    {
      key: "actions",
      label: "",
      className: "text-end",
      headerClassName: "text-end",
      render: (student) => (
        <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(student)} aria-label="Edit student">
          <Pencil className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">People</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Students</h1>
          <p className="mt-1 text-sm text-muted">Enrolled students, guardians, placement and portal access.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/students/export.csv"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-brand-950/15 bg-white px-4 text-xs font-semibold text-brand-950 hover:border-brand-950/30"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add student
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, ID or guardian…"
              className="ps-9"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {formatStatus(option, locale)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            keyFor={(student) => student._id}
            loading={loading}
            empty={
              <EmptyState
                title="No students found"
                description="Adjust your filters or add the first student record."
                action={
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Add student
                  </Button>
                }
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
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit student" : "Add student"}
        description={editing ? editing.studentId : "Create an admission record and place the student in a class."}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="student-form" loading={saving}>
              Save student
            </Button>
          </div>
        }
      >
        <form id="student-form" onSubmit={submit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Full name" required>
              <Input value={form.name} onChange={(event) => update("name", event.target.value)} required />
            </FormField>
            <FormField label="Date of birth">
              <Input type="date" value={form.dob} onChange={(event) => update("dob", event.target.value)} />
            </FormField>
            <FormField label="Gender">
              <Select value={form.gender} onChange={(event) => update("gender", event.target.value)}>
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={(event) => update("status", event.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatStatus(option, locale)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Home address" className="md:col-span-2">
              <Textarea rows={2} value={form.address} onChange={(event) => update("address", event.target.value)} />
            </FormField>
            <FormField label="Previous education" className="md:col-span-2">
              <Input
                value={form.previousEducation}
                onChange={(event) => update("previousEducation", event.target.value)}
              />
            </FormField>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-brand-950">Guardian</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <FormField label="Guardian name">
                <Input value={form.guardianName} onChange={(event) => update("guardianName", event.target.value)} />
              </FormField>
              <FormField label="Relationship">
                <Input value={form.relationship} onChange={(event) => update("relationship", event.target.value)} />
              </FormField>
              <FormField label="Phone">
                <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-brand-950">Placement</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <FormField label="Program">
                <Select value={form.program} onChange={(event) => update("program", event.target.value)}>
                  <option value="">Not assigned</option>
                  {(programs.data?.items || []).map((program) => (
                    <option key={program._id} value={program._id}>
                      {localized(program.title) || program.slug}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Class">
                <Select value={form.class} onChange={(event) => update("class", event.target.value)}>
                  <option value="">Not assigned</option>
                  {(classes.data?.items || []).map((schoolClass) => (
                    <option key={schoolClass._id} value={schoolClass._id}>
                      {schoolClass.name} {schoolClass.section || ""}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Session">
                <Select value={form.session} onChange={(event) => update("session", event.target.value)}>
                  <option value="">Not assigned</option>
                  {(sessions.data?.items || []).map((session) => (
                    <option key={session._id} value={session._id}>
                      {session.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(accountFor)}
        onClose={() => setAccountFor(null)}
        title={accountFor?.type === "guardian" ? "Create guardian portal account" : "Create student portal account"}
        description={accountFor?.student.name}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAccountFor(null)}>
              Cancel
            </Button>
            <Button type="submit" form="account-form" loading={accountSaving}>
              Create account
            </Button>
          </div>
        }
      >
        <form id="account-form" onSubmit={submitAccount} className="space-y-4">
          <FormField label="Display name">
            <Input value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} />
          </FormField>
          <FormField label="Email" required>
            <Input
              type="email"
              value={account.email}
              onChange={(event) => setAccount({ ...account, email: event.target.value })}
              required
            />
          </FormField>
          <FormField label="Temporary password" required hint="Minimum 8 characters with a letter and a number.">
            <Input
              type="text"
              value={account.password}
              onChange={(event) => setAccount({ ...account, password: event.target.value })}
              required
            />
          </FormField>
          <p className="flex items-start gap-2 rounded-xl bg-gold-50 p-3 text-xs leading-relaxed text-gold-800">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
            Share these credentials securely. The user can change the password after signing in.
          </p>
        </form>
      </Modal>
    </div>
  );
}
