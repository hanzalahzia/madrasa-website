"use client";

import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { Program } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { ProgramCard } from "@/components/site/cards";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/primitives";

export default function ProgramsPage() {
  const { t } = useLanguage();
  const { data: programs, loading, error, reload } = useApi<Program[]>("/public/programs");

  return (
    <>
      <PageHero
        eyebrow={t("home.programsEyebrow")}
        title={t("home.programsTitle")}
        description={t("home.programsSubtitle")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.programs") }]}
      />
      <Section>
        {loading ? (
          <LoadingPanel label={t("state.loading")} />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} retryLabel={t("action.retry")} />
        ) : programs?.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program, index) => (
              <ProgramCard key={program._id} program={program} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState title={t("state.empty")} description={t("state.emptyHint")} />
        )}
        <Reveal className="relative mt-12 overflow-hidden rounded-2xl bg-brand-950 p-8 text-center text-ivory sm:p-10">
          <div aria-hidden className="pattern-islamic absolute inset-0 opacity-[0.1]" />
          <div className="relative">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("home.admissionsTitle")}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ivory/70">{t("home.admissionsText")}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/admissions" variant="secondary" className="shine-sweep">
                {t("nav.applyNow")}
              </ButtonLink>
              <ButtonLink href="/admissions/track" variant="outline" className="border-white/25 bg-white/5 text-ivory hover:bg-white/10">
                {t("nav.trackApplication")}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
