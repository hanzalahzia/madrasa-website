"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, FilePlus2, Plus, Printer, ReceiptText, Search, Undo2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, queryString } from "@/lib/api";
import { useApi, useDebounced } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import type {
  AcademicSession,
  CrudList,
  Invoice,
  Payment,
  Program,
  SchoolClass,
  Student
} from "@/lib/types";
import { Badge, Card, CardDescription, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { DataTable, Pagination, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";
import { ResourceManager, type AdminField } from "@/components/admin/resource-manager";

interface FeeStructure {
  _id: string;
  name: string;
  program?: string | null;
  session?: string | null;
  items: Array<{ title: string; amount: number; dueDate?: string | null }>;
  active: boolean;
}

interface Collections {
  from: string;
  to: string;
  total: number;
  methods: Record<string, number>;
  transactions: number;
  outstanding: number;
  outstandingInvoices: number;
}

interface InvoiceDetail {
  invoice: Invoice & { student?: Student };
  payments: Payment[];
}

const statusTones: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  paid: "success",
  unpaid: "neutral",
  partial: "warning",
  overdue: "danger"
};

function studentName(invoice: Invoice): string {
  return invoice.student && typeof invoice.student === "object" ? invoice.student.name : "Student";
}

function todayIso(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function firstOfMonth(): string {
  return `${todayIso().slice(0, 7)}-01`;
}

export default function AdminFinancePage() {
  const { locale, localized } = useLanguage();
  const [tab, setTab] = useState("invoices");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    studentId: "",
    session: "",
    discount: "0",
    fine: "0",
    dueDate: todayIso(),
    notes: "",
    items: [{ title: "", amount: "" }]
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    method: "cash",
    reference: "",
    paidAt: "",
    note: ""
  });
  const [paySaving, setPaySaving] = useState(false);
  const [collectionsFrom, setCollectionsFrom] = useState(firstOfMonth());
  const [collectionsTo, setCollectionsTo] = useState(todayIso());
  const [generateForm, setGenerateForm] = useState({ feeStructureId: "", classId: "", dueDate: "" });
  const [generating, setGenerating] = useState(false);

  const invoicePath = `/admin/invoices${queryString({ status, search: debounced, page, limit: 20 })}`;
  const invoices = useApi<CrudList<Invoice>>(invoicePath);
  const detail = useApi<InvoiceDetail>(detailId ? `/admin/invoices/${detailId}` : null);
  const students = useApi<CrudList<Student>>("/admin/students?limit=100&status=active");
  const sessions = useApi<CrudList<AcademicSession>>("/admin/sessions?limit=100");
  const programs = useApi<CrudList<Program>>("/admin/programs?limit=200");
  const classes = useApi<CrudList<SchoolClass>>("/admin/classes?limit=200");
  const structures = useApi<CrudList<FeeStructure>>("/admin/fee-structures?limit=200");
  const collections = useApi<Collections>(
    `/admin/collections?from=${encodeURIComponent(collectionsFrom)}&to=${encodeURIComponent(collectionsTo)}`
  );

  const invoiceRows = useMemo(() => invoices.data?.items || [], [invoices.data]);

  useEffect(() => {
    if (!detail.data) return;
    setPayForm({
      amount: String(Math.max(0, detail.data.invoice.balance)),
      method: "cash",
      reference: "",
      paidAt: "",
      note: ""
    });
  }, [detail.data]);

  const programOptions = useMemo(
    () =>
      (programs.data?.items || []).map((program) => ({
        value: program._id,
        label: localized(program.title) || program.slug
      })),
    [programs.data, localized]
  );
  const sessionOptions = useMemo(
    () => (sessions.data?.items || []).map((session) => ({ value: session._id, label: session.name })),
    [sessions.data]
  );
  const classOptions = useMemo(
    () =>
      (classes.data?.items || []).map((schoolClass) => ({
        value: schoolClass._id,
        label: `${schoolClass.name}${schoolClass.section ? ` — ${schoolClass.section}` : ""}`
      })),
    [classes.data]
  );

  const structureFields: AdminField[] = [
    { name: "name", label: "Structure name", type: "text", required: true, span: 2 },
    { name: "program", label: "Program", type: "select", options: programOptions },
    { name: "session", label: "Session", type: "select", options: sessionOptions },
    {
      name: "items",
      label: "Fee items",
      type: "repeater",
      addLabel: "Add fee item",
      subfields: [
        { name: "title", label: "Title", type: "text", required: true },
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "dueDate", label: "Due date", type: "date" }
      ]
    },
    { name: "active", label: "Active", type: "checkbox" }
  ];

  const openInvoice = () => {
    setInvoiceForm({
      studentId: "",
      session: "",
      discount: "0",
      fine: "0",
      dueDate: todayIso(),
      notes: "",
      items: [{ title: "", amount: "" }]
    });
    setInvoiceOpen(true);
  };

  const submitInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    setInvoiceSaving(true);
    try {
      await api("/admin/invoices", {
        method: "POST",
        body: {
          studentId: invoiceForm.studentId,
          session: invoiceForm.session || null,
          items: invoiceForm.items
            .filter((item) => item.title.trim())
            .map((item) => ({ title: item.title, amount: Number(item.amount) || 0 })),
          discount: Number(invoiceForm.discount) || 0,
          fine: Number(invoiceForm.fine) || 0,
          dueDate: invoiceForm.dueDate,
          notes: invoiceForm.notes
        }
      });
      toast.success("Invoice created");
      setInvoiceOpen(false);
      invoices.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setInvoiceSaving(false);
    }
  };

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail.data) return;
    setPaySaving(true);
    try {
      await api("/admin/payments", {
        method: "POST",
        body: {
          invoiceId: detail.data.invoice._id,
          amount: Number(payForm.amount),
          method: payForm.method,
          reference: payForm.reference,
          paidAt: payForm.paidAt || undefined,
          note: payForm.note
        }
      });
      toast.success("Payment recorded");
      detail.reload();
      invoices.reload();
      collections.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setPaySaving(false);
    }
  };

  const reversePayment = async (payment: Payment) => {
    if (!window.confirm(`Reverse payment ${payment.receiptNumber}? A reversal entry will be recorded.`)) return;
    try {
      await api(`/admin/payments/${payment._id}/reverse`, {
        method: "POST",
        body: { note: "Payment reversed by administrator." }
      });
      toast.success("Payment reversed");
      detail.reload();
      invoices.reload();
      collections.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    }
  };

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    setGenerating(true);
    try {
      const result = await api<{ created: number; skipped: number; totalStudents: number }>("/admin/invoices/generate", {
        method: "POST",
        body: {
          feeStructureId: generateForm.feeStructureId,
          classId: generateForm.classId || null,
          dueDate: generateForm.dueDate || undefined
        }
      });
      toast.success(`Generated ${result.created} invoices (${result.skipped} skipped, ${result.totalStudents} matched).`);
      invoices.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setGenerating(false);
    }
  };

  const invoiceColumns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      label: "Invoice",
      render: (invoice) => <span className="font-mono text-xs font-medium text-brand-800">{invoice.invoiceNumber}</span>
    },
    {
      key: "student",
      label: "Student",
      render: (invoice) => (
        <div>
          <p className="font-medium text-brand-950">{studentName(invoice)}</p>
          <p className="text-xs text-muted">
            {invoice.student && typeof invoice.student === "object" ? invoice.student.studentId : ""}
          </p>
        </div>
      )
    },
    {
      key: "dueDate",
      label: "Due",
      render: (invoice) => <span className="text-xs">{formatDate(invoice.dueDate, locale)}</span>
    },
    {
      key: "total",
      label: "Total",
      render: (invoice) => <span className="font-medium">{formatMoney(invoice.total, locale)}</span>
    },
    {
      key: "balance",
      label: "Balance",
      render: (invoice) => (
        <span className={invoice.balance > 0 ? "font-semibold text-red-800" : "text-emerald-800"}>
          {formatMoney(invoice.balance, locale)}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (invoice) => <Badge tone={statusTones[invoice.status] || "neutral"}>{formatStatus(invoice.status, locale)}</Badge>
    },
    {
      key: "actions",
      label: "",
      className: "text-end",
      headerClassName: "text-end",
      render: (invoice) => (
        <Button type="button" variant="ghost" size="sm" onClick={() => setDetailId(invoice._id)}>
          Open
        </Button>
      )
    }
  ];

  const paymentRows = detail.data?.payments || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">Finance</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Fees & invoices</h1>
          <p className="mt-1 text-sm text-muted">Invoice students, record payments and monitor outstanding balances.</p>
        </div>
        <Button size="sm" onClick={openInvoice}>
          <FilePlus2 className="h-4 w-4" /> New invoice
        </Button>
      </div>

      <Tabs
        tabs={[
          { value: "invoices", label: "Invoices" },
          { value: "structures", label: "Fee structures" },
          { value: "generate", label: "Generate invoices" },
          { value: "overview", label: "Collections" }
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "invoices" ? (
        <div className="space-y-4">
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
                  placeholder="Search invoice number or student…"
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
                {["unpaid", "partial", "paid", "overdue"].map((value) => (
                  <option key={value} value={value}>
                    {formatStatus(value, locale)}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {invoices.error ? (
            <ErrorState description={invoices.error} onRetry={invoices.reload} />
          ) : (
            <>
              <DataTable
                columns={invoiceColumns}
                rows={invoiceRows}
                keyFor={(invoice) => invoice._id}
                loading={invoices.loading}
                onRowClick={(invoice) => setDetailId(invoice._id)}
                empty={<EmptyState title="No invoices" description="Create an invoice or generate them from a fee structure." />}
              />
              {invoices.data?.pagination ? (
                <Pagination
                  page={invoices.data.pagination.page}
                  pages={invoices.data.pagination.pages}
                  onChange={setPage}
                  label={(value) => `Page ${value} of ${invoices.data?.pagination?.pages || 1}`}
                />
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {tab === "structures" ? (
        <ResourceManager<FeeStructure>
          endpoint="/admin/fee-structures"
          title="Fee structures"
          description="Reusable fee templates for generating invoices by class or program."
          createLabel="Add structure"
          keyFor={(structure) => structure._id}
          fields={structureFields}
          columns={[
            { key: "name", label: "Structure", render: (structure) => <span className="font-medium">{structure.name}</span> },
            { key: "items", label: "Items", render: (structure) => structure.items?.length || 0 },
            {
              key: "amount",
              label: "Total",
              render: (structure) =>
                formatMoney((structure.items || []).reduce((sum, item) => sum + item.amount, 0), locale)
            },
            {
              key: "active",
              label: "Status",
              render: (structure) => (structure.active ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>)
            }
          ]}
        />
      ) : null}

      {tab === "generate" ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Generate invoices</CardTitle>
              <CardDescription>
                Create invoices for every active student matching the fee structure. Existing invoices for the same
                structure are skipped.
              </CardDescription>
            </div>
            <ReceiptText className="h-5 w-5 text-brand-700" />
          </CardHeader>
          <form onSubmit={generate} className="grid gap-4 md:grid-cols-3">
            <FormField label="Fee structure" required>
              <Select
                value={generateForm.feeStructureId}
                onChange={(event) => setGenerateForm({ ...generateForm, feeStructureId: event.target.value })}
                required
              >
                <option value="">Select structure…</option>
                {(structures.data?.items || []).map((structure) => (
                  <option key={structure._id} value={structure._id}>
                    {structure.name} {structure.active ? "" : "(inactive)"}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Class filter" hint="Optional. Leave blank for all matching students.">
              <Select
                value={generateForm.classId}
                onChange={(event) => setGenerateForm({ ...generateForm, classId: event.target.value })}
              >
                <option value="">All classes</option>
                {classOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Due date" hint="Optional. Defaults to the structure's due date.">
              <Input
                type="date"
                value={generateForm.dueDate}
                onChange={(event) => setGenerateForm({ ...generateForm, dueDate: event.target.value })}
              />
            </FormField>
            <div className="md:col-span-3">
              <Button type="submit" loading={generating} disabled={!generateForm.feeStructureId}>
                <FilePlus2 className="h-4 w-4" /> Generate invoices
              </Button>
            </div>
          </form>
          {structures.error ? <p className="mt-3 text-xs text-red-700">{structures.error}</p> : null}
        </Card>
      ) : null}

      {tab === "overview" ? (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <FormField label="From">
                <Input type="date" value={collectionsFrom} onChange={(event) => setCollectionsFrom(event.target.value)} />
              </FormField>
              <FormField label="To">
                <Input type="date" value={collectionsTo} onChange={(event) => setCollectionsTo(event.target.value)} />
              </FormField>
              <Button variant="outline" onClick={collections.reload} className="h-11">
                Refresh
              </Button>
            </div>
          </Card>
          {collections.error ? (
            <ErrorState description={collections.error} onRetry={collections.reload} />
          ) : collections.loading && !collections.data ? (
            <LoadingPanel label="Loading collections…" />
          ) : collections.data ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Collected"
                  value={formatMoney(collections.data.total, locale)}
                  hint={`${collections.data.transactions} transactions`}
                  icon={<Banknote className="h-5 w-5" />}
                  tone="success"
                />
                <StatCard
                  label="Cash"
                  value={formatMoney(collections.data.methods.cash || 0, locale)}
                  icon={<Wallet className="h-5 w-5" />}
                  tone="gold"
                />
                <StatCard
                  label="Bank transfer"
                  value={formatMoney(collections.data.methods.bank_transfer || 0, locale)}
                  icon={<Banknote className="h-5 w-5" />}
                  tone="info"
                />
                <StatCard
                  label="Outstanding"
                  value={formatMoney(collections.data.outstanding, locale)}
                  hint={`${collections.data.outstandingInvoices} invoices`}
                  icon={<ReceiptText className="h-5 w-5" />}
                  tone={collections.data.outstanding > 0 ? "danger" : "success"}
                />
              </div>
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Collection period</CardTitle>
                    <CardDescription>
                      {formatDate(collections.data.from, locale)} – {formatDate(collections.data.to, locale)}
                    </CardDescription>
                  </div>
                </CardHeader>
                <Link href="/admin/finance" className="text-xs font-semibold text-brand-800" onClick={() => setTab("invoices")}>
                  Open invoice list
                </Link>
              </Card>
            </>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title="New invoice"
        description="Create a one-off invoice for an active student."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="invoice-form" loading={invoiceSaving}>
              Create invoice
            </Button>
          </div>
        }
      >
        <form id="invoice-form" onSubmit={submitInvoice} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Student" required>
              <Select
                value={invoiceForm.studentId}
                onChange={(event) => setInvoiceForm({ ...invoiceForm, studentId: event.target.value })}
                required
              >
                <option value="">Select student…</option>
                {(students.data?.items || []).map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} · {student.studentId}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Session" hint="Defaults to the student's session.">
              <Select
                value={invoiceForm.session}
                onChange={(event) => setInvoiceForm({ ...invoiceForm, session: event.target.value })}
              >
                <option value="">Student&apos;s session</option>
                {sessionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Due date" required>
              <Input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(event) => setInvoiceForm({ ...invoiceForm, dueDate: event.target.value })}
                required
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Discount">
                <Input
                  type="number"
                  min={0}
                  value={invoiceForm.discount}
                  onChange={(event) => setInvoiceForm({ ...invoiceForm, discount: event.target.value })}
                />
              </FormField>
              <FormField label="Fine">
                <Input
                  type="number"
                  min={0}
                  value={invoiceForm.fine}
                  onChange={(event) => setInvoiceForm({ ...invoiceForm, fine: event.target.value })}
                />
              </FormField>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-brand-950">Line items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInvoiceForm({ ...invoiceForm, items: [...invoiceForm.items, { title: "", amount: "" }] })}
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {invoiceForm.items.map((item, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
                  <Input
                    placeholder="Fee title"
                    value={item.title}
                    onChange={(event) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        items: invoiceForm.items.map((entry, i) =>
                          i === index ? { ...entry, title: event.target.value } : entry
                        )
                      })
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(event) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        items: invoiceForm.items.map((entry, i) =>
                          i === index ? { ...entry, amount: event.target.value } : entry
                        )
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setInvoiceForm({
                        ...invoiceForm,
                        items: invoiceForm.items.length > 1 ? invoiceForm.items.filter((_, i) => i !== index) : invoiceForm.items
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <FormField label="Notes">
            <Textarea
              rows={2}
              value={invoiceForm.notes}
              onChange={(event) => setInvoiceForm({ ...invoiceForm, notes: event.target.value })}
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        title={detail.data ? `Invoice ${detail.data.invoice.invoiceNumber}` : "Invoice"}
        description={detail.data?.invoice.student && typeof detail.data.invoice.student === "object"
          ? `${detail.data.invoice.student.name} · ${detail.data.invoice.student.studentId}`
          : undefined}
        size="lg"
      >
        {detail.error ? (
          <ErrorState description={detail.error} onRetry={detail.reload} />
        ) : detail.loading && !detail.data ? (
          <LoadingPanel label="Loading invoice…" />
        ) : detail.data ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Badge tone={statusTones[detail.data.invoice.status] || "neutral"}>
                  {formatStatus(detail.data.invoice.status, locale)}
                </Badge>
                <Badge tone="neutral">Due {formatDate(detail.data.invoice.dueDate, locale)}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-display text-2xl font-semibold text-brand-950">
                  {formatMoney(detail.data.invoice.balance, locale)} <span className="text-xs font-normal text-muted">due</span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/print/invoices/${detail.data?.invoice._id}`, "_blank", "noopener")}
                >
                  <Printer className="h-4 w-4" /> Print
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-950/10 bg-white">
              <div className="border-b border-brand-950/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Line items
              </div>
              {detail.data.invoice.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-brand-950/5 px-4 py-2 text-sm last:border-0">
                  <span>{item.title}</span>
                  <span>{formatMoney(item.amount, locale)}</span>
                </div>
              ))}
              <div className="space-y-1 px-4 py-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Discount</span>
                  <span>-{formatMoney(detail.data.invoice.discount, locale)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Fine</span>
                  <span>{formatMoney(detail.data.invoice.fine, locale)}</span>
                </div>
                <div className="flex justify-between font-semibold text-brand-950">
                  <span>Total</span>
                  <span>{formatMoney(detail.data.invoice.total, locale)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Paid</span>
                  <span>{formatMoney(detail.data.invoice.paid, locale)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-brand-950">Payments</h3>
              {paymentRows.length ? (
                <div className="mt-2 divide-y divide-brand-950/5 rounded-2xl border border-brand-950/10 bg-white">
                  {paymentRows.map((payment) => (
                    <div key={payment._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-brand-950">
                          {payment.receiptNumber} {payment.isReversal ? <Badge tone="danger">Reversal</Badge> : null}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(payment.paidAt, locale, true)} · {formatStatus(payment.method, locale)}
                          {payment.reference ? ` · ${payment.reference}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={payment.amount < 0 ? "font-semibold text-red-800" : "font-semibold text-emerald-800"}>
                          {formatMoney(payment.amount, locale)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Print receipt"
                          onClick={() => window.open(`/print/receipts/${payment._id}`, "_blank", "noopener")}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {!payment.isReversal ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Reverse payment"
                            onClick={() => void reversePayment(payment)}
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-xl border border-dashed border-brand-950/15 px-4 py-4 text-sm text-muted">
                  No payments recorded yet.
                </p>
              )}
            </div>

            {detail.data.invoice.balance > 0 ? (
              <form onSubmit={submitPayment} className="rounded-2xl border border-brand-950/10 bg-brand-950/[0.02] p-4">
                <h3 className="font-display text-lg font-semibold text-brand-950">Record payment</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <FormField label="Amount" required>
                    <Input
                      type="number"
                      min={0}
                      max={detail.data.invoice.balance}
                      step="any"
                      value={payForm.amount}
                      onChange={(event) => setPayForm({ ...payForm, amount: event.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Method" required>
                    <Select
                      value={payForm.method}
                      onChange={(event) => setPayForm({ ...payForm, method: event.target.value })}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank transfer</option>
                    </Select>
                  </FormField>
                  <FormField label="Reference">
                    <Input
                      value={payForm.reference}
                      onChange={(event) => setPayForm({ ...payForm, reference: event.target.value })}
                    />
                  </FormField>
                  <FormField label="Paid at" hint="Defaults to now.">
                    <Input
                      type="datetime-local"
                      value={payForm.paidAt}
                      onChange={(event) => setPayForm({ ...payForm, paidAt: event.target.value })}
                    />
                  </FormField>
                  <FormField label="Note" className="sm:col-span-2">
                    <Input value={payForm.note} onChange={(event) => setPayForm({ ...payForm, note: event.target.value })} />
                  </FormField>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button type="submit" loading={paySaving}>
                    <Banknote className="h-4 w-4" /> Save payment
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
