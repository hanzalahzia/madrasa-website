"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { api, fieldError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { PublicSettings } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { Stagger, StaggerItem } from "@/components/motion/primitives";

const emptyForm = { name: "", email: "", phone: "", subject: "", message: "", website: "" };

export default function ContactPage() {
  const { t, localized } = useLanguage();
  const { data: settings } = useApi<PublicSettings>("/public/settings");
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setField(null);
    if (!form.name.trim() || !form.subject.trim() || form.message.trim().length < 10) {
      setError(t("form.required"));
      return;
    }
    setSending(true);
    try {
      await api("/public/contact", { method: "POST", body: form });
      setSent(true);
      setForm(emptyForm);
      toast.success(t("contact.success"));
    } catch (caught) {
      setError(fieldError(caught) || (caught instanceof Error ? caught.message : t("state.error")));
      setField("message");
    } finally {
      setSending(false);
    }
  }

  const mapUrl = settings?.mapEmbedUrl && settings.mapEmbedUrl.startsWith("https://") ? settings.mapEmbedUrl : "";
  const details = [
    { icon: MapPin, label: t("contact.address"), value: localized(settings?.address) || t("common.notProvided", "Not provided") },
    { icon: Phone, label: t("contact.phone"), value: settings?.contactPhone || t("common.notProvided", "Not provided") },
    {
      icon: Phone,
      label: t("contact.phone"),
      value: settings?.contactPhoneAlt || t("common.notProvided", "Not provided")
    },
    { icon: Mail, label: t("contact.email"), value: settings?.contactEmail || t("common.notProvided", "Not provided") },
    { icon: Clock, label: t("contact.hours"), value: localized(settings?.officeHours) || t("common.notProvided", "Not provided") }
  ];

  return (
    <>
      <PageHero
        eyebrow={t("nav.contact")}
        title={t("contact.title")}
        description={t("contact.subtitle")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.contact") }]}
      />
      <Section>
        <Stagger className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]" gap={0.1}>
          <StaggerItem>
            <Card className="h-full p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-brand-950">{t("contact.formTitle")}</h2>
            {sent ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                {t("contact.success")}
                <button type="button" onClick={() => setSent(false)} className="ms-2 font-semibold underline underline-offset-4">
                  {t("contact.formTitle")}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label={t("form.fullName")} htmlFor="contact-name" required>
                    <Input
                      id="contact-name"
                      value={form.name}
                      onChange={(event) => update("name", event.target.value)}
                      autoComplete="name"
                      required
                    />
                  </FormField>
                  <FormField label={t("form.email")} htmlFor="contact-email">
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => update("email", event.target.value)}
                      autoComplete="email"
                    />
                  </FormField>
                  <FormField label={t("form.phone")} htmlFor="contact-phone">
                    <Input
                      id="contact-phone"
                      type="tel"
                      dir="ltr"
                      value={form.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      autoComplete="tel"
                    />
                  </FormField>
                  <FormField label={t("form.subject")} htmlFor="contact-subject" required>
                    <Input
                      id="contact-subject"
                      value={form.subject}
                      onChange={(event) => update("subject", event.target.value)}
                      required
                    />
                  </FormField>
                </div>
                <FormField label={t("form.message")} htmlFor="contact-message" required error={field === "message" ? error : null}>
                  <Textarea
                    id="contact-message"
                    rows={6}
                    value={form.message}
                    onChange={(event) => update("message", event.target.value)}
                    required
                  />
                </FormField>
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => update("website", event.target.value)}
                  className="hidden"
                  aria-hidden
                />
                {error && field !== "message" ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
                <Button type="submit" loading={sending}>
                  <Send className="h-4 w-4" /> {t("contact.formTitle")}
                </Button>
              </form>
            )}
            </Card>
          </StaggerItem>
          <StaggerItem className="space-y-4">
            <Card>
              <h2 className="font-display text-2xl font-semibold text-brand-950">{t("contact.details")}</h2>
              <ul className="mt-4 space-y-4">
                {details.map((item, index) => (
                  <li key={`${item.label}-${index}`} className="flex gap-3">
                    <span className="mt-0.5 rounded-full bg-brand-950/5 p-2 text-brand-800">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{item.label}</p>
                      <p className="mt-0.5 text-sm text-ink" dir={item.label === t("contact.phone") ? "ltr" : undefined}>
                        {item.value}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {settings?.admissionEmail ? (
                <p className="mt-5 rounded-xl bg-gold-50 p-3 text-xs text-gold-900">
                  {t("nav.admissions")}: <span dir="ltr">{settings.admissionEmail}</span>
                </p>
              ) : null}
            </Card>
            {mapUrl ? (
              <div className="overflow-hidden rounded-2xl border border-brand-950/10 shadow-card">
                <iframe
                  src={mapUrl}
                  title="Campus location"
                  className="h-72 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="pattern-islamic flex h-48 items-center justify-center rounded-2xl border border-brand-950/10 bg-brand-950 text-center text-xs text-ivory/60">
                {t("footer.managed")}
              </div>
            )}
          </StaggerItem>
        </Stagger>
      </Section>
    </>
  );
}
