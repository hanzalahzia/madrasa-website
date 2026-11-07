"use client";

import { useMemo, useState } from "react";
import { Mail, MailOpen, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, queryString } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatStatus } from "@/lib/format";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/ui/feedback";

interface ContactMessage {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
}

const tones: Record<string, "info" | "neutral" | "success" | "warning"> = {
  new: "info",
  read: "neutral",
  replied: "success",
  archived: "warning"
};

export default function AdminMessagesPage() {
  const { locale } = useLanguage();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [saving, setSaving] = useState(false);

  const messages = useApi<{ items: ContactMessage[] }>(`/admin/messages${queryString({ status })}`);
  const rows = useMemo(() => {
    const items = messages.data?.items || [];
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((message) =>
      [message.name, message.subject, message.email, message.phone].some((value) =>
        (value || "").toLowerCase().includes(term)
      )
    );
  }, [messages.data, search]);

  const setMessageStatus = async (message: ContactMessage, next: ContactMessage["status"]) => {
    setSaving(true);
    try {
      await api(`/admin/messages/${message._id}`, { method: "PATCH", body: { status: next } });
      toast.success(`Message marked ${next}`);
      setSelected((current) => (current ? { ...current, status: next } : current));
      messages.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<ContactMessage>[] = [
    {
      key: "name",
      label: "Sender",
      render: (message) => (
        <div>
          <p className="font-medium text-brand-950">{message.name}</p>
          <p className="text-xs text-muted">{message.email || message.phone || "—"}</p>
        </div>
      )
    },
    {
      key: "subject",
      label: "Subject",
      render: (message) => (
        <div>
          <p className="text-sm font-medium text-brand-950">{message.subject}</p>
          <p className="line-clamp-1 text-xs text-muted">{message.message}</p>
        </div>
      )
    },
    { key: "createdAt", label: "Received", render: (message) => formatDate(message.createdAt, locale, true) },
    {
      key: "status",
      label: "Status",
      render: (message) => <Badge tone={tones[message.status] || "neutral"}>{formatStatus(message.status, locale)}</Badge>
    },
    {
      key: "actions",
      label: "",
      className: "text-end",
      headerClassName: "text-end",
      render: (message) => (
        <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(message)}>
          {message.status === "new" ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />} Open
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">Website</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Messages</h1>
        <p className="mt-1 text-sm text-muted">Enquiries sent through the public contact form.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { value: "", label: "All" },
            { value: "new", label: "New" },
            { value: "read", label: "Read" },
            { value: "replied", label: "Replied" },
            { value: "archived", label: "Archived" }
          ]}
          value={status}
          onChange={setStatus}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sender or subject…"
            className="w-64 ps-9"
          />
        </div>
      </div>

      {messages.error ? (
        <ErrorState description={messages.error} onRetry={messages.reload} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          keyFor={(message) => message._id}
          loading={messages.loading}
          onRowClick={setSelected}
          empty={<EmptyState title="No messages" description="Contact form enquiries will appear here." />}
        />
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.subject || "Message"}
        description={selected ? `${selected.name} · ${formatDate(selected.createdAt, locale, true)}` : undefined}
        size="md"
        footer={
          selected ? (
            <div className="flex flex-wrap justify-end gap-2">
              {selected.email ? (
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-brand-950/20 bg-white px-3 text-xs font-semibold text-brand-950"
                >
                  <Send className="h-3.5 w-3.5" /> Reply by email
                </a>
              ) : null}
              <Button type="button" variant="outline" onClick={() => void setMessageStatus(selected, "archived")} loading={saving}>
                Archive
              </Button>
              <Button type="button" onClick={() => void setMessageStatus(selected, "replied")} loading={saving}>
                Mark replied
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={tones[selected.status] || "neutral"}>{formatStatus(selected.status, locale)}</Badge>
              {selected.email ? <span className="text-xs text-muted">{selected.email}</span> : null}
              {selected.phone ? <span className="text-xs text-muted">{selected.phone}</span> : null}
            </div>
            <Card className="whitespace-pre-wrap bg-white p-4 text-sm leading-relaxed text-ink">{selected.message}</Card>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Set status</span>
              <Select
                value={selected.status}
                onChange={(event) => void setMessageStatus(selected, event.target.value as ContactMessage["status"])}
                className="h-9 w-40"
              >
                {(["new", "read", "replied", "archived"] as const).map((value) => (
                  <option key={value} value={value}>
                    {formatStatus(value, locale)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
