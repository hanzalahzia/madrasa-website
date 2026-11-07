"use client";

import { useEffect, useState } from "react";
import { CalendarCheck2, Percent, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatNumber } from "@/lib/format";
import type { CrudList, SchoolClass } from "@/lib/types";
import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/field";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";
import { DataTable, type Column } from "@/components/ui/table";

const statuses = ["present", "absent", "late", "leave"] as const;
type AttendanceStatus = (typeof statuses)[number];

interface AttendanceRecord {
  id: string;
  name: string;
  studentId: string;
  status: string;
  recordId: string | null;
  corrections: Array<{ previousStatus?: string; newStatus?: string; reason?: string; at?: string }>;
}

interface AttendanceData {
  class: SchoolClass;
  date: string;
  students: AttendanceRecord[];
}

interface SummaryEntry {
  id: string;
  name: string;
  studentId: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
  percentage: number;
}

interface SummaryData {
  month: string;
  classId: string;
  students: SummaryEntry[];
}

const statusColors: Record<AttendanceStatus, string> = {
  present: "border-emerald-600 bg-emerald-50 text-emerald-900",
  absent: "border-red-600 bg-red-50 text-red-900",
  late: "border-amber-600 bg-amber-50 text-amber-900",
  leave: "border-sky-600 bg-sky-50 text-sky-900"
};

function todayIso(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthIso(): string {
  return todayIso().slice(0, 7);
}

export function AttendanceManager() {
  const { locale } = useLanguage();
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [statusesById, setStatusesById] = useState<Record<string, AttendanceStatus>>({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(monthIso());
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const classes = useApi<CrudList<SchoolClass>>("/admin/classes?limit=200");
  const attendance = useApi<AttendanceData>(
    classId ? `/admin/attendance?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}` : null
  );

  useEffect(() => {
    if (!attendance.data) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const student of attendance.data.students) {
      next[student.id] = (statuses.includes(student.status as AttendanceStatus)
        ? student.status
        : "present") as AttendanceStatus;
    }
    setStatusesById(next);
  }, [attendance.data]);

  const setAll = (status: AttendanceStatus) => {
    if (!attendance.data) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const student of attendance.data.students) next[student.id] = status;
    setStatusesById(next);
  };

  const save = async () => {
    if (!attendance.data) return;
    if (!attendance.data.students.length) {
      toast.error("There are no active students in this class.");
      return;
    }
    setSaving(true);
    try {
      const result = await api<{ created: number; corrected: number }>("/admin/attendance", {
        method: "POST",
        body: {
          classId,
          date,
          reason,
          records: attendance.data.students.map((student) => ({
            studentId: student.id,
            status: statusesById[student.id] || "present"
          }))
        }
      });
      toast.success(`Attendance saved (${result.created} new, ${result.corrected} corrected).`);
      setReason("");
      attendance.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const loadSummary = async () => {
    if (!classId) {
      toast.error("Select a class first.");
      return;
    }
    setSummaryLoading(true);
    try {
      const result = await api<SummaryData>(
        `/admin/attendance/summary?classId=${encodeURIComponent(classId)}&month=${encodeURIComponent(month)}`
      );
      setSummary(result);
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSummaryLoading(false);
    }
  };

  const summaryColumns: Column<SummaryEntry>[] = [
    { key: "studentId", label: "ID", render: (row) => <span className="font-mono text-xs">{row.studentId}</span> },
    { key: "name", label: "Student", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "present", label: "Present", render: (row) => row.present },
    { key: "absent", label: "Absent", render: (row) => row.absent },
    { key: "late", label: "Late", render: (row) => row.late },
    { key: "leave", label: "Leave", render: (row) => row.leave },
    { key: "total", label: "Marked", render: (row) => row.total },
    {
      key: "percentage",
      label: "Attendance",
      render: (row) => (
        <Badge tone={row.percentage >= 80 ? "success" : row.percentage >= 60 ? "warning" : "danger"}>
          {formatNumber(row.percentage, locale)}%
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Daily attendance</CardTitle>
            <CardDescription>Mark or correct attendance for an active class. Corrections are audited.</CardDescription>
          </div>
          <CalendarCheck2 className="h-5 w-5 text-brand-700" />
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_auto]">
          <FormField label="Class">
            <Select value={classId} onChange={(event) => setClassId(event.target.value)}>
              <option value="">Select a class…</option>
              {(classes.data?.items || []).map((schoolClass) => (
                <option key={schoolClass._id} value={schoolClass._id}>
                  {schoolClass.name} {schoolClass.section || ""}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Date">
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </FormField>
          <div className="flex items-end">
            <Button variant="outline" onClick={attendance.reload} className="h-11">
              <RotateCcw className="h-4 w-4" /> Reload
            </Button>
          </div>
        </div>

        {!classId ? (
          <div className="mt-4">
            <EmptyState title="Select a class" description="Choose a class and date to view the attendance sheet." />
          </div>
        ) : attendance.error ? (
          <div className="mt-4">
            <ErrorState description={attendance.error} onRetry={attendance.reload} />
          </div>
        ) : attendance.loading ? (
          <div className="mt-4">
            <LoadingPanel label="Loading attendance sheet…" />
          </div>
        ) : attendance.data ? (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-950/[0.03] px-3 py-2">
              <p className="text-xs text-muted">
                {attendance.data.students.length} active students · {formatDate(attendance.data.date, locale)}
              </p>
              <div className="flex flex-wrap gap-1">
                {statuses.map((status) => (
                  <Button key={status} type="button" variant="outline" size="sm" onClick={() => setAll(status)}>
                    All {status}
                  </Button>
                ))}
              </div>
            </div>

            {attendance.data.students.length ? (
              <div className="overflow-x-auto rounded-2xl border border-brand-950/10 bg-white">
                <table className="w-full min-w-[680px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-brand-950/10 bg-brand-950/[0.03] text-[11px] uppercase tracking-wider text-muted">
                      <th className="px-4 py-3 text-start font-semibold">Student</th>
                      <th className="px-4 py-3 text-start font-semibold">Status</th>
                      <th className="px-4 py-3 text-start font-semibold">Existing record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.data.students.map((student) => (
                      <tr key={student.id} className="border-b border-brand-950/5 last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium text-brand-950">{student.name}</p>
                          <p className="font-mono text-[11px] text-muted">{student.studentId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {statuses.map((status) => {
                              const active = statusesById[student.id] === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => setStatusesById((current) => ({ ...current, [student.id]: status }))}
                                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                                    active ? statusColors[status] : "border-brand-950/15 bg-white text-muted hover:bg-brand-950/5"
                                  }`}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {student.recordId ? (
                            <>
                              Marked {student.status}
                              {student.corrections.length ? ` · ${student.corrections.length} correction(s)` : ""}
                            </>
                          ) : (
                            "Not marked"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No active students" description="This class has no active students to mark." />
            )}

            <div className="flex flex-wrap items-end gap-3">
              <FormField label="Correction reason" hint="Required when changing an existing record." className="min-w-64 flex-1">
                <Input value={reason} onChange={(event) => setReason(event.target.value)} />
              </FormField>
              <Button onClick={() => void save()} loading={saving} disabled={!attendance.data.students.length}>
                Save attendance
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Monthly summary</CardTitle>
            <CardDescription>Attendance percentage per student for the selected class.</CardDescription>
          </div>
          <Percent className="h-5 w-5 text-brand-700" />
        </CardHeader>
        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Month">
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </FormField>
          <Button variant="outline" onClick={() => void loadSummary()} loading={summaryLoading} className="h-11">
            Load summary
          </Button>
        </div>
        {summary ? (
          <div className="mt-4">
            {summary.students.length ? (
              <DataTable
                columns={summaryColumns}
                rows={summary.students}
                keyFor={(row) => row.id}
                empty={<EmptyState title="No records" />}
              />
            ) : (
              <EmptyState title="No active students" description="This class has no active students." />
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
