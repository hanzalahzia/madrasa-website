"use client";

import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { Teacher } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { TeacherCard } from "@/components/site/cards";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";

export default function FacultyPage() {
  const { t } = useLanguage();
  const { data: teachers, loading, error, reload } = useApi<Teacher[]>("/public/faculty");

  return (
    <>
      <PageHero
        eyebrow={t("home.facultyEyebrow")}
        title={t("home.facultyTitle")}
        description={t("home.programsSubtitle")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.faculty") }]}
      />
      <Section>
        {loading ? (
          <LoadingPanel label={t("state.loading")} />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : teachers?.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {teachers.map((teacher) => (
              <TeacherCard key={teacher._id} teacher={teacher} />
            ))}
          </div>
        ) : (
          <EmptyState title={t("state.empty")} description={t("state.emptyHint")} />
        )}
      </Section>
    </>
  );
}
