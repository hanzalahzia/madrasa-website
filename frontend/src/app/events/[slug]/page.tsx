"use client";

import { useParams } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate } from "@/lib/format";
import type { EventItem } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { MetaItem, Prose } from "@/components/site/cards";
import { ErrorState, LoadingPanel } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const { t, localized, locale } = useLanguage();
  const { data: event, loading, error, reload } = useApi<EventItem>(`/public/events/${params.slug}`);

  if (loading) {
    return (
      <Section>
        <LoadingPanel label={t("state.loading")} />
      </Section>
    );
  }

  if (error || !event) {
    return (
      <Section>
        <ErrorState title={t("state.notFound")} description={error || t("state.notFoundHint")} onRetry={reload} />
        <div className="mt-6 text-center">
          <ButtonLink href="/events" variant="outline">
            {t("nav.events")}
          </ButtonLink>
        </div>
      </Section>
    );
  }

  return (
    <>
      <PageHero
        eyebrow={t("home.eventsEyebrow")}
        title={localized(event.title)}
        description={localized(event.description)}
        breadcrumbs={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.events"), href: "/events" },
          { label: localized(event.title) }
        ]}
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="rounded-2xl border border-brand-950/10 bg-white/85 p-6 shadow-card sm:p-8">
            {event.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.image} alt={localized(event.title)} className="mb-6 aspect-[16/9] w-full rounded-xl object-cover" />
            ) : (
              <div className="pattern-islamic mb-6 flex h-56 items-center justify-center rounded-xl bg-brand-950 text-5xl text-gold-300/70">
                <CalendarDays className="h-14 w-14" />
              </div>
            )}
            <Prose value={event.description} />
          </article>
          <aside className="space-y-3">
            <MetaItem icon={<CalendarDays className="h-4 w-4" />} label={t("nav.events")} value={formatDate(event.startDate, locale)} />
            <MetaItem icon={<Clock className="h-4 w-4" />} label={t("contact.hours")} value={formatDate(event.startDate, locale, true)} />
            <MetaItem icon={<MapPin className="h-4 w-4" />} label={t("contact.address")} value={localized(event.location) || t("footer.contact")} />
            <ButtonLink href="/events" variant="outline" className="w-full">
              {t("action.back")}
            </ButtonLink>
          </aside>
        </div>
      </Section>
    </>
  );
}
