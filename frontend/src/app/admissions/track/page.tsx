"use client";

import { useState } from "react";
import { Clock3, FileSearch, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatStatus } from "@/lib/format";
import type { Localized } from "@/lib/i18n";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/field";

interface TrackResult {
  reference: string;
  studentName: string;
  status: string;
  program: { title: Localized; slug: string } | null;
  session: string | null;
  submittedAt: string;
  updatedAt: string;
  history: Array<{ status: string; at: string }>;
}

export default function TrackAdmissionPage() {
  const { t, localized, locale } = useLanguage();
  const [reference, setReference] = useState("");
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    if (!reference.trim() || !/^\d{6}$/.test(pin.trim())) {
      setError(t("admissions.trackNotFound"));
      return;
    }
    setLoading(true);
    try {
      const data = await api<TrackResult>("/public/admissions/track", {
        method: "POST",
        body: { reference: reference.trim(), pin: pin.trim() }
      });
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("admissions.trackNotFound"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow={t("nav.admissions")}
        title={t("admissions.trackTitle")}
        description={t("admissions.trackSubtitle")}
        breadcrumbs={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.admissions"), href: "/admissions" },
          { label: t("nav.trackApplication") }
        ]}
      />
      <Section>
        <div className="mx-auto max-w-2xl">
          <Card>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_10rem]">
              <FormField label={t("admissions.reference")} htmlFor="track-reference">
                <Input
                  id="track-reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value.toUpperCase())}
                  placeholder="MMU-ADM-XXXXXX"
                  className="font-mono"
                  autoComplete="off"
                />
              </FormField>
              <FormField label={t("admissions.pin")} htmlFor="track-pin">
                <Input
                  id="track-pin"
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  className="font-mono tracking-[0.25em]"
                  autoComplete="one-time-code"
                />
              </FormField>
              <div className="sm:col-span-2">
                <Button type="submit" loading={loading} className="w-full sm:w-auto">
                  <Search className="h-4 w-4" /> {t("admissions.trackSubmit")}
                </Button>
              </div>
            </form>
            {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
          </Card>

          {result ? (
            <Card className="mt-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-950/10 pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t("admissions.reference")}</p>
                  <p className="font-mono text-lg font-semibold text-brand-950">{result.reference}</p>
                  <p className="mt-1 text-sm text-ink">{result.studentName}</p>
                </div>
                <Badge tone={["approved", "enrolled"].includes(result.status) ? "success" : result.status === "rejected" ? "danger" : "warning"}>
                  {formatStatus(result.status, locale)}
                </Badge>
              </div>
              <dl className="grid gap-3 py-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t("admissions.program")}</dt>
                  <dd className="mt-0.5">{localized(result.program?.title) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t("admissions.session")}</dt>
                  <dd className="mt-0.5">{result.session || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t("admissions.submittedAt")}</dt>
                  <dd className="mt-0.5">{formatDate(result.submittedAt, locale, true)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t("admissions.updatedAt")}</dt>
                  <dd className="mt-0.5">{formatDate(result.updatedAt, locale, true)}</dd>
                </div>
              </dl>
              <div className="border-t border-brand-950/10 pt-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-brand-950">
                  <FileSearch className="h-4 w-4" /> {t("admissions.statusHistory")}
                </h2>
                <ol className="mt-3 space-y-3">
                  {result.history.map((entry, index) => (
                    <li key={`${entry.status}-${entry.at}-${index}`} className="flex gap-3">
                      <span className="mt-0.5 rounded-full bg-brand-950/5 p-1.5 text-brand-700">
                        <Clock3 className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{formatStatus(entry.status, locale)}</p>
                        <p className="text-[11px] text-muted">{formatDate(entry.at, locale, true)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          ) : null}
        </div>
      </Section>
    </>
  );
}
