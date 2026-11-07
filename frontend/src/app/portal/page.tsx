"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  NotebookPen,
  ShoppingBag,
  Users
} from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import type { PortalOverview } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Badge, Card, StatCard } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";
import { StudentView, ChildTabs } from "@/components/portal/student-view";
import { cn } from "@/lib/utils";

export default function PortalPage() {
  const router = useRouter();
  const { t, localized, locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const enabled = Boolean(user && user.role !== "super_admin");
  const { data, loading, error, reload } = useApi<PortalOverview>("/portal/overview", { enabled });

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
    else if (user.role === "super_admin") router.replace("/admin");
  }, [authLoading, user, router]);

  if (authLoading || !user || (loading && !data)) {
    return (
      <Section>
        <LoadingPanel label={t("state.loading")} />
      </Section>
    );
  }

  if (user.role === "super_admin") return null;

  return (
    <>
      <PageHero
        eyebrow={t("portal.title")}
        title={`${t("portal.welcome")}, ${user.name}`}
        description={t("auth.signInSubtitle")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.portal") }]}
        compact
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="gold">{formatStatus(user.role, locale)}</Badge>
          <Link href="/account" className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-ivory/80 transition hover:border-gold-300 hover:text-gold-200">
            {t("auth.myAccount")}
          </Link>
        </div>
      </PageHero>
      <Section>
        {error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : !data ? (
          <LoadingPanel label={t("state.loading")} />
        ) : (
          <div className="space-y-8">
            {data.role === "student" && data.data ? <StudentView data={data.data} /> : null}

            {data.role === "guardian" ? (
              <ChildTabs labels={(data.children || []).map((child) => child.student.name)}>
                {(data.children || []).map((child) => (
                  <StudentView key={child.student._id} data={child} />
                ))}
              </ChildTabs>
            ) : null}

            {data.role === "teacher" ? <TeacherView overview={data} /> : null}

            {data.role === "customer" ? <CustomerView overview={data} /> : null}

            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-brand-950">
                  <Megaphone className="h-5 w-5" /> {t("portal.announcements")}
                </h2>
                {data.announcements?.length ? (
                  <div className="mt-4 space-y-4">
                    {data.announcements.map((announcement) => (
                      <div key={announcement._id} className="border-b border-brand-950/5 pb-3 last:border-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-brand-950">{localized(announcement.title)}</p>
                          <span className="text-[10px] text-muted">{formatDate(announcement.publishDate, locale)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{localized(announcement.body)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">{t("portal.noData")}</p>
                )}
              </Card>
              <Card>
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-brand-950">
                  <Bell className="h-5 w-5" /> {t("portal.notifications")}
                </h2>
                {data.notifications?.length ? (
                  <ul className="mt-4 space-y-3">
                    {data.notifications.map((notification) => (
                      <li key={notification._id} className="rounded-xl border border-brand-950/10 bg-white/60 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm", notification.readAt ? "text-muted" : "font-medium text-brand-950")}>{notification.title}</p>
                          {!notification.readAt ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-500" /> : null}
                        </div>
                        {notification.body ? <p className="mt-0.5 text-xs text-muted">{notification.body}</p> : null}
                        <p className="mt-1 text-[10px] text-muted">{formatDate(notification.createdAt, locale, true)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">{t("portal.noNotifications")}</p>
                )}
              </Card>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}

function TeacherView({ overview }: { overview: PortalOverview }) {
  const { t, localized, locale } = useLanguage();
  const classes = overview.classes || [];
  const exams = overview.exams || [];
  const studentTotal = classes.reduce((sum, entry) => sum + (entry.studentCount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t("portal.assignedClasses")} value={classes.length} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t("portal.students")} value={studentTotal} icon={<GraduationCap className="h-5 w-5" />} tone="success" />
        <StatCard label={t("portal.exams")} value={exams.length} icon={<CalendarDays className="h-5 w-5" />} tone="gold" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-brand-950">
            <ClipboardCheck className="h-5 w-5" /> {t("portal.assignedClasses")}
          </h2>
          {classes.length ? (
            <ul className="mt-4 space-y-2">
              {classes.map((entry) => (
                <li key={entry._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-950/10 p-3">
                  <div>
                    <p className="text-sm font-medium text-brand-950">
                      {entry.name} {entry.section ? `· ${entry.section}` : ""}
                    </p>
                    <p className="text-[11px] text-muted">
                      {localized(typeof entry.program === "object" ? entry.program?.title : undefined) || "—"} ·{" "}
                      {entry.studentCount || 0} {t("portal.students")}
                    </p>
                  </div>
                  <ButtonLink href={`/portal/attendance?classId=${entry._id}`} variant="outline" size="sm">
                    {t("portal.takeAttendance")}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">{t("portal.noData")}</p>
          )}
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-brand-950">
            <NotebookPen className="h-5 w-5" /> {t("portal.exams")}
          </h2>
          {exams.length ? (
            <ul className="mt-4 space-y-2">
              {exams.map((exam) => (
                <li key={exam._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-950/10 p-3">
                  <div>
                    <p className="text-sm font-medium text-brand-950">{exam.title}</p>
                    <p className="text-[11px] text-muted">
                      {formatDate(exam.startDate, locale)} · {exam.subjects?.length || 0} {t("portal.subject")}
                    </p>
                  </div>
                  <ButtonLink href={`/portal/marks?examId=${exam._id}`} variant="outline" size="sm">
                    {t("portal.enterMarks")}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">{t("portal.noData")}</p>
          )}
        </Card>
      </div>
      <Card>
        <h2 className="font-display text-xl font-semibold text-brand-950">{t("portal.profileDetails")}</h2>
        <p className="mt-2 text-sm text-muted">{overview.teacher?.name}</p>
        <p className="text-xs text-muted">{overview.teacher?.qualifications || "—"}</p>
        {overview.teacher?.bio ? <p className="mt-2 text-sm leading-relaxed text-muted">{localized(overview.teacher.bio)}</p> : null}
      </Card>
    </div>
  );
}

function CustomerView({ overview }: { overview: PortalOverview }) {
  const { t, locale } = useLanguage();
  const orders = overview.orders || [];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t("portal.orderHistory")} value={orders.length} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard
          label={t("portal.paid")}
          value={formatMoney(orders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.total, 0), locale)}
          tone="success"
        />
        <StatCard label={t("nav.books")} value={<BookOpen className="h-6 w-6" />} tone="gold" />
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-brand-950">{t("portal.orderHistory")}</h2>
          <ButtonLink href="/books" variant="outline" size="sm">
            {t("nav.visitStore")}
          </ButtonLink>
        </div>
        {orders.length ? (
          <div className="mt-4 space-y-2">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.orderNumber}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-950/10 p-3 transition hover:border-gold-400/60 hover:bg-gold-50/40"
              >
                <div>
                  <p className="font-mono text-xs font-semibold text-brand-950">{order.orderNumber}</p>
                  <p className="text-[11px] text-muted">{formatDate(order.createdAt, locale)} · {order.items?.length || 0} {t("cart.items")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={order.paymentStatus === "paid" ? "success" : "warning"}>{formatStatus(order.paymentStatus, locale)}</Badge>
                  <Badge tone="neutral">{formatStatus(order.fulfilmentStatus, locale)}</Badge>
                  <span className="text-sm font-semibold">{formatMoney(order.total, locale)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title={t("portal.noOrders")} description={t("cart.emptyHint")} action={<ButtonLink href="/books" className="mt-2">{t("cart.continue")}</ButtonLink>} />
        )}
      </Card>
    </div>
  );
}
