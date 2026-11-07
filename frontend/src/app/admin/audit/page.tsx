"use client";

import { useMemo, useState } from "react";
import { Search, ScrollText } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate } from "@/lib/format";
import { Badge, Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/ui/feedback";

interface AuditEntry {
  _id: string;
  actor?: { name?: string; email?: string } | null;
  actorEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export default function AdminAuditPage() {
  const { locale } = useLanguage();
  const [search, setSearch] = useState("");
  const audit = useApi<{ items: AuditEntry[] }>("/admin/audit-logs");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = audit.data?.items || [];
    if (!term) return items;
    return items.filter((entry) =>
      [entry.action, entry.entity, entry.entityId, entry.actor?.name, entry.actor?.email, entry.actorEmail].some(
        (value) => (value || "").toLowerCase().includes(term)
      )
    );
  }, [audit.data, search]);

  const columns: Column<AuditEntry>[] = [
    {
      key: "createdAt",
      label: "When",
      render: (entry) => <span className="whitespace-nowrap text-xs text-muted">{formatDate(entry.createdAt, locale, true)}</span>
    },
    {
      key: "action",
      label: "Action",
      render: (entry) => <span className="font-mono text-xs font-medium text-brand-800">{entry.action}</span>
    },
    {
      key: "entity",
      label: "Entity",
      render: (entry) => (
        <div>
          <Badge tone="neutral">{entry.entity}</Badge>
          {entry.entityId ? <p className="mt-1 max-w-48 truncate font-mono text-[10px] text-muted">{entry.entityId}</p> : null}
        </div>
      )
    },
    {
      key: "actor",
      label: "Actor",
      render: (entry) => (
        <div>
          <p className="text-sm">{entry.actor?.name || "System"}</p>
          <p className="text-xs text-muted">{entry.actor?.email || entry.actorEmail || "—"}</p>
        </div>
      )
    },
    {
      key: "meta",
      label: "Details",
      render: (entry) =>
        entry.meta && Object.keys(entry.meta).length ? (
          <code className="block max-w-72 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-brand-950/[0.04] px-2 py-1 text-[10px] text-brand-900">
            {JSON.stringify(entry.meta)}
          </code>
        ) : (
          "—"
        )
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">System</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Audit log</h1>
          <p className="mt-1 text-sm text-muted">The 300 most recent administrative actions.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter actions, entities or actors…"
            className="w-72 ps-9"
          />
        </div>
      </div>

      <Card className="flex items-start gap-3 bg-gold-50/60 p-4 text-xs leading-relaxed text-gold-900">
        <ScrollText className="mt-0.5 h-4 w-4 shrink-0" />
        Audit entries are immutable and record who performed each action, when, and against which record.
      </Card>

      {audit.error ? (
        <ErrorState description={audit.error} onRetry={audit.reload} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          keyFor={(entry) => entry._id}
          loading={audit.loading}
          empty={<EmptyState title="No audit entries" description="Administrative actions will be logged here." />}
        />
      )}
    </div>
  );
}
