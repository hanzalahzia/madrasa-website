"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import type { PortalOverview, SchoolClass } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingPanel } from "@/components/ui/feedback";
import { FormField, Input, Select } from "@/components/ui/field";

interface AttendanceRow {
  id: string;
  name: string;
  studentId: string;
  status: string;
  recordId: string | null;
}

interface AttendanceResponse {
  class: SchoolClass;
  date: string;
  students: AttendanceRow[];
}

const statuses = ["present", "absent", "late", "leave"] as const;

export default function AttendancePage() {
  return (
    <Suspense fallback={<Section><LoadingPanel /></Section>}>
      <AttendanceView />
    </Suspense>
  );
}

function AttendanceView() {
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
  const [classId, setClassId] = useState(searchParams.get("classId") || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId && overview?.classes?.length) setClassId(overview.classes[0]._id);
  }, [classId, overview]);

  const path = classId ? `/portal/teacher/attendance?classId=${classId}&date=${date}` : null;
  const { data, loading, reload } = useApi<AttendanceResponse>(path);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = {};
    for (const student of data.students) {
      next[student.id] = student.status || "present";
    }
    setValues(next);
  }, [data]);

  const students = useMemo(() => data?.students || [], [data]);
  const summary = useMemo(() => {
    return statuses.reduce<Record<string, number>>((accumulator, status) => {
      accumulator[status] = students.filter((student) => values[student.id] === status).length;
      return accumulator;
    }, {});
  }, [students, values]);

  async function save() {
    if (!classId || !students.length) return;
    setSaving(true);
    setError(null);
    try {
      await api("/portal/teacher/attendance", {
        method: "POST",
        body: {
          classId,
          date,
          records: students.map((student) => ({ studentId: student.id, status: values[student.id] || "present" }))
        }
      });
      toast.success(t("portal.attendanceSaved"));
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
        title={t("portal.takeAttendance")}
        description={t("portal.selectClass")}
        breadcrumbs={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.portal"), href: "/portal" },
          { label: t("portal.takeAttendance") }
        ]}
        compact
      />
      <Section>
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("portal.selectClass")} htmlFor="attendance-class">
              <Select id="attendance-class" value={classId} onChange={(event) => setClassId(event.target.value)}>
                {(overview?.classes || []).map((entry) => (
                  <option key={entry._id} value={entry._id}>
                    {entry.name} {entry.section ? `· ${entry.section}` : ""}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("nav.events")} htmlFor="attendance-date">
              <Input id="attendance-date" type="date" dir="ltr" value={date} onChange={(event) => setDate(event.target.value)} />
            </FormField>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            {statuses.map((status) => (
              <span key={status} className="rounded-full bg-brand-950/5 px-2 py-1">
                {t(`status.${status}`, status)}: {summary[status] || 0}
              </span>
            ))}
          </div>
        </Card>

        <div className="mt-5">
          {!classId ? (
            <EmptyState title={t("portal.noData")} description={t("portal.selectClass")} />
          ) : loading ? (
            <LoadingPanel label={t("state.loading")} />
          ) : students.length ? (
            <>
              <div className="overflow-hidden rounded-2xl border border-brand-950/10 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-brand-950/10 bg-brand-950/[0.03] text-[10px] uppercase tracking-widest text-muted">
                        <th className="px-4 py-3 text-start">{t("form.fullName")}</th>
                        <th className="px-4 py-3 text-start">{t("portal.studentId")}</th>
                        {statuses.map((status) => (
                          <th key={status} className="px-3 py-3 text-center">
                            {t(`status.${status}`, status)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b border-brand-950/5 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-ink">{student.name}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted">{student.studentId}</td>
                          {statuses.map((status) => (
                            <td key={status} className="px-3 py-2.5 text-center">
                              <input
                                type="radio"
                                name={`attendance-${student.id}`}
                                value={status}
                                checked={(values[student.id] || "present") === status}
                                onChange={() => setValues((current) => ({ ...current, [student.id]: status }))}
                                className="h-4 w-4 accent-brand-900"
                                aria-label={`${student.name}: ${t(`status.${status}`, status)}`}
                              />
                            </td>
                          ))}
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
                  <CheckCircle2 className="h-4 w-4" /> {t("portal.saveAttendance")}
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
