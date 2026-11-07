"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { api, fieldError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";
import { formatMoney } from "@/lib/format";
import type { Order, PublicSettings, WhatsAppOrderResponse } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingPanel } from "@/components/ui/feedback";
import { CheckRow, FormField, Input } from "@/components/ui/field";

interface OrderResponse {
  order: Order;
  accessToken: string;
  paymentMethod: "cod" | "bank_transfer";
  instructions: { en?: string; ur?: string; ar?: string } | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t, localized, locale } = useLanguage();
  const { user } = useAuth();
  const { items, subtotal, clear, hydrated } = useCart();
  const { data: settings, loading: settingsLoading } = useApi<PublicSettings>("/public/settings");
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: ""
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");
  const [placing, setPlacing] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      customerName: current.customerName || user.name,
      email: current.email || user.email,
      phone: current.phone || user.phone || ""
    }));
  }, [user]);

  useEffect(() => {
    if (!settings) return;
    if (!settings.codEnabled && settings.bankTransferEnabled) setPaymentMethod("bank_transfer");
    if (!settings.bankTransferEnabled && settings.codEnabled) setPaymentMethod("cod");
  }, [settings]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const shipping =
    items.length && settings
      ? settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove
        ? 0
        : settings.shippingFee
      : 0;

  function validate() {
    if (
      form.customerName.trim().length < 2 ||
      form.phone.trim().length < 7 ||
      form.address.trim().length < 8 ||
      form.city.trim().length < 2
    ) {
      setError(t("form.required"));
      return false;
    }
    return true;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!validate()) return;
    setPlacing(true);
    try {
      const result = await api<OrderResponse>("/public/orders", {
        method: "POST",
        body: {
          items: items.map((item) => ({ bookId: item.bookId, quantity: item.quantity })),
          ...form,
          paymentMethod
        }
      });
      clear();
      toast.success(t("checkout.placed"));
      router.push(`/orders/${result.order.orderNumber}?token=${encodeURIComponent(result.accessToken)}`);
    } catch (caught) {
      setError(fieldError(caught) || (caught instanceof Error ? caught.message : t("state.error")));
    } finally {
      setPlacing(false);
    }
  }

  async function submitWhatsApp() {
    setError(null);
    if (!validate()) return;
    setSendingWhatsApp(true);
    try {
      const result = await api<WhatsAppOrderResponse>("/public/whatsapp-orders", {
        method: "POST",
        body: {
          items: items.map((item) => ({ bookId: item.bookId, quantity: item.quantity })),
          customerName: form.customerName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          notes: form.notes
        }
      });
      clear();
      toast.success(t("checkout.whatsappPlaced"));
      window.location.href = result.whatsappUrl;
    } catch (caught) {
      setError(fieldError(caught) || (caught instanceof Error ? caught.message : t("state.error")));
    } finally {
      setSendingWhatsApp(false);
    }
  }

  if (!hydrated || settingsLoading) {
    return (
      <Section>
        <LoadingPanel label={t("state.loading")} />
      </Section>
    );
  }

  if (!items.length) {
    return (
      <Section>
        <EmptyState
          title={t("cart.empty")}
          description={t("checkout.empty")}
          icon={<ShoppingBag className="h-6 w-6" />}
          action={
            <ButtonLink href="/books" className="mt-2">
              {t("cart.continue")}
            </ButtonLink>
          }
        />
      </Section>
    );
  }

  const paymentOptions = [];
  if (settings?.codEnabled !== false) {
    paymentOptions.push({ value: "cod" as const, label: t("checkout.cod"), hint: t("checkout.codHint") });
  }
  if (settings?.bankTransferEnabled) {
    paymentOptions.push({ value: "bank_transfer" as const, label: t("checkout.bank"), hint: t("checkout.bankHint") });
  }

  return (
    <>
      <PageHero
        eyebrow={t("nav.books")}
        title={t("checkout.title")}
        description={t("checkout.subtitle")}
        breadcrumbs={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.cart"), href: "/cart" },
          { label: t("checkout.title") }
        ]}
        compact
      />
      <Section>
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_23rem]">
          <div className="space-y-5">
            <Card>
              <h2 className="font-display text-xl font-semibold text-brand-950">{t("checkout.customer")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label={t("form.fullName")} htmlFor="checkout-name" required>
                  <Input id="checkout-name" value={form.customerName} onChange={(event) => update("customerName", event.target.value)} autoComplete="name" required />
                </FormField>
                <FormField label={t("form.phone")} htmlFor="checkout-phone" required>
                  <Input id="checkout-phone" type="tel" dir="ltr" value={form.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" required />
                </FormField>
                <FormField label={t("form.email")} htmlFor="checkout-email" className="sm:col-span-2">
                  <Input id="checkout-email" type="email" dir="ltr" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" />
                </FormField>
              </div>
            </Card>
            <Card>
              <h2 className="font-display text-xl font-semibold text-brand-950">{t("checkout.delivery")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label={t("form.address")} htmlFor="checkout-address" required className="sm:col-span-2">
                  <Input id="checkout-address" value={form.address} onChange={(event) => update("address", event.target.value)} autoComplete="street-address" required />
                </FormField>
                <FormField label={t("form.city")} htmlFor="checkout-city" required>
                  <Input id="checkout-city" value={form.city} onChange={(event) => update("city", event.target.value)} autoComplete="address-level2" required />
                </FormField>
                <FormField label={t("form.notes")} htmlFor="checkout-notes">
                  <Input id="checkout-notes" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
                </FormField>
              </div>
            </Card>
            <Card>
              <h2 className="font-display text-xl font-semibold text-brand-950">{t("checkout.payment")}</h2>
              <div className="mt-4 space-y-2">
                {paymentOptions.map((option) => (
                  <CheckRow key={option.value} label={option.label} hint={option.hint}>
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={paymentMethod === option.value}
                      onChange={() => setPaymentMethod(option.value)}
                      className="h-4 w-4 accent-brand-900"
                    />
                  </CheckRow>
                ))}
                {!paymentOptions.length ? (
                  <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{t("checkout.paymentUnavailable")}</p>
                ) : null}
              </div>
            </Card>
          </div>
          <aside>
            <Card className="sticky top-28">
              <h2 className="font-display text-xl font-semibold text-brand-950">{t("checkout.summary")}</h2>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.bookId} className="flex gap-3">
                    <span className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-brand-950 text-[10px] text-gold-300">
                      {item.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.coverImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        item.quantity
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-xs font-medium text-ink">{localized(item.title)}</span>
                      <span className="text-[10px] text-muted">
                        {item.quantity} × {formatMoney(item.price, locale)}
                      </span>
                    </span>
                    <span className="text-xs font-semibold">{formatMoney(item.price * item.quantity, locale)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-brand-950/10 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{t("cart.subtotal")}</dt>
                  <dd>{formatMoney(subtotal, locale)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{t("cart.shipping")}</dt>
                  <dd>{shipping === 0 ? t("cart.freeShipping") : formatMoney(shipping, locale)}</dd>
                </div>
                <div className="flex justify-between border-t border-brand-950/10 pt-2 text-base font-semibold">
                  <dt>{t("cart.total")}</dt>
                  <dd className="font-display text-xl">{formatMoney(subtotal + shipping, locale)}</dd>
                </div>
              </dl>
              {error ? <p className="mt-4 rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p> : null}
              <Button type="submit" loading={placing} className="mt-4 w-full" disabled={!paymentOptions.length}>
                <Lock className="h-4 w-4" /> {placing ? t("checkout.placing") : t("checkout.placeOrder")}
              </Button>
              <Button
                type="button"
                variant="outline"
                loading={sendingWhatsApp}
                onClick={submitWhatsApp}
                className="mt-2 w-full border-[#25D366]/40 bg-[#25D366]/10 text-[#128C4A] hover:border-[#25D366]/60 hover:bg-[#25D366]/15"
              >
                {!sendingWhatsApp ? <WhatsAppIcon className="h-4 w-4" /> : null}
                {sendingWhatsApp ? t("checkout.whatsappOrdering") : t("checkout.whatsappOrder")}
              </Button>
              <p className="mt-2 text-[10px] leading-relaxed text-muted">{t("checkout.whatsappHint")}</p>
              <p className="mt-3 text-[10px] leading-relaxed text-muted">{t("checkout.terms")}</p>
              <p className="mt-2 text-[10px] leading-relaxed text-muted">{t("cart.shippingNote")}</p>
              <Link href="/cart" className="mt-3 block text-center text-xs font-medium text-brand-800 underline underline-offset-4">
                {t("nav.cart")}
              </Link>
            </Card>
          </aside>
        </form>
      </Section>
    </>
  );
}
