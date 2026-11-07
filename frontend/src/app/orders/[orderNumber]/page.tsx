"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Printer } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import type { Order, PublicSettings } from "@/lib/types";
import { Section } from "@/components/site/section";
import { Badge, Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState, LoadingPanel } from "@/components/ui/feedback";

export default function OrderPage() {
  return (
    <Suspense fallback={<Section><LoadingPanel /></Section>}>
      <OrderView />
    </Suspense>
  );
}

function OrderView() {
  const params = useParams<{ orderNumber: string }>();
  const searchParams = useSearchParams();
  const { t, localized, locale } = useLanguage();
  const token = searchParams.get("token");
  const path = useMemo(
    () => `/public/orders/${params.orderNumber}${token ? `?token=${encodeURIComponent(token)}` : ""}`,
    [params.orderNumber, token]
  );
  const { data: order, loading, error, reload } = useApi<Order>(path);
  const { data: settings } = useApi<PublicSettings>("/public/settings");

  if (loading) {
    return (
      <Section>
        <LoadingPanel label={t("state.loading")} />
      </Section>
    );
  }

  if (error || !order) {
    return (
      <Section>
        <ErrorState title={t("state.notFound")} description={error || t("state.notFoundHint")} onRetry={reload} />
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/books" variant="outline">
            {t("nav.books")}
          </ButtonLink>
          <ButtonLink href="/contact" variant="primary">
            {t("nav.contact")}
          </ButtonLink>
        </div>
      </Section>
    );
  }

  const paid = order.paymentStatus === "paid" || order.paymentStatus === "cash_on_delivery";

  return (
    <Section className="max-w-4xl">
      <div className="no-print mb-6 text-center">
        <span className="inline-flex rounded-full bg-emerald-100 p-3 text-emerald-800">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-brand-950">{t("order.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("order.thankyouText")}</p>
      </div>
      <Card className="print-surface">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-brand-950/10 pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t("checkout.summary")}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-brand-950">{order.orderNumber}</p>
            <p className="mt-1 text-xs text-muted">{formatDate(order.createdAt, locale, true)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={order.paymentStatus === "paid" ? "success" : "warning"}>
              {order.paymentMethod === "cod" ? t("checkout.cod") : t("checkout.bank")}
            </Badge>
            <Badge tone="info">{formatStatus(order.paymentStatus, locale)}</Badge>
            <Badge tone={order.fulfilmentStatus === "delivered" ? "success" : "neutral"}>{formatStatus(order.fulfilmentStatus, locale)}</Badge>
          </div>
        </div>
        <div className="grid gap-6 border-b border-brand-950/10 py-5 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{t("checkout.customer")}</h2>
            <p className="mt-2 text-sm font-medium text-ink">{order.customerName}</p>
            <p className="text-sm text-muted" dir="ltr">{order.phone}</p>
            {order.email ? <p className="text-sm text-muted" dir="ltr">{order.email}</p> : null}
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{t("checkout.delivery")}</h2>
            <p className="mt-2 text-sm text-ink">{order.address}</p>
            <p className="text-sm text-muted">{order.city}</p>
            {order.notes ? <p className="mt-1 text-xs text-muted">{order.notes}</p> : null}
          </div>
        </div>
        <ul className="divide-y divide-brand-950/5 py-3">
          {order.items.map((item) => (
            <li key={item.bookId} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span>
                <span className="font-medium text-ink">{item.title}</span>
                <span className="ms-2 text-xs text-muted">
                  {item.quantity} × {formatMoney(item.unitPrice, locale)}
                </span>
              </span>
              <span className="font-semibold">{formatMoney(item.lineTotal, locale)}</span>
            </li>
          ))}
        </ul>
        <dl className="ms-auto max-w-xs space-y-2 border-t border-brand-950/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t("cart.subtotal")}</dt>
            <dd>{formatMoney(order.subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t("cart.shipping")}</dt>
            <dd>{order.shipping === 0 ? t("cart.freeShipping") : formatMoney(order.shipping, locale)}</dd>
          </div>
          <div className="flex justify-between border-t border-brand-950/10 pt-2 text-base font-semibold">
            <dt>{t("cart.total")}</dt>
            <dd className="font-display text-xl">{formatMoney(order.total, locale)}</dd>
          </div>
        </dl>
        {order.paymentMethod === "bank_transfer" && !paid ? (
          <div className="mt-5 rounded-xl border border-gold-200 bg-gold-50 p-4">
            <h3 className="text-sm font-semibold text-gold-900">{t("checkout.bank")}</h3>
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gold-900/80">
              {localized(settings?.bankDetails) || t("checkout.bankHint")}
            </p>
          </div>
        ) : null}
        {order.statusHistory?.length ? (
          <div className="mt-6 border-t border-brand-950/10 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{t("portal.orderHistory")}</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-muted">
              {order.statusHistory.map((entry, index) => (
                <li key={index} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {formatStatus(entry.fulfilmentStatus || entry.paymentStatus, locale)}
                    {entry.note ? ` — ${entry.note}` : ""}
                  </span>
                  <span>{entry.at ? formatDate(entry.at, locale, true) : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
      <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> {t("action.print")}
        </Button>
        <ButtonLink href="/books" variant="primary">
          {t("nav.books")}
        </ButtonLink>
        <Link href="/account" className="self-center text-sm font-medium text-brand-800 underline underline-offset-4">
          {t("auth.myAccount")}
        </Link>
      </div>
    </Section>
  );
}
