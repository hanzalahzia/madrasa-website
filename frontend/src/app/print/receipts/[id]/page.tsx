"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import type { Invoice, Payment, PublicSettings, Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingPanel } from "@/components/ui/feedback";

interface ReceiptPayment extends Omit<Payment, "invoice"> {
  invoice: Omit<Invoice, "student"> & { student?: Student };
}

export default function PrintReceiptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, localized } = useLanguage();
  const detail = useApi<ReceiptPayment>(`/admin/payments/${params.id}/receipt`);
  const settings = useApi<PublicSettings>("/public/settings");
  const payment = detail.data;
  const invoice = payment?.invoice;
  const student = invoice?.student;
  const site = settings.data;

  return (
    <div className="min-h-screen bg-ivory px-4 py-6 text-ink print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button type="button" size="sm" onClick={() => window.print()} disabled={!payment}>
          <Printer className="h-4 w-4" /> Print receipt
        </Button>
      </div>

      {detail.error ? (
        <div className="mx-auto max-w-3xl">
          <ErrorState description={detail.error} onRetry={detail.reload} />
        </div>
      ) : detail.loading && !payment ? (
        <div className="mx-auto max-w-3xl">
          <LoadingPanel label="Preparing receipt…" />
        </div>
      ) : payment ? (
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-700">Payment receipt</p>
              <p className="mt-1 font-mono text-lg font-semibold text-brand-950">{payment.receiptNumber}</p>
              <p className="mt-1 text-xs text-muted">{formatDate(payment.paidAt, locale, true)}</p>
              {payment.isReversal ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-red-800">Reversal entry</p>
              ) : null}
            </div>
          </div>

          <div className="py-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Amount received</p>
            <p className="mt-2 font-display text-4xl font-semibold text-brand-950">{formatMoney(payment.amount, locale)}</p>
            <p className="mt-3 text-sm text-muted">
              Received with thanks from <span className="font-medium text-brand-950">{student?.name || "Student"}</span>
              {student?.studentId ? ` (${student.studentId})` : ""}.
            </p>
          </div>

          <div className="grid gap-x-8 gap-y-3 border-y border-brand-950/10 py-5 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Invoice</p>
              <p className="mt-1 font-mono text-brand-950">{invoice?.invoiceNumber || "-"}</p>
            </div>
            <div className="flex justify-between gap-4 sm:block sm:text-end">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Payment method</p>
              <p className="mt-1 text-brand-950">{formatStatus(payment.method, locale)}</p>
            </div>
            <div className="flex justify-between gap-4 sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Reference</p>
              <p className="mt-1 text-brand-950">{payment.reference || "—"}</p>
            </div>
            <div className="flex justify-between gap-4 sm:block sm:text-end">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Invoice status</p>
              <p className="mt-1 text-brand-950">{formatStatus(invoice?.status, locale)}</p>
            </div>
          </div>

          {invoice ? (
            <div className="mt-5 ms-auto w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Invoice total</span>
                <span>{formatMoney(invoice.total, locale)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Total paid</span>
                <span>{formatMoney(invoice.paid, locale)}</span>
              </div>
              <div className="flex justify-between border-t border-brand-950/10 pt-1.5 font-semibold text-brand-950">
                <span>Balance due</span>
                <span>{formatMoney(invoice.balance, locale)}</span>
              </div>
            </div>
          ) : null}

          {payment.note ? <p className="mt-6 text-sm text-muted">Note: {payment.note}</p> : null}

          <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-brand-950/10 pt-6">
            <p className="max-w-md text-[11px] leading-relaxed text-muted">
              This receipt is computer generated and is valid without a signature. Please retain it for your records.
            </p>
            <div className="w-44 border-t border-brand-950/30 pt-2 text-center text-[11px] text-muted">
              Authorised signature
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
}
