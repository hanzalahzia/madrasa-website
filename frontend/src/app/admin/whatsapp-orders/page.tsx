"use client";

import { useMemo, useState } from "react";
import { Eye, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, queryString } from "@/lib/api";
import { useApi, useDebounced } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import type { CrudList, WhatsAppOrder } from "@/lib/types";
import { Badge, Card, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, Pagination, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";

const statuses = ["new", "contacted", "confirmed", "closed"] as const;
const tones: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "gold"> = {
  new: "warning",
  contacted: "info",
  confirmed: "success",
  closed: "neutral"
};

function customerChatLink(request: WhatsAppOrder) {
  let digits = request.phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  if (!digits) return "";
  const message = `Assalam-o-Alaikum! Regarding your WhatsApp order request ${request.requestNumber} from Madrasa Miftah ul Uloom.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function AdminWhatsAppOrdersPage() {
  const { locale } = useLanguage();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ status: WhatsAppOrder["status"]; note: string }>({
    status: "new",
    note: ""
  });
  const [saving, setSaving] = useState(false);

  const path = `/admin/whatsapp-orders${queryString({
    search: debounced,
    status,
    page,
    limit: 20
  })}`;
  const requests = useApi<CrudList<WhatsAppOrder>>(path);
  const detail = useApi<WhatsAppOrder>(detailId ? `/admin/whatsapp-orders/${detailId}` : null);
  const rows = useMemo(() => requests.data?.items || [], [requests.data]);

  const openDetail = (request: WhatsAppOrder) => {
    setDetailId(request.id);
    setForm({ status: request.status, note: "" });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail.data) return;
    setSaving(true);
    try {
      await api(`/admin/whatsapp-orders/${detail.data.id}`, {
        method: "PATCH",
        body: {
          status: form.status,
          note: form.note || "Status updated by administrator."
        }
      });
      toast.success("WhatsApp order updated");
      detail.reload();
      requests.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<WhatsAppOrder>[] = [
    {
      key: "requestNumber",
      label: "Request",
      render: (request) => (
        <span className="font-mono text-xs font-medium text-brand-800">{request.requestNumber}</span>
      )
    },
    {
      key: "customer",
      label: "Customer",
      render: (request) => (
        <div>
          <p className="font-medium text-brand-950">{request.customerName}</p>
          <p className="text-xs text-muted">
            {request.phone}
            {request.city ? ` · ${request.city}` : ""}
          </p>
        </div>
      )
    },
    {
      key: "items",
      label: "Items",
      render: (request) => (
        <span className="text-sm">{request.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
      )
    },
    {
      key: "total",
      label: "Total",
      render: (request) => <span className="font-semibold">{formatMoney(request.total, locale)}</span>
    },
    {
      key: "status",
      label: "Status",
      render: (request) => (
        <Badge tone={tones[request.status] || "neutral"}>{formatStatus(request.status, locale)}</Badge>
      )
    },
    {
      key: "createdAt",
      label: "Received",
      render: (request) => <span className="text-xs text-muted">{formatDate(request.createdAt, locale)}</span>
    },
    {
      key: "actions",
      label: "",
      className: "text-end",
      headerClassName: "text-end",
      render: (request) => (
        <Button type="button" variant="ghost" size="sm" onClick={() => openDetail(request)}>
          <Eye className="h-4 w-4" /> View
        </Button>
      )
    }
  ];

  const current = detail.data;
  const chatHref = current ? customerChatLink(current) : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">Bookstore</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">WhatsApp orders</h1>
          <p className="mt-1 text-sm text-muted">
            Book order requests started from the website&apos;s WhatsApp confirmation flow.
          </p>
        </div>
        <a
          href="https://wa.me/923343595001"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-2 text-xs font-semibold text-[#128C4A] transition hover:border-[#25D366]/60 hover:bg-[#25D366]/15"
        >
          <MessageCircle className="h-4 w-4" /> Open WhatsApp
        </a>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search request number, customer, phone…"
              className="ps-9"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {formatStatus(value, locale)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {requests.error ? (
        <ErrorState description={requests.error} onRetry={requests.reload} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            keyFor={(request) => request.id}
            loading={requests.loading}
            onRowClick={openDetail}
            empty={
              <EmptyState
                title="No WhatsApp order requests"
                description="When a customer confirms an order through WhatsApp, it will appear here."
              />
            }
          />
          {requests.data?.pagination ? (
            <Pagination
              page={requests.data.pagination.page}
              pages={requests.data.pagination.pages}
              onChange={setPage}
              label={(value) => `Page ${value} of ${requests.data?.pagination?.pages || 1}`}
            />
          ) : null}
        </>
      )}

      <Modal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        title={current ? `WhatsApp request ${current.requestNumber}` : "WhatsApp order"}
        description={current ? `${formatDate(current.createdAt, locale, true)} · ${current.customerName}` : undefined}
        size="lg"
      >
        {detail.error ? (
          <ErrorState description={detail.error} onRetry={detail.reload} />
        ) : detail.loading && !current ? (
          <LoadingPanel label="Loading request…" />
        ) : current ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={tones[current.status] || "neutral"}>{formatStatus(current.status, locale)}</Badge>
              <Badge tone="info">WhatsApp</Badge>
              {chatHref ? (
                <a
                  href={chatHref}
                  target="_blank"
                  rel="noreferrer"
                  className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-1.5 text-[11px] font-semibold text-[#128C4A] transition hover:border-[#25D366]/60 hover:bg-[#25D366]/15"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Message customer
                </a>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <CardDescription>Customer</CardDescription>
                <p className="mt-1 font-semibold text-brand-950">{current.customerName}</p>
                <p className="text-xs text-muted">
                  {current.phone} {current.email ? `· ${current.email}` : ""}
                </p>
                {current.address ? (
                  <p className="mt-2 text-sm text-ink">
                    {current.address}
                    {current.city ? `, ${current.city}` : ""}
                  </p>
                ) : null}
                {current.notes ? <p className="mt-2 text-xs text-muted">Notes: {current.notes}</p> : null}
              </Card>
              <Card className="p-4">
                <CardDescription>Totals</CardDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span>{formatMoney(current.subtotal, locale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Shipping</span>
                    <span>{formatMoney(current.shipping, locale)}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-950/10 pt-1 font-semibold text-brand-950">
                    <span>Total</span>
                    <span>{formatMoney(current.total, locale)}</span>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-brand-950">Requested books</h3>
              <div className="mt-2 divide-y divide-brand-950/5 rounded-2xl border border-brand-950/10 bg-white">
                {current.items.map((item) => (
                  <div key={item.bookId || item.sku} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-brand-950">{item.title}</p>
                      <p className="text-xs text-muted">
                        {item.sku} · {formatMoney(item.unitPrice, locale)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold">{formatMoney(item.lineTotal, locale)}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="rounded-2xl border border-brand-950/10 bg-brand-950/[0.02] p-4">
              <h3 className="font-display text-lg font-semibold text-brand-950">Update follow-up</h3>
              <p className="mt-1 text-xs text-muted">
                Keep this status in sync after messaging the customer on WhatsApp.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormField label="Status">
                  <Select
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value as WhatsAppOrder["status"] })
                    }
                  >
                    {statuses.map((value) => (
                      <option key={value} value={value}>
                        {formatStatus(value, locale)}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Note" className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.note}
                    onChange={(event) => setForm({ ...form, note: event.target.value })}
                    placeholder="Optional note about the WhatsApp conversation"
                  />
                </FormField>
              </div>
              <div className="mt-3 flex justify-end">
                <Button type="submit" loading={saving}>
                  <MessageCircle className="h-4 w-4" /> Save status
                </Button>
              </div>
            </form>

            {current.statusHistory?.length ? (
              <div>
                <h3 className="font-display text-lg font-semibold text-brand-950">History</h3>
                <ol className="mt-3 space-y-3 border-s border-brand-950/10 ps-4">
                  {[...current.statusHistory].reverse().map((entry, index) => (
                    <li key={index} className="relative">
                      <span className="absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold-500 ring-4 ring-ivory" />
                      <p className="text-sm font-medium text-brand-950">{formatStatus(entry.status, locale)}</p>
                      <p className="text-xs text-muted">
                        {formatDate(entry.at, locale, true)} {entry.note ? `· ${entry.note}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
