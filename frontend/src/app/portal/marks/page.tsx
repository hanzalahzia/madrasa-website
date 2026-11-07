"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import type { Exam, PortalOverview } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingPanel } from "@/components/ui/feedback";
import { FormField, Input, Select } from "@/components/ui/field";

interface MarksStudent {
  id: string;
  name: string;
  studentId: string;
  obtainedMarks: number | null;
}

interface MarksResponse {
  exam: Exam;
  subject: { subject: { _id: string; name: string; code?: string } | string; maxMarks: number; passMarks: number };
  students: MarksStudent[];
}

export default function MarksPage() {
  return (
    <Suspense fallback={<Section><LoadingPanel /></Section>}>
      <MarksView />
    </Suspense>
  );
}

function MarksView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { data: overview } = useApi<PortalOverview>("/portal/overview");

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "teacher") router.replace("/portal");
  }, [authLoading, user, router]);
  const [examId, setExamId] = useState(searchParams.get("examId") || "");
  const [subjectId, setSubjectId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exams = useMemo(() => overview?.exams || [], [overview]);
  const selectedExam = useMemo(() => exams.find((exam) => exam._id === examId) || null, [exams, examId]);

  useEffect(() => {
    if (!examId && exams.length) setExamId(exams[0]._id);
  }, [examId, exams]);

  useEffect(() => {
    const first = selectedExam?.subjects?.[0];
    const id = first ? (typeof first.subject === "object" ? first.subject._id : first.subject) : "";
    setSubjectId(id || "");
  }, [selectedExam]);

  const path = examId && subjectId ? `/portal/teacher/exams/${examId}/marks?subjectId=${subjectId}` : null;
  const { data, loading, reload } = useApi<MarksResponse>(path);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = {};
    for (const student of data.students) {
      next[student.id] = student.obtainedMarks === null ? "" : String(student.obtainedMarks);
    }
    setValues(next);
  }, [data]);

  const students = data?.students || [];
  const maxMarks = data?.subject?.maxMarks || 100;

  async function save() {
    if (!examId || !subjectId || !students.length) return;
    const records = students.map((student) => {
      const value = values[student.id];
      return {
        studentId: student.id,
        obtainedMarks: value === "" || value === undefined ? null : Number(value)
      };
    });
    const invalid = records.find(
      (record) =>
        record.obtainedMarks !== null &&
        (Number.isNaN(record.obtainedMarks) || record.obtainedMarks < 0 || record.obtainedMarks > maxMarks)
    );
    if (invalid) {
      setError(`${t("portal.marks")}: 0 – ${maxMarks}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api("/portal/teacher/results", {
        method: "POST",
        body: { examId, subjectId, records }
      });
      toast.success(t("portal.marksSaved"));
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("state.error"));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user || user.role !== "teacher") {
    return (
      <Section>
        <LoadingPanel label={t("state.loading")} />
      </Section>
    );
  }

  return (
    <>
      <PageHero
        eyebrow={t("portal.title")}
        title={t("portal.enterMarks")}
        description={t("portal.selectExam")}
        breadcrumbs={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.portal"), href: "/portal" },
          { label: t("portal.enterMarks") }
        ]}
        compact
      />
      <Section>
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("portal.selectExam")} htmlFor="marks-exam">
              <Select
                id="marks-exam"
                value={examId}
                onChange={(event) => {
                  setExamId(event.target.value);
                  setSubjectId("");
                }}
              >
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.title}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("portal.selectSubject")} htmlFor="marks-subject">
              <Select id="marks-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                {(selectedExam?.subjects || []).map((entry) => {
                  const subject = typeof entry.subject === "object" ? entry.subject : null;
                  const id = subject?._id || String(entry.subject);
                  return (
                    <option key={id} value={id}>
                      {subject?.name || id} (max {entry.maxMarks})
                    </option>
                  );
                })}
              </Select>
            </FormField>
          </div>
          {data ? (
            <p className="mt-3 text-xs text-muted">
              {t("portal.maxMarks")}: {maxMarks} · {students.length} {t("portal.students")}
            </p>
          ) : null}
        </Card>

        <div className="mt-5">
          {!examId || !subjectId ? (
            <EmptyState title={t("portal.noData")} description={t("portal.selectExam")} />
          ) : loading ? (
            <LoadingPanel label={t("state.loading")} />
          ) : students.length ? (
            <>
              <div className="overflow-hidden rounded-2xl border border-brand-950/10 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-brand-950/10 bg-brand-950/[0.03] text-[10px] uppercase tracking-widest text-muted">
                        <th className="px-4 py-3 text-start">{t("form.fullName")}</th>
                        <th className="px-4 py-3 text-start">{t("portal.studentId")}</th>
                        <th className="px-4 py-3 text-start">{t("portal.marks")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b border-brand-950/5 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-ink">{student.name}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted">{student.studentId}</td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              min={0}
                              max={maxMarks}
                              dir="ltr"
                              value={values[student.id] ?? ""}
                              onChange={(event) => setValues((current) => ({ ...current, [student.id]: event.target.value }))}
                              className="h-9 w-28"
                              aria-label={`${student.name}: ${t("portal.marks")}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {error ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <Link href="/portal" className="text-sm font-medium text-brand-800 underline underline-offset-4">
                  {t("action.back")}
                </Link>
                <Button onClick={save} loading={saving}>
                  <Save className="h-4 w-4" /> {t("action.save")}
                </Button>
              </div>
            </>
          ) : (
            <EmptyState title={t("portal.noData")} description={t("state.emptyHint")} />
          )}
        </div>
      </Section>
    </>
  );
}
