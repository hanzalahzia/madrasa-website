"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  UserRound,
  Wallet,
  X
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { motion, useReducedMotion } from "motion/react";
import { Badge, Card, CardDescription, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ErrorState, LoadingPanel } from "@/components/ui/feedback";
import { AnimatedNumber, Stagger, StaggerItem, premiumEase } from "@/components/motion/primitives";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatMoney, formatNumber, formatStatus } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const statusTones: Record<string, "neutral" | "success" | "warning" | "danger" | "gold" | "info"> = {
  submitted: "info",
  under_review: "warning",
  additional_information_required: "gold",
  approved: "success",
  rejected: "danger",
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "gold",
  delivered: "success",
  cancelled: "danger",
  returned: "danger",
  paid: "success",
  unpaid: "neutral",
  partial: "warning",
  overdue: "danger"
};

const quickActions = [
  { href: "/admin/admissions", label: "Review admissions", icon: ClipboardList, tone: "bg-sky-400/15 text-sky-200" },
  { href: "/admin/students", label: "Student records", icon: GraduationCap, tone: "bg-emerald-400/15 text-emerald-200" },
  { href: "/admin/books", label: "Manage books", icon: BookOpen, tone: "bg-gold-400/15 text-gold-200" },
  { href: "/admin/finance", label: "Open finance", icon: Wallet, tone: "bg-rose-400/15 text-rose-200" }
];

export default function AdminDashboardPage() {
  const { locale } = useLanguage();
  const reduce = useReducedMotion();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const query = from || to ? `?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString()}` : "";
  const { data, error, loading, reload } = useApi<DashboardData>(`/admin/dashboard${query}`);

  if (loading && !data) return <LoadingPanel label="Loading dashboard…" />;
  if (error && !data) return <ErrorState description={error} onRetry={reload} />;
  if (!data) return null;

  const attendanceTotal =
    (data.attendance.present || 0) + (data.attendance.absent || 0) + (data.attendance.late || 0) + (data.attendance.leave || 0);
  const presentRate = attendanceTotal ? Math.round(((data.attendance.present || 0) / attendanceTotal) * 100) : 0;
  const collectionRate = data.fees.total ? Math.min(100, Math.round((data.fees.paid / data.fees.total) * 100)) : 0;
  const money = (value: number) => <AnimatedNumber value={value} format={(next) => formatMoney(next, locale)} />;
  const count = (value: number) => <AnimatedNumber value={value} format={(next) => formatNumber(Math.round(next), locale)} />;

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: premiumEase }}
        className="relative overflow-hidden rounded-3xl bg-brand-950 px-6 py-7 text-ivory shadow-premium sm:px-8"
      >
        <div aria-hidden className="pattern-islamic absolute inset-0 opacity-[0.12]" />
        <motion.div
          aria-hidden
          className="absolute -end-20 -top-24 h-64 w-64 rounded-full bg-gold-400/15 blur-3xl"
          animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-24 start-1/3 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
          animate={reduce ? undefined : { x: [0, 18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-300">
              <Sparkles className="h-3 w-3" /> Live overview
            </p>
            <h1 className="mt-2 text-balance font-display text-3xl font-semibold sm:text-4xl">
              Assalamu alaikum, administrator
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/70">
              A live snapshot of Madrasa Miftah ul Uloom for {formatDate(data.range.from, locale)} – {formatDate(data.range.to, locale)}.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                {count(data.students.active)} active students
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/20 bg-gold-400/10 px-3 py-1.5 text-xs text-gold-100">
                {count(data.admissions.pending)} admissions pending
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-ivory/75">
                {count(data.orders.pending)} orders awaiting action
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-ivory/80 transition hover:-translate-y-0.5 hover:border-gold-400/30 hover:bg-white/10 hover:text-ivory"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.tone}`}>
                  <action.icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{action.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-brand-950/10 bg-white/70 p-3 shadow-card backdrop-blur">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-muted">
            From
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 h-9 w-36" />
          </label>
          <label className="text-xs font-semibold text-muted">
            To
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 h-9 w-36" />
          </label>
          {from || to ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              <X className="h-3.5 w-3.5" /> Reset
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-muted sm:inline">
            Updated {formatDate(new Date().toISOString(), locale, true)}
          </span>
          <Button variant="outline" size="sm" onClick={reload} loading={loading} className="h-9">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" gap={0.05}>
        <StaggerItem>
          <StatCard
            label="Active students"
            value={count(data.students.active)}
            hint={`${formatNumber(data.teachers, locale)} faculty profiles`}
            icon={<GraduationCap className="h-4 w-4" />}
            tone="success"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Pending admissions"
            value={count(data.admissions.pending)}
            hint="Submitted or under review"
            icon={<ClipboardList className="h-4 w-4" />}
            tone="warning"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Fees collected"
            value={money(data.fees.collectedInRange)}
            hint={`${formatNumber(data.fees.transactions, locale)} transactions in range`}
            icon={<Wallet className="h-4 w-4" />}
            tone="gold"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Outstanding fees"
            value={money(data.fees.outstanding)}
            hint={`${formatMoney(data.fees.total, locale)} billed in total`}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone={data.fees.outstanding > 0 ? "danger" : "success"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Orders"
            value={count(data.orders.total)}
            hint={`${formatNumber(data.orders.pending, locale)} awaiting action`}
            icon={<ShoppingCart className="h-4 w-4" />}
            tone="info"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Store revenue"
            value={money(data.orders.revenue)}
            hint="Non-cancelled orders"
            icon={<BookOpen className="h-4 w-4" />}
            tone="success"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Low stock books"
            value={count(data.books.lowStock)}
            hint="At or below threshold"
            icon={<AlertTriangle className="h-4 w-4" />}
            tone={data.books.lowStock > 0 ? "warning" : "neutral"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Attendance today"
            value={count(data.attendance.present || 0)}
            hint={`${formatNumber(data.attendance.absent || 0, locale)} absent · ${formatNumber(data.attendance.late || 0, locale)} late`}
            icon={<UserRound className="h-4 w-4" />}
            tone="success"
          />
        </StaggerItem>
      </Stagger>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="hover:shadow-premium">
          <CardHeader>
            <div>
              <CardTitle>Income & orders</CardTitle>
              <CardDescription>Payments collected and book orders over the last six months.</CardDescription>
            </div>
            <Badge tone="gold">6 months</Badge>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.chart} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminBarGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c8a45d" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#c8a45d" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,48,38,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="money" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={58} />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={34}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(20,48,38,0.12)", fontSize: 12 }}
                  formatter={(value, name) =>
                    name === "Payments" ? formatMoney(Number(value), locale) : formatNumber(Number(value), locale)
                  }
                />
                <Bar yAxisId="count" dataKey="orders" name="Orders" fill="url(#adminBarGold)" radius={[6, 6, 0, 0]} barSize={22} />
                <Line
                  yAxisId="money"
                  type="monotone"
                  dataKey="payments"
                  name="Payments"
                  stroke="#143026"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#143026" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="hover:shadow-premium">
          <CardHeader>
            <div>
              <CardTitle>Today at a glance</CardTitle>
              <CardDescription>Attendance and fee health.</CardDescription>
            </div>
          </CardHeader>
          <div className="flex items-center gap-4 rounded-2xl border border-brand-950/10 bg-white/60 p-3">
            <div
              className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#2d7054 ${presentRate * 3.6}deg, rgba(6,78,59,0.08) 0deg)`
              }}
            >
              <span className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-ivory">
                <span className="font-display text-xl font-semibold text-brand-950">{presentRate}%</span>
                <span className="text-[8px] uppercase tracking-wider text-muted">present</span>
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              {(["present", "absent", "late", "leave"] as const).map((status) => {
                const value = data.attendance[status] || 0;
                const percent = attendanceTotal ? Math.round((value / attendanceTotal) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-2 text-[11px]">
                    <span className="w-12 capitalize text-muted">{status}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-950/5">
                      <motion.span
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: premiumEase }}
                        className={
                          status === "present"
                            ? "block h-full rounded-full bg-emerald-600"
                            : status === "absent"
                              ? "block h-full rounded-full bg-red-500"
                              : status === "late"
                                ? "block h-full rounded-full bg-amber-500"
                                : "block h-full rounded-full bg-sky-500"
                        }
                      />
                    </span>
                    <span className="w-6 text-end font-semibold text-brand-950">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Billed</span>
              <span className="font-semibold text-brand-950">{formatMoney(data.fees.total, locale)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Paid</span>
              <span className="font-semibold text-emerald-800">{formatMoney(data.fees.paid, locale)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-950/5">
              <motion.div
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${collectionRate}%` }}
                transition={{ duration: 0.9, ease: premiumEase }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-gold-500"
              />
            </div>
            <div className="flex items-center justify-between border-t border-brand-950/10 pt-2">
              <span className="text-muted">Balance</span>
              <span className="font-semibold text-brand-950">{formatMoney(data.fees.outstanding, locale)}</span>
            </div>
            <ButtonLink href="/admin/finance" variant="outline" size="sm" className="mt-2 w-full">
              Open finance
            </ButtonLink>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="hover:shadow-premium">
          <CardHeader>
            <div>
              <CardTitle>Recent admissions</CardTitle>
              <CardDescription>Latest applications from the public site.</CardDescription>
            </div>
            <Link href="/admin/admissions" className="text-xs font-semibold text-brand-800 hover:text-brand-950">
              View all
            </Link>
          </CardHeader>
          <div className="divide-y divide-brand-950/5">
            {data.recentAdmissions.length ? (
              data.recentAdmissions.map((admission) => (
                <div key={admission._id} className="flex items-center justify-between gap-3 py-2.5 transition hover:bg-gold-50/30">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-950">{admission.studentName}</p>
                    <p className="text-xs text-muted">
                      {admission.reference} · {formatDate(admission.createdAt, locale)}
                    </p>
                  </div>
                  <Badge tone={statusTones[admission.status] || "neutral"}>{formatStatus(admission.status, locale)}</Badge>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted">No applications yet.</p>
            )}
          </div>
        </Card>

        <Card className="hover:shadow-premium">
          <CardHeader>
            <div>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest purchases from the bookstore.</CardDescription>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-brand-800 hover:text-brand-950">
              View all
            </Link>
          </CardHeader>
          <div className="divide-y divide-brand-950/5">
            {data.recentOrders.length ? (
              data.recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between gap-3 py-2.5 transition hover:bg-gold-50/30">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-950">{order.customerName}</p>
                    <p className="text-xs text-muted">
                      {order.orderNumber} · {formatDate(order.createdAt, locale)}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-semibold text-brand-950">{formatMoney(order.total, locale)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted">{formatStatus(order.fulfilmentStatus, locale)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted">No orders yet.</p>
            )}
          </div>
        </Card>

        <Card className="hover:shadow-premium">
          <CardHeader>
            <div>
              <CardTitle>Low stock</CardTitle>
              <CardDescription>Reorder these titles soon.</CardDescription>
            </div>
            <Link href="/admin/books" className="text-xs font-semibold text-brand-800 hover:text-brand-950">
              Manage books
            </Link>
          </CardHeader>
          <div className="space-y-2">
            {data.lowStockBooks.length ? (
              data.lowStockBooks.map((book) => (
                <div key={book._id} className="flex items-center justify-between gap-3 rounded-xl bg-brand-950/[0.03] px-3 py-2 transition hover:bg-gold-50/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-950">{book.title?.en || book.sku}</p>
                    <p className="text-xs text-muted">{book.sku}</p>
                  </div>
                  <Badge tone={book.stock <= 0 ? "danger" : "warning"}>{book.stock} left</Badge>
                </div>
              ))
            ) : (
              <p className="py-5 text-center text-sm text-muted">Stock levels are healthy.</p>
            )}
          </div>
        </Card>

        <Card className="hover:shadow-premium">
          <CardHeader>
            <div>
              <CardTitle>Coming up</CardTitle>
              <CardDescription>Published events and scheduled exams.</CardDescription>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {data.upcomingEvents.slice(0, 3).map((event) => (
              <div key={event._id} className="flex items-start gap-3 rounded-xl p-1.5 transition hover:bg-gold-50/40">
                <span className="mt-0.5 rounded-lg bg-gold-100 p-2 text-gold-800">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-brand-950">{event.title?.en}</p>
                  <p className="text-xs text-muted">{formatDate(event.startDate, locale)}</p>
                </div>
              </div>
            ))}
            {data.upcomingExams.slice(0, 3).map((exam) => (
              <div key={exam._id} className="flex items-start gap-3 rounded-xl p-1.5 transition hover:bg-gold-50/40">
                <span className="mt-0.5 rounded-lg bg-brand-950/5 p-2 text-brand-800">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-brand-950">{exam.title}</p>
                  <p className="text-xs text-muted">Exam · {formatDate(exam.startDate, locale)}</p>
                </div>
              </div>
            ))}
            {!data.upcomingEvents.length && !data.upcomingExams.length ? (
              <p className="py-5 text-center text-sm text-muted">Nothing scheduled.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
