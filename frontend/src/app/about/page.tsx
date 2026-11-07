"use client";

import { BookOpen, HeartHandshake, Lightbulb, Users } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { PageContent, PublicSettings } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section, SectionHeading } from "@/components/site/section";
import { Prose } from "@/components/site/cards";
import { LoadingPanel } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stagger, StaggerItem } from "@/components/motion/primitives";

export default function AboutPage() {
  const { t, localized } = useLanguage();
  const { data: page, loading } = useApi<PageContent>("/public/pages/about");
  const { data: settings } = useApi<PublicSettings>("/public/settings");

  const values = [
    { icon: BookOpen, title: t("nav.programs"), text: localized(settings?.aboutShort) || t("home.heroSubtitle") },
    { icon: Lightbulb, title: t("nav.mission"), text: t("home.aboutTitle") },
    { icon: Users, title: t("home.facultyEyebrow"), text: t("home.facultyTitle") },
    { icon: HeartHandshake, title: t("nav.facilities"), text: t("home.values") }
  ];

  return (
    <>
      <PageHero
        eyebrow={t("home.aboutEyebrow")}
        title={localized(page?.title) || t("nav.about")}
        description={localized(settings?.tagline)}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.about") }]}
      />
      <Section>
        <Stagger className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]" gap={0.12}>
          <StaggerItem className="rounded-2xl border border-brand-950/10 bg-white/85 p-6 shadow-card sm:p-10">
            {loading ? <LoadingPanel label={t("state.loading")} /> : <Prose value={page?.body} />}
          </StaggerItem>
          <StaggerItem className="space-y-4">
            <Card className="bg-gold-50">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-700">{t("home.values")}</p>
              <p className="mt-3 font-display text-2xl leading-snug text-brand-950">{localized(settings?.tagline) || t("home.heroTitle")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t("home.heroNote")}</p>
            </Card>
            <Card>
              <h2 className="font-display text-xl font-semibold text-brand-950">{t("nav.programs")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("home.programsSubtitle")}</p>
              <ButtonLink href="/programs" variant="outline" size="sm" className="mt-4">
                {t("action.explore")}
              </ButtonLink>
            </Card>
            <Card>
              <h2 className="font-display text-xl font-semibold text-brand-950">{t("nav.admissions")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("home.admissionsText")}</p>
              <ButtonLink href="/admissions" variant="secondary" size="sm" className="mt-4">
                {t("nav.applyNow")}
              </ButtonLink>
            </Card>
          </StaggerItem>
        </Stagger>
      </Section>
      <Section className="bg-brand-950/[0.03]">
        <SectionHeading eyebrow={t("home.values")} title={t("home.aboutTitle")} align="center" />
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" gap={0.08}>
          {values.map((value) => (
            <StaggerItem key={value.title}>
              <Card className="h-full">
                <value.icon className="h-6 w-6 text-gold-700" />
                <h3 className="mt-4 font-display text-xl font-semibold text-brand-950">{value.title}</h3>
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted">{value.text}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>
    </>
  );
}
