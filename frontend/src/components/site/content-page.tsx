"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { PageContent, PublicSettings } from "@/lib/types";
import { PageHero } from "./page-hero";
import { Section } from "./section";
import { Prose } from "./cards";
import { Card } from "@/components/ui/card";
import { LoadingPanel } from "@/components/ui/feedback";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";

export function ContentPage({
  pageKey,
  eyebrow,
  fallbackTitle,
  breadcrumb,
  description,
  children
}: {
  pageKey: string;
  eyebrow: string;
  fallbackTitle: string;
  breadcrumb: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const { t, localized } = useLanguage();
  const { data: page, loading, error } = useApi<PageContent>(`/public/pages/${pageKey}`);
  const { data: settings } = useApi<PublicSettings>("/public/settings");

  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={localized(page?.title) || fallbackTitle}
        description={description}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: breadcrumb }]}
      />
      <Section>
        <Stagger className="grid gap-8 lg:grid-cols-[1fr_20rem]" gap={0.1}>
          <StaggerItem className="rounded-2xl border border-brand-950/10 bg-white/80 p-6 shadow-card sm:p-8">
            {loading ? (
              <LoadingPanel label={t("state.loading")} />
            ) : page ? (
              <>
                <Prose value={page.body} />
                {page.updatedAt ? (
                  <p className="mt-8 border-t border-brand-950/10 pt-4 text-[11px] text-muted">
                    {t("action.update")}: {new Date(page.updatedAt).toLocaleDateString()}
                  </p>
                ) : null}
              </>
            ) : error ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {t("state.emptyHint")}
              </div>
            ) : null}
            {children ? <div className="mt-8">{children}</div> : null}
          </StaggerItem>
          <StaggerItem className="space-y-4">
            <Card>
              <h2 className="font-display text-xl font-semibold text-brand-950">{t("footer.contact")}</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
                  <span>{localized(settings?.address) || t("common.notProvided")}</span>
                </li>
                <li className="flex gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
                  <span dir="ltr">{settings?.contactPhone || t("common.notProvided")}</span>
                </li>
                <li className="flex gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
                  <span dir="ltr">{settings?.contactEmail || t("common.notProvided")}</span>
                </li>
              </ul>
              <p className="mt-4 rounded-xl bg-gold-50 p-3 text-xs leading-relaxed text-gold-900">
                {t("footer.managed")}
              </p>
            </Card>
            <Reveal>
              <Card className="bg-brand-950 text-ivory">
                <h2 className="font-display text-xl font-semibold text-gold-200">{t("nav.admissions")}</h2>
                <p className="mt-2 text-xs leading-relaxed text-ivory/70">{t("home.admissionsText")}</p>
                <Link
                  href="/admissions"
                  className="mt-4 inline-flex text-xs font-semibold text-gold-300 underline underline-offset-4"
                >
                  {t("nav.applyNow")}
                </Link>
              </Card>
            </Reveal>
          </StaggerItem>
        </Stagger>
      </Section>
    </>
  );
}
