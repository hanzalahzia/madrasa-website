"use client";

import { useMemo } from "react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { Faq } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { FaqAccordion } from "@/components/site/cards";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";

export default function FaqsPage() {
  const { t } = useLanguage();
  const { data: faqs, loading, error, reload } = useApi<Faq[]>("/public/faqs");

  const groups = useMemo(() => {
    const map = new Map<string, Faq[]>();
    for (const faq of faqs || []) {
      const key = faq.category || t("nav.faqs");
      map.set(key, [...(map.get(key) || []), faq]);
    }
    return Array.from(map.entries());
  }, [faqs, t]);

  return (
    <>
      <PageHero
        eyebrow={t("nav.faqs")}
        title={t("nav.faqs")}
        description={t("contact.subtitle")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.faqs") }]}
      />
      <Section>
        {loading ? (
          <LoadingPanel label={t("state.loading")} />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : groups.length ? (
          <div className="mx-auto max-w-3xl space-y-10">
            {groups.map(([category, items]) => (
              <div key={category}>
                <h2 className="mb-4 font-display text-2xl font-semibold text-brand-950">{category}</h2>
                <FaqAccordion items={items.map((faq) => ({ id: faq._id, question: faq.question, answer: faq.answer }))} />
              </div>
            ))}
            <div className="rounded-2xl bg-gold-50 p-6 text-center">
              <p className="text-sm text-muted">{t("contact.subtitle")}</p>
              <ButtonLink href="/contact" variant="primary" className="mt-4">
                {t("nav.contact")}
              </ButtonLink>
            </div>
          </div>
        ) : (
          <EmptyState title={t("state.empty")} description={t("state.emptyHint")} />
        )}
      </Section>
    </>
  );
}
