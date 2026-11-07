"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatMoney } from "@/lib/format";
import type { PublicSettings } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/feedback";

export default function CartPage() {
  const { t, localized, locale } = useLanguage();
  const { items, update, remove, subtotal, hydrated, count } = useCart();
  const { data: settings } = useApi<PublicSettings>("/public/settings");

  const shipping =
    items.length && settings
      ? settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove
        ? 0
        : settings.shippingFee
      : 0;
  const remaining = settings ? Math.max(0, settings.freeShippingAbove - subtotal) : 0;

  return (
    <>
      <PageHero
        eyebrow={t("nav.books")}
        title={t("cart.title")}
        description={t("books.storeNote")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.cart") }]}
        compact
      />
      <Section>
        {!hydrated ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : !items.length ? (
          <EmptyState
            title={t("cart.empty")}
            description={t("cart.emptyHint")}
            icon={<ShoppingBag className="h-6 w-6" />}
            action={
              <ButtonLink href="/books" variant="primary" className="mt-2">
                {t("cart.continue")}
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.bookId}
                  className="flex gap-4 rounded-2xl border border-brand-950/10 bg-white/90 p-4 shadow-card"
                >
                  <Link href={`/books/${item.slug}`} className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-950">
                    {item.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverImage} alt={localized(item.title)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="pattern-islamic flex h-full items-center justify-center p-2 text-center font-display text-[11px] text-gold-300">
                        {localized(item.title)}
                      </div>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/books/${item.slug}`} className="line-clamp-2 font-display text-lg font-semibold text-brand-950 hover:text-brand-800">
                          {localized(item.title)}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">
                          {item.author} · {item.sku}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.bookId)}
                        className="rounded-full p-2 text-muted transition hover:bg-red-50 hover:text-red-700"
                        aria-label={t("cart.removeItem")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <div className="flex items-center gap-1 rounded-full border border-brand-950/10 p-1">
                        <button
                          type="button"
                          onClick={() => update(item.bookId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="rounded-full p-1.5 text-brand-950 transition hover:bg-brand-950/5 disabled:opacity-40"
                          aria-label="-"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => update(item.bookId, item.quantity + 1)}
                          disabled={item.quantity >= Math.min(20, item.stock)}
                          className="rounded-full p-1.5 text-brand-950 transition hover:bg-brand-950/5 disabled:opacity-40"
                          aria-label="+"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="text-end">
                        <p className="text-sm font-semibold text-brand-950">{formatMoney(item.price * item.quantity, locale)}</p>
                        <p className="text-[10px] text-muted">{formatMoney(item.price, locale)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <Link href="/books" className="text-sm font-medium text-brand-800 underline underline-offset-4">
                  {t("cart.continue")}
                </Link>
                <span className="text-xs text-muted">
                  {count} {count === 1 ? t("cart.item") : t("cart.items")}
                </span>
              </div>
            </div>
            <aside>
              <Card className="sticky top-28">
                <h2 className="font-display text-xl font-semibold text-brand-950">{t("checkout.summary")}</h2>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{t("cart.subtotal")}</dt>
                    <dd className="font-medium">{formatMoney(subtotal, locale)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{t("cart.shipping")}</dt>
                    <dd className="font-medium">{shipping === 0 ? t("cart.freeShipping") : formatMoney(shipping, locale)}</dd>
                  </div>
                  <div className="border-t border-brand-950/10 pt-3">
                    <div className="flex justify-between gap-4 text-base">
                      <dt className="font-semibold">{t("cart.total")}</dt>
                      <dd className="font-display text-xl font-semibold text-brand-950">{formatMoney(subtotal + shipping, locale)}</dd>
                    </div>
                  </div>
                </dl>
                {settings && remaining > 0 ? (
                  <p className="mt-3 rounded-lg bg-gold-50 p-2.5 text-[11px] leading-relaxed text-gold-900">
                    {t("checkout.freeShippingRemaining").replace("{amount}", formatMoney(remaining, locale))}
                  </p>
                ) : null}
                <ButtonLink href="/checkout" variant="primary" className="mt-5 w-full">
                  {t("cart.checkout")}
                </ButtonLink>
                <ButtonLink
                  href="/checkout"
                  variant="outline"
                  className="mt-2 w-full border-[#25D366]/40 bg-[#25D366]/10 text-[#128C4A] hover:border-[#25D366]/60 hover:bg-[#25D366]/15"
                >
                  <WhatsAppIcon className="h-4 w-4" /> {t("cart.whatsappOrder")}
                </ButtonLink>
                <p className="mt-2 text-center text-[10px] leading-relaxed text-muted">{t("cart.whatsappHint")}</p>
                <p className="mt-3 text-center text-[10px] leading-relaxed text-muted">{t("cart.shippingNote")}</p>
                <p className="mt-1 text-center text-[10px] leading-relaxed text-muted">{t("cart.maxQuantity")}</p>
              </Card>
            </aside>
          </div>
        )}
      </Section>
    </>
  );
}
