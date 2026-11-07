"use client";

import { useLanguage } from "@/lib/language-context";
import { ContentPage } from "@/components/site/content-page";

export default function FacilitiesPage() {
  const { t } = useLanguage();
  return (
    <ContentPage
      pageKey="facilities"
      eyebrow={t("nav.facilities")}
      fallbackTitle={t("nav.facilities")}
      breadcrumb={t("nav.facilities")}
    />
  );
}
