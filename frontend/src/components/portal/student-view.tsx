"use client";

import { useState } from "react";
import { CalendarCheck2, CreditCard, GraduationCap, ReceiptText } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import type { Invoice, StudentPortalData } from "@/lib/types";
import { Badge, Card, StatCard } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/feedback";
import { DataTable } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const statusTone = (status: string) =>
  ["present", "paid", "approved", "active"].includes(status)
    ? "success"
    : ["late", "partial", "pending", "submitted", "under_review"].includes(status)
      ? "warning"
      : ["absent", "overdue", "rejected", "cancelled"].includes(status)
        ? "danger"
        : "neutral";

export function StudentView({ data }: { data: StudentPortalData }) {
  const { t, localized, locale } = useLanguage();
  const [tab, setTab] = useState("overview");
  const student = data.student;
  const totalAttendance = Object.values(data.attendanceSummary || {}).reduce((sum, value) => sum + value, 0);
  const presentRate = totalAttendance ? Math.round(((data.attendanceSummary.present || 0) / totalAttendance) * 100) : 0;
  const latestResult = data.results?.[0];

  const invoiceKey = (invoice: Invoice) => String((invoice as Invoice & { id?: string }).id || invoice._id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-700">{t("portal.studentId")}</p>
          <h2 className="font-display text-2xl font-semibold text-brand-950">{student.name}</h2>
          <p className="text-xs text-muted">{student.studentId}</p>
        </div>
        <Badge tone={student.status === "active" ? "success" : "neutral"}>{formatStatus(student.status, locale)}</Badge>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: t("portal.overview") },
          { value: "attendance", label: t("portal.attendance") },
          { value: "results", label: t("portal.results") },
          { value: "fees", label: t("portal.fees") }
        ]}
      />

      {tab === "overview" ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t("portal.attendance")} value={`${presentRate}%`} hint={`${data.attendanceSummary.present || 0} / ${totalAttendance}`} icon={<CalendarCheck2 className="h-5 w-5" />} tone="success" />
            <StatCard label={t("portal.grade")} value={latestResult?.grade || "—"} hint={latestResult?.title || t("portal.noData")} icon={<GraduationCap className="h-5 w-5" />} tone="gold" />
            <StatCard label={t("portal.fees")} value={formatMoney(data.fees.balance, locale)} hint={t("portal.balance")} icon={<CreditCard className="h-5 w-5" />} tone={data.fees.balance > 0 ? "warning" : "success"} />
            <StatCard label={t("portal.invoices")} value={data.invoices.length} hint={`${data.invoices.filter((invoice) => invoice.status === "paid").length} ${t("portal.paid")}`} icon={<ReceiptText className="h-5 w-5" />} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="font-display text-lg font-semibold text-brand-950">{t("portal.profileDetails")}</h3>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Detail label={t("portal.program")} value={localized(typeof student.program === "object" ? student.program?.title : undefined) || "—"} />
                <Detail label={t("portal.class")} value={typeof student.class === "object" && student.class ? `${student.class.name || ""} ${student.class.section || ""}` : "—"} />
                <Detail label={t("portal.session")} value={typeof student.session === "object" ? student.session?.name || "—" : "—"} />
                <Detail label={t("portal.dob")} value={student.dob ? formatDate(student.dob, locale) : "—"} />
                <Detail label={t("portal.guardian")} value={student.guardian?.name || "—"} />
                <Detail label={t("form.phone")} value={student.guardian?.phone || "—"} />
              </dl>
            </Card>
            <Card>
              <h3 className="font-display text-lg font-semibold text-brand-950">{t("portal.recentAttendance")}</h3>
              {data.attendance.length ? (
                <ul className="mt-3 divide-y divide-brand-950/5">
                  {data.attendance.slice(0, 6).map((record) => (
                    <li key={record.id} className="flex items-center justify-between py-2 text-sm">
                      <span>{formatDate(record.date, locale)}</span>
                      <Badge tone={statusTone(record.status)}>{formatStatus(record.status, locale)}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">{t("portal.noData")}</p>
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "attendance" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {(["present", "absent", "late", "leave"] as const).map((status) => (
              <StatCard
                key={status}
                label={formatStatus(status, locale)}
                value={data.attendanceSummary[status] || 0}
                tone={status === "present" ? "success" : status === "absent" ? "danger" : status === "late" ? "warning" : "info"}
              />
            ))}
          </div>
          {data.attendance.length ? (
            <DataTable
              rows={data.attendance}
              keyFor={(row) => row.id}
              columns={[
                { key: "date", label: t("common.date"), render: (row) => formatDate(row.date, locale) },
                {
                  key: "status",
                  label: t("portal.status"),
                  render: (row) => <Badge tone={statusTone(row.status)}>{formatStatus(row.status, locale)}</Badge>
                }
              ]}
            />
          ) : (
            <EmptyState title={t("portal.noData")} description={t("state.emptyHint")} />
          )}
        </div>
      ) : null}

      {tab === "results" ? (
        data.results.length ? (
          <div className="space-y-4">
            {data.results.map((result) => (
              <Card key={result.examId}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-950/10 pb-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-brand-950">{result.title}</h3>
                    <p className="text-xs text-muted">{formatDate(result.date, locale)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={result.passed ? "success" : "danger"}>{result.grade}</Badge>
                    <Badge tone="neutral">{result.percentage}%</Badge>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="mt-3 w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="text-start text-[10px] uppercase tracking-widest text-muted">
                        <th className="py-2 text-start">{t("portal.subject")}</th>
                        <th className="py-2 text-start">{t("portal.obtained")}</th>
                        <th className="py-2 text-start">{t("portal.maxMarks")}</th>
                        <th className="py-2 text-start">{t("portal.grade")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.subjects.map((subject) => (
                        <tr key={subject.code || subject.name} className="border-t border-brand-950/5">
                          <td className="py-2">{subject.name}</td>
                          <td className="py-2">{subject.obtainedMarks}</td>
                          <td className="py-2">{subject.maxMarks}</td>
                          <td className="py-2">
                            <Badge tone={subject.passed ? "success" : "danger"}>{subject.grade}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title={t("portal.noData")} description={t("state.emptyHint")} />
        )
      ) : null}

      {tab === "fees" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label={t("portal.fees")} value={formatMoney(data.fees.total, locale)} />
            <StatCard label={t("portal.paid")} value={formatMoney(data.fees.paid, locale)} tone="success" />
            <StatCard label={t("portal.balance")} value={formatMoney(data.fees.balance, locale)} tone={data.fees.balance > 0 ? "danger" : "success"} />
          </div>
          {data.invoices.length ? (
            <DataTable
              rows={data.invoices}
              keyFor={invoiceKey}
              columns={[
                { key: "invoice", label: t("portal.invoices"), render: (row) => <span className="font-mono text-xs">{row.invoiceNumber}</span> },
                { key: "due", label: t("portal.due"), render: (row) => formatDate(row.dueDate, locale) },
                { key: "total", label: t("cart.total"), render: (row) => formatMoney(row.total, locale) },
                { key: "paid", label: t("portal.paid"), render: (row) => formatMoney(row.paid, locale) },
                { key: "balance", label: t("portal.balance"), render: (row) => formatMoney(row.balance, locale) },
                {
                  key: "status",
                  label: t("portal.status"),
                  render: (row) => <Badge tone={statusTone(row.status)}>{formatStatus(row.status, locale)}</Badge>
                }
              ]}
            />
          ) : (
            <EmptyState title={t("portal.noData")} description={t("state.emptyHint")} />
          )}
        </div>
      ) : null}

      {data.admission ? (
        <Card className="bg-gold-50/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-800">{t("nav.trackApplication")}</p>
              <p className="font-mono text-sm font-semibold text-brand-950">{data.admission.reference}</p>
            </div>
            <Badge tone={statusTone(data.admission.status)}>{formatStatus(data.admission.status, locale)}</Badge>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function Detail({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg bg-brand-950/[0.02] p-2.5", className)}>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}

export function ChildTabs({ children, labels }: { children: React.ReactNode[]; labels: string[] }) {
  const [index, setIndex] = useState(0);
  const { t } = useLanguage();
  if (!children.length) return <EmptyState title={t("portal.noChildren")} />;
  return (
    <div className="space-y-4">
      {children.length > 1 ? (
        <Tabs
          value={String(index)}
          onChange={(value) => setIndex(Number(value))}
          tabs={labels.map((label, entry) => ({ value: String(entry), label }))}
        />
      ) : null}
      {children[Math.min(index, children.length - 1)]}
    </div>
  );
}
