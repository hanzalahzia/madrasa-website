"use client";

import { useLanguage } from "@/lib/language-context";
import { ContentPage } from "@/components/site/content-page";

export default function ManagementPage() {
  const { t } = useLanguage();
  return (
    <ContentPage
      pageKey="management"
      eyebrow={t("nav.management")}
      fallbackTitle={t("nav.management")}
      breadcrumb={t("nav.management")}
    />
  );
}
