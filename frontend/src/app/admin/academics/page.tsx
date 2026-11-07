"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate } from "@/lib/format";
import type {
  AcademicSession,
  CrudList,
  Exam,
  Program,
  SchoolClass,
  Subject,
  Teacher
} from "@/lib/types";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { ResourceManager, type AdminField } from "@/components/admin/resource-manager";
import { AttendanceManager } from "@/components/admin/attendance-manager";
import { ResultsManager } from "@/components/admin/results-manager";

export default function AdminAcademicsPage() {
  const { locale, localized } = useLanguage();
  const [tab, setTab] = useState("sessions");

  const programs = useApi<CrudList<Program>>("/admin/programs?limit=200");
  const sessions = useApi<CrudList<AcademicSession>>("/admin/sessions?limit=200");
  const classes = useApi<CrudList<SchoolClass>>("/admin/classes?limit=200");
  const subjects = useApi<CrudList<Subject>>("/admin/subjects?limit=200");
  const teachers = useApi<CrudList<Teacher>>("/admin/faculty?limit=200");

  const programOptions = useMemo(
    () =>
      (programs.data?.items || []).map((program) => ({
        value: program._id,
        label: localized(program.title) || program.slug
      })),
    [programs.data, localized]
  );
  const sessionOptions = useMemo(
    () => (sessions.data?.items || []).map((session) => ({ value: session._id, label: session.name })),
    [sessions.data]
  );
  const classOptions = useMemo(
    () =>
      (classes.data?.items || []).map((schoolClass) => ({
        value: schoolClass._id,
        label: `${schoolClass.name}${schoolClass.section ? ` — ${schoolClass.section}` : ""}`
      })),
    [classes.data]
  );
  const subjectOptions = useMemo(
    () =>
      (subjects.data?.items || []).map((subject) => ({
        value: subject._id,
        label: `${subject.name} (${subject.code})`
      })),
    [subjects.data]
  );
  const teacherOptions = useMemo(
    () => (teachers.data?.items || []).map((teacher) => ({ value: teacher._id, label: teacher.name })),
    [teachers.data]
  );

  const sessionFields: AdminField[] = [
    { name: "name", label: "Session name", type: "text", required: true, placeholder: "2026–27" },
    { name: "startDate", label: "Start date", type: "date", required: true },
    { name: "endDate", label: "End date", type: "date", required: true },
    {
      name: "isActive",
      label: "Current session",
      type: "checkbox",
      hint: "Activating this session deactivates the others."
    }
  ];

  const classFields: AdminField[] = [
    { name: "name", label: "Class name", type: "text", required: true },
    { name: "section", label: "Section", type: "text" },
    { name: "program", label: "Program", type: "select", required: true, options: programOptions },
    { name: "session", label: "Session", type: "select", required: true, options: sessionOptions },
    { name: "teacher", label: "Class teacher", type: "select", options: teacherOptions },
    { name: "capacity", label: "Capacity", type: "number" }
  ];

  const subjectFields: AdminField[] = [
    { name: "name", label: "Subject name", type: "text", required: true },
    { name: "code", label: "Code", type: "text", required: true },
    { name: "program", label: "Program", type: "select", options: programOptions },
    { name: "classes", label: "Classes", type: "multiselect", options: classOptions },
    { name: "published", label: "Published", type: "checkbox" }
  ];

  const examFields: AdminField[] = [
    { name: "title", label: "Exam title", type: "text", required: true, span: 2 },
    { name: "program", label: "Program", type: "select", options: programOptions },
    { name: "class", label: "Class", type: "select", options: classOptions },
    { name: "session", label: "Session", type: "select", options: sessionOptions },
    { name: "startDate", label: "Start date", type: "datetime", required: true },
    {
      name: "subjects",
      label: "Exam subjects",
      type: "repeater",
      addLabel: "Add subject",
      subfields: [
        { name: "subject", label: "Subject", type: "select", required: true, options: subjectOptions },
        { name: "maxMarks", label: "Maximum marks", type: "number", required: true },
        { name: "passMarks", label: "Pass marks", type: "number", required: true }
      ]
    },
    { name: "published", label: "Published", type: "checkbox" }
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">Academics</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Academic management</h1>
        <p className="mt-1 text-sm text-muted">Sessions, classes, subjects, exams, attendance and results.</p>
      </div>

      <Tabs
        tabs={[
          { value: "sessions", label: "Sessions" },
          { value: "classes", label: "Classes" },
          { value: "subjects", label: "Subjects" },
          { value: "exams", label: "Exams" },
          { value: "attendance", label: "Attendance" },
          { value: "results", label: "Results" }
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "sessions" ? (
        <ResourceManager<AcademicSession>
          endpoint="/admin/sessions"
          title="Sessions"
          description="Academic years used for classes, fees and results."
          createLabel="Add session"
          keyFor={(session) => session._id}
          fields={sessionFields}
          columns={[
            { key: "name", label: "Session", render: (session) => <span className="font-medium">{session.name}</span> },
            {
              key: "startDate",
              label: "Starts",
              render: (session) => formatDate(session.startDate, locale)
            },
            { key: "endDate", label: "Ends", render: (session) => formatDate(session.endDate, locale) },
            {
              key: "isActive",
              label: "Current",
              render: (session) =>
                session.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>
            }
          ]}
        />
      ) : null}

      {tab === "classes" ? (
        <ResourceManager<SchoolClass>
          endpoint="/admin/classes"
          title="Classes"
          description="Class groups within a program and session."
          createLabel="Add class"
          keyFor={(schoolClass) => schoolClass._id}
          fields={classFields}
          columns={[
            { key: "name", label: "Class", render: (row) => <span className="font-medium">{`${row.name} ${row.section || ""}`.trim()}</span> },
            {
              key: "program",
              label: "Program",
              render: (row) =>
                row.program && typeof row.program === "object" ? localized(row.program.title) || "—" : "—"
            },
            {
              key: "session",
              label: "Session",
              render: (row) => (row.session && typeof row.session === "object" ? row.session.name || "—" : "—")
            },
            {
              key: "teacher",
              label: "Teacher",
              render: (row) => (row.teacher && typeof row.teacher === "object" ? row.teacher.name || "—" : "—")
            },
            { key: "capacity", label: "Capacity", render: (row) => row.capacity || "—" }
          ]}
        />
      ) : null}

      {tab === "subjects" ? (
        <ResourceManager<Subject>
          endpoint="/admin/subjects"
          title="Subjects"
          description="Subjects taught and assessed in exams."
          createLabel="Add subject"
          keyFor={(subject) => subject._id}
          fields={subjectFields}
          columns={[
            { key: "name", label: "Subject", render: (subject) => <span className="font-medium">{subject.name}</span> },
            { key: "code", label: "Code", render: (subject) => <span className="font-mono text-xs">{subject.code}</span> },
            {
              key: "program",
              label: "Program",
              render: (subject) =>
                subject.program && typeof subject.program === "object" ? localized(subject.program.title) || "—" : "—"
            },
            {
              key: "published",
              label: "Published",
              render: (subject) =>
                subject.published === false ? <Badge tone="neutral">Draft</Badge> : <Badge tone="success">Published</Badge>
            }
          ]}
        />
      ) : null}

      {tab === "exams" ? (
        <ResourceManager<Exam>
          endpoint="/admin/exams"
          title="Exams"
          description="Schedule exams, define subjects and publish results."
          createLabel="Add exam"
          keyFor={(exam) => exam._id}
          fields={examFields}
          searchable={false}
          columns={[
            { key: "title", label: "Exam", render: (exam) => <span className="font-medium">{exam.title}</span> },
            {
              key: "class",
              label: "Class",
              render: (exam) => (exam.class && typeof exam.class === "object" ? exam.class.name || "—" : "—")
            },
            { key: "startDate", label: "Date", render: (exam) => formatDate(exam.startDate, locale) },
            { key: "subjects", label: "Subjects", render: (exam) => exam.subjects?.length || 0 },
            {
              key: "published",
              label: "Status",
              render: (exam) => (exam.published ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>)
            }
          ]}
          renderActions={(exam, reload) => (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={exam.published ? "Unpublish" : "Publish"}
              onClick={() => {
                void api(`/admin/exams/${exam._id}/publish`, {
                  method: "PATCH",
                  body: { published: !exam.published }
                })
                  .then(() => {
                    toast.success(exam.published ? "Exam unpublished" : "Exam published");
                    reload();
                  })
                  .catch((caught) => toast.error(errorMessage(caught)));
              }}
            >
              {exam.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        />
      ) : null}

      {tab === "attendance" ? <AttendanceManager /> : null}
      {tab === "results" ? <ResultsManager /> : null}

      {tab === "sessions" && !sessions.loading && !sessionOptions.length ? (
        <p className="text-xs text-muted">Create a session first so classes and exams can reference it.</p>
      ) : null}
    </div>
  );
}
