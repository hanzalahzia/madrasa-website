"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, CheckCheck, ChevronRight, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";
import type { NotificationItem } from "@/lib/types";

export default function AdminNotificationsPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const notifications = useApi<{ items: NotificationItem[] }>("/admin/notifications");
  const [busy, setBusy] = useState(false);

  const items = notifications.data?.items || [];
  const unread = items.filter((item) => !item.readAt);
  const hasUnread = unread.length > 0;

  const markRead = async (notification: NotificationItem) => {
    if (notification.readAt) return;
    try {
      await api(`/admin/notifications/${notification._id}/read`, { method: "PATCH" });
      notifications.setData({
        items: items.map((item) => (item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item))
      });
    } catch (caught) {
      toast.error(errorMessage(caught));
    }
  };

  const open = async (notification: NotificationItem) => {
    await markRead(notification);
    if (notification.link) router.push(notification.link);
  };

  const markAllRead = async () => {
    if (!hasUnread) return;
    setBusy(true);
    try {
      await api("/admin/notifications/read-all", { method: "PATCH" });
      const now = new Date().toISOString();
      notifications.setData({ items: items.map((item) => (item.readAt ? item : { ...item, readAt: now })) });
      toast.success("All notifications marked as read.");
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">Administration</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Notifications</h1>
          <p className="mt-1 text-sm text-muted">Applications, payments and enrolment updates that need attention.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnread ? <Badge tone="gold">{unread.length} unread</Badge> : <Badge tone="neutral">All caught up</Badge>}
          <Button type="button" variant="outline" size="sm" onClick={() => void markAllRead()} loading={busy} disabled={!hasUnread}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        </div>
      </div>

      {notifications.error ? (
        <ErrorState description={notifications.error} onRetry={notifications.reload} />
      ) : notifications.loading ? (
        <LoadingPanel label="Loading notifications…" />
      ) : items.length ? (
        <div className="space-y-2">
          {items.map((notification) => {
            const unreadItem = !notification.readAt;
            return (
              <Card
                key={notification._id}
                className={cn(
                  "flex flex-wrap items-start gap-4 p-4 transition",
                  unreadItem ? "border-gold-500/30 bg-gold-50/40" : "bg-white/70"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    unreadItem ? "bg-gold-500/15 text-gold-800" : "bg-brand-950/5 text-brand-700"
                  )}
                >
                  {unreadItem ? <BellRing className="h-5 w-5" /> : <MailOpen className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("text-sm", unreadItem ? "font-semibold text-brand-950" : "font-medium text-muted")}>
                      {notification.title}
                    </p>
                    {unreadItem ? <span className="h-2 w-2 rounded-full bg-gold-500" /> : null}
                  </div>
                  {notification.body ? <p className="mt-1 text-sm leading-relaxed text-muted">{notification.body}</p> : null}
                  <p className="mt-2 text-[11px] text-muted">{formatDate(notification.createdAt, locale, true)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {unreadItem ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => void markRead(notification)}>
                      Mark read
                    </Button>
                  ) : null}
                  {notification.link ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => void open(notification)}>
                      Open <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No notifications yet"
          description="New admissions, payments and other admin alerts will appear here."
        />
      )}
    </div>
  );
}
