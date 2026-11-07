"use client";

import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { EventItem } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { EventCard } from "@/components/site/cards";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";

export default function EventsPage() {
  const { t } = useLanguage();
  const { data: events, loading, error, reload } = useApi<EventItem[]>("/public/events");
  const now = Date.now();
  const upcoming = (events || []).filter((event) => new Date(event.startDate).getTime() >= now);
  const past = (events || [])
    .filter((event) => new Date(event.startDate).getTime() < now)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <>
      <PageHero
        eyebrow={t("home.eventsEyebrow")}
        title={t("nav.events")}
        description={t("home.eventsTitle")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.events") }]}
      />
      <Section>
        {loading ? (
          <LoadingPanel label={t("state.loading")} />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : !events?.length ? (
          <EmptyState title={t("state.empty")} description={t("state.emptyHint")} />
        ) : (
          <div className="space-y-12">
            <div>
              <h2 className="mb-5 font-display text-2xl font-semibold text-brand-950">{t("home.eventsTitle")}</h2>
              {upcoming.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {upcoming.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              ) : (
                <EmptyState title={t("state.empty")} description={t("state.emptyHint")} />
              )}
            </div>
            {past.length ? (
              <div>
                <h2 className="mb-5 font-display text-2xl font-semibold text-brand-950">{t("action.archive")}</h2>
                <div className="grid gap-4 opacity-80 md:grid-cols-2">
                  {past.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Section>
    </>
  );
}
