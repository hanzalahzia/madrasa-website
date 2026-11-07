"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Copy, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { AcademicSession, Program, PublicSettings } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";

const emptyForm = {
  studentName: "",
  dob: "",
  gender: "",
  guardianName: "",
  relationship: "",
  phone: "",
  email: "",
  address: "",
  previousEducation: "",
  program: "",
  session: ""
};

export default function AdmissionsPage() {
  const { t, localized } = useLanguage();
  const { data: settings } = useApi<PublicSettings>("/public/settings");
  const { data: programs } = useApi<Program[]>("/public/programs");
  const { data: sessions } = useApi<AcademicSession[]>("/public/sessions");
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ reference: string; trackingPin: string } | null>(null);
  const closed = Boolean(settings && !settings.admissionsOpen);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (closed) {
      setError(t("admissions.closed"));
      return;
    }
    if (
      form.studentName.trim().length < 2 ||
      !form.dob ||
      form.guardianName.trim().length < 2 ||
      form.phone.trim().length < 7 ||
      form.address.trim().length < 5
    ) {
      setError(t("form.required"));
      return;
    }
    if (files && files.length > 3) {
      setError(t("admissions.documentsHint"));
      return;
    }
    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) body.append(key, value);
      });
      if (files) {
        Array.from(files).forEach((file) => body.append("documents", file));
      }
      const result = await api<{ reference: string; trackingPin: string }>("/public/admissions", {
        method: "POST",
        body
      });
      setSuccess(result);
      setForm(emptyForm);
      setFiles(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("state.error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label}: ${t("action.copied")}`);
    } catch {
      toast.error(t("state.error"));
    }
  }

  return (
    <>
      <PageHero
        eyebrow={t("home.admissionsEyebrow")}
        title={t("admissions.title")}
        description={t("admissions.subtitle")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.admissions") }]}
      />
      <Section>
        <div className="mx-auto max-w-4xl">
          {success ? (
            <Card className="border-emerald-200 bg-emerald-50/60">
              <div className="flex items-start gap-3">
                <span className="rounded-full bg-emerald-100 p-2 text-emerald-800">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-brand-950">{t("admissions.received")}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{t("admissions.receivedText")}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-brand-950/10 bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t("admissions.reference")}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-mono text-lg font-semibold text-brand-950">{success.reference}</p>
                    <button type="button" onClick={() => copy(success.reference, t("admissions.reference"))} className="rounded p-1.5 text-muted hover:bg-brand-950/5" aria-label={t("action.copy")}>
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-brand-950/10 bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t("admissions.pin")}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-mono text-lg font-semibold tracking-[0.3em] text-brand-950">{success.trackingPin}</p>
                    <button type="button" onClick={() => copy(success.trackingPin, t("admissions.pin"))} className="rounded p-1.5 text-muted hover:bg-brand-950/5" aria-label={t("action.copy")}>
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-800">
                <ShieldCheck className="h-4 w-4" /> {t("admissions.keepSafe")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/admissions/track" variant="primary">
                  {t("nav.trackApplication")}
                </ButtonLink>
                <ButtonLink href="/" variant="outline">
                  {t("nav.home")}
                </ButtonLink>
              </div>
            </Card>
          ) : (
            <>
              {settings && !settings.admissionsOpen ? (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t("admissions.closed")}</div>
              ) : (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{t("admissions.open")}</div>
              )}
              <form onSubmit={submit} className="space-y-5" noValidate>
                <Card>
                  <h2 className="font-display text-xl font-semibold text-brand-950">{t("admissions.student")}</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <FormField label={t("admissions.studentName")} htmlFor="ad-name" required>
                      <Input id="ad-name" value={form.studentName} onChange={(event) => update("studentName", event.target.value)} required />
                    </FormField>
                    <FormField label={t("admissions.dob")} htmlFor="ad-dob" required>
                      <Input id="ad-dob" type="date" dir="ltr" value={form.dob} onChange={(event) => update("dob", event.target.value)} required />
                    </FormField>
                    <FormField label={t("admissions.gender")} htmlFor="ad-gender">
                      <Select id="ad-gender" value={form.gender} onChange={(event) => update("gender", event.target.value)}>
                        <option value="">{t("form.selectPlaceholder")}</option>
                        <option value="male">{t("admissions.male")}</option>
                        <option value="female">{t("admissions.female")}</option>
                        <option value="other">{t("admissions.other")}</option>
                      </Select>
                    </FormField>
                    <FormField label={t("admissions.program")} htmlFor="ad-program">
                      <Select id="ad-program" value={form.program} onChange={(event) => update("program", event.target.value)}>
                        <option value="">{t("form.selectPlaceholder")}</option>
                        {(programs || []).map((program) => (
                          <option key={program._id} value={program._id}>
                            {localized(program.title)}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label={t("admissions.session")} htmlFor="ad-session">
                      <Select id="ad-session" value={form.session} onChange={(event) => update("session", event.target.value)}>
                        <option value="">{t("form.selectPlaceholder")}</option>
                        {(sessions || []).map((session) => (
                          <option key={session._id} value={session._id}>
                            {session.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label={t("admissions.previousEducation")} htmlFor="ad-previous">
                      <Input id="ad-previous" value={form.previousEducation} onChange={(event) => update("previousEducation", event.target.value)} />
                    </FormField>
                  </div>
                </Card>
                <Card>
                  <h2 className="font-display text-xl font-semibold text-brand-950">{t("admissions.guardian")}</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <FormField label={t("admissions.guardianName")} htmlFor="ad-guardian" required>
                      <Input id="ad-guardian" value={form.guardianName} onChange={(event) => update("guardianName", event.target.value)} required />
                    </FormField>
                    <FormField label={t("admissions.relationship")} htmlFor="ad-relationship">
                      <Input id="ad-relationship" value={form.relationship} onChange={(event) => update("relationship", event.target.value)} />
                    </FormField>
                    <FormField label={t("form.phone")} htmlFor="ad-phone" required>
                      <Input id="ad-phone" type="tel" dir="ltr" value={form.phone} onChange={(event) => update("phone", event.target.value)} required />
                    </FormField>
                    <FormField label={t("form.email")} htmlFor="ad-email">
                      <Input id="ad-email" type="email" dir="ltr" value={form.email} onChange={(event) => update("email", event.target.value)} />
                    </FormField>
                    <FormField label={t("form.address")} htmlFor="ad-address" required className="sm:col-span-2">
                      <Textarea id="ad-address" rows={2} value={form.address} onChange={(event) => update("address", event.target.value)} required />
                    </FormField>
                  </div>
                </Card>
                <Card>
                  <h2 className="font-display text-xl font-semibold text-brand-950">{t("admissions.documents")}</h2>
                  <div className="mt-4">
                    <label
                      htmlFor="ad-documents"
                      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand-950/20 bg-brand-950/[0.02] px-4 py-8 text-center transition hover:border-brand-800/40 hover:bg-gold-50/50"
                    >
                      <FileText className="h-6 w-6 text-brand-700" />
                      <span className="text-sm font-medium text-brand-950">{t("admissions.documents")}</span>
                      <span className="max-w-md text-xs leading-relaxed text-muted">{t("admissions.documentsHint")}</span>
                      {files?.length ? (
                        <span className="text-xs font-medium text-emerald-800">
                          {Array.from(files).map((file) => file.name).join(", ")}
                        </span>
                      ) : null}
                      <input
                        id="ad-documents"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="sr-only"
                        onChange={(event) => setFiles(event.target.files)}
                      />
                    </label>
                  </div>
                </Card>
                {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
                <Button type="submit" loading={submitting} size="lg" className="w-full sm:w-auto" disabled={closed}>
                  {submitting ? t("admissions.submitting") : t("admissions.submit")}
                </Button>
              </form>
              <p className="mt-4 text-center text-xs text-muted">
                {t("nav.trackApplication")}?{" "}
                <Link href="/admissions/track" className="font-medium text-brand-800 underline underline-offset-4">
                  {t("admissions.trackTitle")}
                </Link>
              </p>
            </>
          )}
        </div>
      </Section>
    </>
  );
}
