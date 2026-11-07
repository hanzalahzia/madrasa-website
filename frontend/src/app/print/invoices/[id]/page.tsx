"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import type { Invoice, Payment, PublicSettings, Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingPanel } from "@/components/ui/feedback";

interface InvoiceDetail {
  invoice: Omit<Invoice, "student"> & { student?: Student };
  payments: Payment[];
}

export default function PrintInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, localized } = useLanguage();
  const detail = useApi<InvoiceDetail>(`/admin/invoices/${params.id}`);
  const settings = useApi<PublicSettings>("/public/settings");
  const invoice = detail.data?.invoice;
  const student = invoice?.student;
  const guardian = student?.guardian;
  const session = invoice && invoice.session && typeof invoice.session === "object" ? invoice.session.name : "";
  const site = settings.data;

  return (
    <div className="min-h-screen bg-ivory px-4 py-6 text-ink print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button type="button" size="sm" onClick={() => window.print()} disabled={!invoice}>
          <Printer className="h-4 w-4" /> Print invoice
        </Button>
      </div>

      {detail.error ? (
        <div className="mx-auto max-w-3xl">
          <ErrorState description={detail.error} onRetry={detail.reload} />
        </div>
      ) : detail.loading && !invoice ? (
        <div className="mx-auto max-w-3xl">
          <LoadingPanel label="Preparing invoice…" />
        </div>
      ) : invoice ? (
        <article className="print-surface mx-auto max-w-3xl rounded-2xl border border-brand-950/10 bg-white p-8 shadow-card print:max-w-none print:rounded-none">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-brand-950/10 pb-6">
            <div>
              <p className="font-display text-2xl font-semibold text-brand-950">{site?.siteName || "Madrasa Miftah ul Uloom"}</p>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">{localized(site?.address)}</p>
              <p className="mt-1 text-sm text-muted">
                {[site?.contactPhone, site?.contactEmail].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="text-end">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-700">Fee invoice</p>
              <p className="mt-1 font-mono text-lg font-semibold text-brand-950">{invoice.invoiceNumber}</p>
              <p className="mt-1 text-xs text-muted">Issued {formatDate(invoice.createdAt, locale)}</p>
              <p className="text-xs text-muted">Due {formatDate(invoice.dueDate, locale)}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-brand-800">
                {formatStatus(invoice.status, locale)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 border-b border-brand-950/10 py-6 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Billed to</p>
              <p className="mt-2 font-medium text-brand-950">{student?.name || "Student"}</p>
              <p className="text-sm text-muted">{student?.studentId}</p>
              {session ? <p className="text-sm text-muted">Session: {session}</p> : null}
              {guardian?.name ? (
                <p className="mt-1 text-sm text-muted">
                  Guardian: {guardian.name}
                  {guardian.phone ? ` · ${guardian.phone}` : ""}
                </p>
              ) : null}
              {student?.address ? <p className="mt-1 text-sm text-muted">{student.address}</p> : null}
            </div>
            <div className="sm:text-end">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Balance due</p>
              <p className="mt-2 font-display text-3xl font-semibold text-brand-950">{formatMoney(invoice.balance, locale)}</p>
              <p className="text-sm text-muted">Paid {formatMoney(invoice.paid, locale)} of {formatMoney(invoice.total, locale)}</p>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-brand-950/10 text-start text-[10px] uppercase tracking-[0.16em] text-muted">
                <th className="pb-2 text-start font-semibold">Description</th>
                <th className="pb-2 text-end font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-brand-950/5">
                  <td className="py-2.5">{item.title}</td>
                  <td className="py-2.5 text-end">{formatMoney(item.amount, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ms-auto w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatMoney(invoice.total - invoice.fine + invoice.discount, locale)}</span>
            </div>
            {invoice.discount ? (
              <div className="flex justify-between text-muted">
                <span>Discount</span>
                <span>-{formatMoney(invoice.discount, locale)}</span>
              </div>
            ) : null}
            {invoice.fine ? (
              <div className="flex justify-between text-muted">
                <span>Fine</span>
                <span>{formatMoney(invoice.fine, locale)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-brand-950/10 pt-1.5 font-semibold text-brand-950">
              <span>Total</span>
              <span>{formatMoney(invoice.total, locale)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Paid</span>
              <span>{formatMoney(invoice.paid, locale)}</span>
            </div>
            <div className="flex justify-between font-semibold text-brand-950">
              <span>Balance due</span>
              <span>{formatMoney(invoice.balance, locale)}</span>
            </div>
          </div>

          {detail.data?.payments.length ? (
            <div className="mt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Payment history</p>
              <div className="mt-2 divide-y divide-brand-950/5 border-y border-brand-950/10">
                {detail.data.payments.map((payment) => (
                  <div key={payment._id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                    <span>
                      {payment.receiptNumber} · {formatDate(payment.paidAt, locale)}
                      {payment.isReversal ? " · Reversal" : ""}
                    </span>
                    <span className={payment.amount < 0 ? "text-red-800" : "text-emerald-800"}>
                      {formatMoney(payment.amount, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {invoice.notes ? <p className="mt-6 whitespace-pre-wrap text-sm text-muted">{invoice.notes}</p> : null}

          <p className="mt-10 border-t border-brand-950/10 pt-4 text-center text-[11px] text-muted">
            {site?.siteName || "Madrasa Miftah ul Uloom"} · {localized(site?.address)} · Thank you for your continued support.
          </p>
        </article>
      ) : null}
    </div>
  );
}
