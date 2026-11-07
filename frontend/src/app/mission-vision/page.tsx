"use client";

import { useLanguage } from "@/lib/language-context";
import { ContentPage } from "@/components/site/content-page";

export default function MissionPage() {
  const { t } = useLanguage();
  return (
    <ContentPage
      pageKey="mission-vision"
      eyebrow={t("nav.mission")}
      fallbackTitle={t("nav.mission")}
      breadcrumb={t("nav.mission")}
      description={t("home.aboutTitle")}
    />
  );
}
