"use client";

import { useMemo, useState } from "react";
import { Eye, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, queryString } from "@/lib/api";
import { useApi, useDebounced } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import type { CrudList, Order } from "@/lib/types";
import { Badge, Card, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, Pagination, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";

const fulfilmentStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"] as const;
const paymentStatuses = ["unpaid", "pending_verification", "paid", "failed", "refunded", "cash_on_delivery"] as const;
const tones: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "gold"> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "gold",
  delivered: "success",
  cancelled: "danger",
  returned: "danger",
  unpaid: "neutral",
  pending_verification: "warning",
  paid: "success",
  failed: "danger",
  refunded: "neutral",
  cash_on_delivery: "info"
};

export default function AdminOrdersPage() {
  const { locale } = useLanguage();
  const [search, setSearch] = useState("");
  const [fulfilment, setFulfilment] = useState("");
  const [payment, setPayment] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState({ fulfilmentStatus: "pending", paymentStatus: "unpaid", note: "" });
  const [saving, setSaving] = useState(false);

  const path = `/admin/orders${queryString({
    search: debounced,
    fulfilmentStatus: fulfilment,
    paymentStatus: payment,
    page,
    limit: 20
  })}`;
  const orders = useApi<CrudList<Order>>(path);
  const detail = useApi<Order>(detailId ? `/admin/orders/${detailId}` : null);
  const rows = useMemo(() => orders.data?.items || [], [orders.data]);

  const openDetail = (order: Order) => {
    setDetailId(order.id);
    setForm({
      fulfilmentStatus: order.fulfilmentStatus,
      paymentStatus: order.paymentStatus,
      note: ""
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail.data) return;
    if (
      form.fulfilmentStatus === detail.data.fulfilmentStatus &&
      form.paymentStatus === detail.data.paymentStatus
    ) {
      toast.info("Select a different status to update this order.");
      return;
    }
    setSaving(true);
    try {
      await api(`/admin/orders/${detail.data.id}`, {
        method: "PATCH",
        body: {
          fulfilmentStatus: form.fulfilmentStatus,
          paymentStatus: form.paymentStatus,
          note: form.note || "Status updated by administrator."
        }
      });
      toast.success("Order updated");
      detail.reload();
      orders.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      label: "Order",
      render: (order) => <span className="font-mono text-xs font-medium text-brand-800">{order.orderNumber}</span>
    },
    {
      key: "customer",
      label: "Customer",
      render: (order) => (
        <div>
          <p className="font-medium text-brand-950">{order.customerName}</p>
          <p className="text-xs text-muted">
            {order.phone} · {order.city}
          </p>
        </div>
      )
    },
    {
      key: "items",
      label: "Items",
      render: (order) => <span className="text-sm">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
    },
    {
      key: "total",
      label: "Total",
      render: (order) => <span className="font-semibold">{formatMoney(order.total, locale)}</span>
    },
    {
      key: "paymentMethod",
      label: "Payment",
      render: (order) => (
        <div className="space-y-1">
          <Badge tone={tones[order.paymentStatus] || "neutral"}>{formatStatus(order.paymentStatus, locale)}</Badge>
          <p className="text-[10px] uppercase tracking-wider text-muted">
            {order.paymentMethod === "cod" ? "COD" : "Bank transfer"}
          </p>
        </div>
      )
    },
    {
      key: "fulfilmentStatus",
      label: "Fulfilment",
      render: (order) => <Badge tone={tones[order.fulfilmentStatus] || "neutral"}>{formatStatus(order.fulfilmentStatus, locale)}</Badge>
    },
    {
      key: "createdAt",
      label: "Placed",
      render: (order) => <span className="text-xs text-muted">{formatDate(order.createdAt, locale)}</span>
    },
    {
      key: "actions",
      label: "",
      className: "text-end",
      headerClassName: "text-end",
      render: (order) => (
        <Button type="button" variant="ghost" size="sm" onClick={() => openDetail(order)}>
          <Eye className="h-4 w-4" /> View
        </Button>
      )
    }
  ];

  const current = detail.data;
  const locked = current ? ["cancelled", "returned"].includes(current.fulfilmentStatus) : false;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">Bookstore</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Orders</h1>
        <p className="mt-1 text-sm text-muted">Process bookstore orders, payments and deliveries.</p>
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
              placeholder="Search order number, customer, phone…"
              className="ps-9"
            />
          </div>
          <Select
            value={fulfilment}
            onChange={(event) => {
              setFulfilment(event.target.value);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="">All fulfilment</option>
            {fulfilmentStatuses.map((value) => (
              <option key={value} value={value}>
                {formatStatus(value, locale)}
              </option>
            ))}
          </Select>
          <Select
            value={payment}
            onChange={(event) => {
              setPayment(event.target.value);
              setPage(1);
            }}
            className="w-48"
          >
            <option value="">All payments</option>
            {paymentStatuses.map((value) => (
              <option key={value} value={value}>
                {formatStatus(value, locale)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {orders.error ? (
        <ErrorState description={orders.error} onRetry={orders.reload} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            keyFor={(order) => order.id}
            loading={orders.loading}
            onRowClick={openDetail}
            empty={<EmptyState title="No orders found" description="New bookstore orders will appear here." />}
          />
          {orders.data?.pagination ? (
            <Pagination
              page={orders.data.pagination.page}
              pages={orders.data.pagination.pages}
              onChange={setPage}
              label={(value) => `Page ${value} of ${orders.data?.pagination?.pages || 1}`}
            />
          ) : null}
        </>
      )}

      <Modal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        title={current ? `Order ${current.orderNumber}` : "Order"}
        description={current ? `${formatDate(current.createdAt, locale, true)} · ${current.customerName}` : undefined}
        size="lg"
      >
        {detail.error ? (
          <ErrorState description={detail.error} onRetry={detail.reload} />
        ) : detail.loading && !current ? (
          <LoadingPanel label="Loading order…" />
        ) : current ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone={tones[current.fulfilmentStatus] || "neutral"}>
                {formatStatus(current.fulfilmentStatus, locale)}
              </Badge>
              <Badge tone={tones[current.paymentStatus] || "neutral"}>{formatStatus(current.paymentStatus, locale)}</Badge>
              <Badge tone="neutral">{current.paymentMethod === "cod" ? "Cash on delivery" : "Bank transfer"}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <CardDescription>Delivery</CardDescription>
                <p className="mt-1 font-semibold text-brand-950">{current.customerName}</p>
                <p className="text-xs text-muted">
                  {current.phone} {current.email ? `· ${current.email}` : ""}
                </p>
                <p className="mt-2 text-sm text-ink">
                  {current.address}, {current.city}
                </p>
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
              <h3 className="font-display text-lg font-semibold text-brand-950">Items</h3>
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
              <h3 className="font-display text-lg font-semibold text-brand-950">Update status</h3>
              {locked ? (
                <p className="mt-2 rounded-xl bg-red-50 p-3 text-xs text-red-800">
                  This order is {current.fulfilmentStatus}. Cancelled or returned orders cannot be reopened.
                </p>
              ) : (
                <>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <FormField label="Fulfilment">
                      <Select
                        value={form.fulfilmentStatus}
                        onChange={(event) => setForm({ ...form, fulfilmentStatus: event.target.value })}
                      >
                        {fulfilmentStatuses.map((value) => (
                          <option key={value} value={value}>
                            {formatStatus(value, locale)}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Payment">
                      <Select
                        value={form.paymentStatus}
                        onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}
                      >
                        {paymentStatuses.map((value) => (
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
                      />
                    </FormField>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button type="submit" loading={saving}>
                      <ShoppingCart className="h-4 w-4" /> Save status
                    </Button>
                  </div>
                </>
              )}
            </form>

            {current.statusHistory?.length ? (
              <div>
                <h3 className="font-display text-lg font-semibold text-brand-950">History</h3>
                <ol className="mt-3 space-y-3 border-s border-brand-950/10 ps-4">
                  {[...current.statusHistory].reverse().map((entry, index) => (
                    <li key={index} className="relative">
                      <span className="absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold-500 ring-4 ring-ivory" />
                      <p className="text-sm font-medium text-brand-950">
                        {formatStatus(entry.fulfilmentStatus, locale)}
                        {entry.paymentStatus ? ` · ${formatStatus(entry.paymentStatus, locale)}` : ""}
                      </p>
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
