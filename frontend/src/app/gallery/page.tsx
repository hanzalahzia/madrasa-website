"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { GalleryItem } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { GalleryGrid } from "@/components/site/cards";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/tabs";

export default function GalleryPage() {
  const { t } = useLanguage();
  const { data: items, loading, error, reload } = useApi<GalleryItem[]>("/public/gallery");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const unique = Array.from(new Set((items || []).map((item) => item.category).filter(Boolean))) as string[];
    return ["all", ...unique];
  }, [items]);

  const filtered = useMemo(
    () => (items || []).filter((item) => category === "all" || item.category === category),
    [items, category]
  );

  return (
    <>
      <PageHero
        eyebrow={t("home.galleryEyebrow")}
        title={t("nav.gallery")}
        description={t("home.galleryTitle")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.gallery") }]}
      />
      <Section>
        {loading ? (
          <LoadingPanel label={t("state.loading")} />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : !items?.length ? (
          <EmptyState title={t("state.empty")} description={t("state.emptyHint")} />
        ) : (
          <>
            {categories.length > 2 ? (
              <Tabs
                className="mb-6 w-fit"
                value={category}
                onChange={setCategory}
                tabs={categories.map((entry) => ({
                  value: entry,
                  label: entry === "all" ? t("books.allCategories") : entry
                }))}
              />
            ) : null}
            <GalleryGrid items={filtered} />
          </>
        )}
      </Section>
    </>
  );
}
