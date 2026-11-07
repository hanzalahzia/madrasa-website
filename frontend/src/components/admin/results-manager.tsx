"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate } from "@/lib/format";
import type { CrudList, Exam } from "@/lib/types";
import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/field";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";

interface MarksStudent {
  id: string;
  name: string;
  studentId: string;
  obtainedMarks: number | null;
}

interface MarksData {
  exam: Exam;
  subject: { subject: { _id: string; name: string; code?: string } | string; maxMarks: number; passMarks: number };
  students: MarksStudent[];
}

function idOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "object") return String((value as { _id?: string })._id || "");
  return String(value);
}

function labelOf(value: unknown): string {
  if (!value) return "Subject";
  if (typeof value === "object") {
    const subject = value as { name?: string; code?: string };
    return `${subject.name || "Subject"}${subject.code ? ` (${subject.code})` : ""}`;
  }
  return "Subject";
}

export function ResultsManager() {
  const { locale } = useLanguage();
  const exams = useApi<CrudList<Exam>>("/admin/exams");
  const [examId, setExamId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selectedExam = useMemo(
    () => (exams.data?.items || []).find((exam) => exam._id === examId) || null,
    [exams.data, examId]
  );

  useEffect(() => {
    if (!selectedExam) {
      setSubjectId("");
      return;
    }
    setSubjectId(idOf(selectedExam.subjects[0]?.subject) || "");
  }, [selectedExam]);

  const marksData = useApi<MarksData>(
    examId && subjectId
      ? `/admin/exams/${examId}/marks?subjectId=${encodeURIComponent(subjectId)}`
      : null
  );

  useEffect(() => {
    if (!marksData.data) return;
    const next: Record<string, string> = {};
    for (const student of marksData.data.students) {
      next[student.id] = student.obtainedMarks === null ? "" : String(student.obtainedMarks);
    }
    setMarks(next);
  }, [marksData.data]);

  const save = async () => {
    if (!marksData.data) return;
    const max = marksData.data.subject.maxMarks;
    const records: Array<{ studentId: string; obtainedMarks: number }> = [];
    for (const student of marksData.data.students) {
      const raw = marks[student.id];
      if (raw === undefined || raw.trim() === "") continue;
      const value = Number(raw);
      if (Number.isNaN(value) || value < 0 || value > max) {
        toast.error(`Marks for ${student.name} must be between 0 and ${max}.`);
        return;
      }
      records.push({ studentId: student.id, obtainedMarks: value });
    }
    if (!records.length) {
      toast.error("Enter marks for at least one student.");
      return;
    }
    setSaving(true);
    try {
      const result = await api<{ created: number; updated: number }>("/admin/results/bulk", {
        method: "POST",
        body: { examId, subjectId, records }
      });
      toast.success(`Marks saved (${result.created} new, ${result.updated} updated).`);
      marksData.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Enter results</CardTitle>
          <CardDescription>Select an exam and subject, then record marks for each active student.</CardDescription>
        </div>
        <ClipboardCheck className="h-5 w-5 text-brand-700" />
      </CardHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Exam">
          <Select
            value={examId}
            onChange={(event) => {
              setExamId(event.target.value);
              setMarks({});
            }}
          >
            <option value="">Select an exam…</option>
            {(exams.data?.items || []).map((exam) => (
              <option key={exam._id} value={exam._id}>
                {exam.title} · {formatDate(exam.startDate, locale)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Subject">
          <Select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!selectedExam}>
            <option value="">Select a subject…</option>
            {(selectedExam?.subjects || []).map((entry) => (
              <option key={idOf(entry.subject)} value={idOf(entry.subject)}>
                {labelOf(entry.subject)} · max {entry.maxMarks}
              </option>
            ))}
          </Select>
        </FormField>
        {marksData.data ? (
          <div className="flex items-end">
            <div className="rounded-xl bg-gold-50 px-3 py-2 text-xs text-gold-800">
              Max {marksData.data.subject.maxMarks} · Pass {marksData.data.subject.passMarks}
              {marksData.data.exam.published ? " · Published" : " · Draft"}
            </div>
          </div>
        ) : null}
      </div>

      {exams.loading ? (
        <div className="mt-5">
          <LoadingPanel label="Loading exams…" />
        </div>
      ) : !(exams.data?.items || []).length ? (
        <div className="mt-5">
          <EmptyState title="No exams" description="Create an exam in the Exams tab before entering marks." />
        </div>
      ) : !examId || !subjectId ? (
        <div className="mt-5">
          <EmptyState title="Choose an exam and subject" description="Marks entry will appear here." />
        </div>
      ) : marksData.error ? (
        <div className="mt-5">
          <ErrorState description={marksData.error} onRetry={marksData.reload} />
        </div>
      ) : marksData.loading ? (
        <div className="mt-5">
          <LoadingPanel label="Loading student marks…" />
        </div>
      ) : marksData.data ? (
        <div className="mt-5 space-y-4">
          {marksData.data.exam.published ? (
            <Badge tone="success">This exam is published — changes update student results immediately.</Badge>
          ) : null}
          {marksData.data.students.length ? (
            <div className="overflow-x-auto rounded-2xl border border-brand-950/10 bg-white">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-brand-950/10 bg-brand-950/[0.03] text-[11px] uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 text-start font-semibold">Student</th>
                    <th className="px-4 py-3 text-start font-semibold">Existing</th>
                    <th className="px-4 py-3 text-start font-semibold">Marks / {marksData.data.subject.maxMarks}</th>
                  </tr>
                </thead>
                <tbody>
                  {marksData.data.students.map((student) => (
                    <tr key={student.id} className="border-b border-brand-950/5 last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-brand-950">{student.name}</p>
                        <p className="font-mono text-[11px] text-muted">{student.studentId}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {student.obtainedMarks === null ? "Not entered" : student.obtainedMarks}
                      </td>
                      <td className="px-4 py-2.5">
                        <Input
                          type="number"
                          min={0}
                          max={marksData.data!.subject.maxMarks}
                          value={marks[student.id] ?? ""}
                          onChange={(event) => setMarks((current) => ({ ...current, [student.id]: event.target.value }))}
                          className="h-9 w-28"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No students" description="No active students match this exam's class or program." />
          )}
          <div className="flex justify-end">
            <Button onClick={() => void save()} loading={saving} disabled={!marksData.data.students.length}>
              <Save className="h-4 w-4" /> Save marks
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
