"use client";

import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { Announcement } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { AnnouncementCard } from "@/components/site/cards";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";

export default function AnnouncementsPage() {
  const { t } = useLanguage();
  const { data: announcements, loading, error, reload } = useApi<Announcement[]>("/public/announcements");

  return (
    <>
      <PageHero
        eyebrow={t("nav.announcements")}
        title={t("home.announcementsTitle")}
        description={t("home.heroNote")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.announcements") }]}
      />
      <Section>
        {loading ? (
          <LoadingPanel label={t("state.loading")} />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : announcements?.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement._id} announcement={announcement} />
            ))}
          </div>
        ) : (
          <EmptyState title={t("state.empty")} description={t("state.emptyHint")} />
        )}
      </Section>
    </>
  );
}
