"use client";

import { useLanguage } from "@/lib/language-context";
import { ContentPage } from "@/components/site/content-page";

export default function PrivacyPage() {
  const { t } = useLanguage();
  return (
    <ContentPage
      pageKey="privacy"
      eyebrow={t("footer.privacy")}
      fallbackTitle={t("footer.privacy")}
      breadcrumb={t("footer.privacy")}
    />
  );
}
