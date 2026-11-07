"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, GraduationCap, Wallet } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { Program } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { MetaItem, Prose } from "@/components/site/cards";
import { ErrorState, LoadingPanel } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProgramDetailPage() {
  const params = useParams<{ slug: string }>();
  const { t, localized } = useLanguage();
  const { data: program, loading, error, reload } = useApi<Program>(`/public/programs/${params.slug}`);
  const { data: all } = useApi<Program[]>("/public/programs");

  if (loading) {
    return (
      <Section>
        <LoadingPanel label={t("state.loading")} />
      </Section>
    );
  }

  if (error || !program) {
    return (
      <Section>
        <ErrorState title={t("state.notFound")} description={error || t("state.notFoundHint")} onRetry={reload} />
        <div className="mt-6 text-center">
          <ButtonLink href="/programs" variant="outline">
            {t("nav.programs")}
          </ButtonLink>
        </div>
      </Section>
    );
  }

  const related = (all || []).filter((item) => item.slug !== program.slug).slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={program.duration || t("nav.programs")}
        title={localized(program.title)}
        description={localized(program.summary)}
        breadcrumbs={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.programs"), href: "/programs" },
          { label: localized(program.title) }
        ]}
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-brand-950/10 bg-white/85 p-6 shadow-card sm:p-8">
            {program.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={program.image} alt={localized(program.title)} className="mb-6 aspect-[16/9] w-full rounded-xl object-cover" />
            ) : null}
            <Prose value={program.description || program.summary} />
          </article>
          <aside className="space-y-4">
            <Card>
              <h2 className="font-display text-xl font-semibold text-brand-950">{t("nav.programs")}</h2>
              <div className="mt-4 grid gap-2">
                <MetaItem icon={<Clock className="h-4 w-4" />} label={t("home.programsEyebrow")} value={program.duration || "—"} />
                <MetaItem icon={<GraduationCap className="h-4 w-4" />} label={t("admissions.student")} value={program.ageGroup || "—"} />
                <MetaItem icon={<Wallet className="h-4 w-4" />} label={t("portal.fees")} value={program.monthlyFeeNote || t("state.emptyHint")} />
              </div>
              {program.image ? null : (
                <div className="pattern-islamic mt-4 flex h-32 items-center justify-center rounded-xl bg-brand-950 font-display text-4xl text-gold-300/80">
                  ﷽
                </div>
              )}
            </Card>
            <Card className="bg-brand-950 text-ivory">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-300">{t("nav.admissions")}</p>
              <p className="mt-2 text-sm leading-relaxed text-ivory/75">{t("home.admissionsText")}</p>
              <div className="mt-4 flex flex-col gap-2">
                <ButtonLink href="/admissions" variant="secondary" size="sm">
                  {t("nav.applyNow")}
                </ButtonLink>
                <ButtonLink href="/contact" variant="outline" size="sm" className="border-white/25 bg-white/5 text-ivory hover:bg-white/10">
                  {t("nav.contact")}
                </ButtonLink>
              </div>
            </Card>
          </aside>
        </div>

        {related.length ? (
          <div className="mt-14">
            <h2 className="mb-5 font-display text-2xl font-semibold text-brand-950">{t("nav.programs")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item._id}
                  href={`/programs/${item.slug}`}
                  className="rounded-2xl border border-brand-950/10 bg-white/85 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">{item.duration || t("nav.programs")}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-brand-950">{localized(item.title)}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{localized(item.summary)}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
