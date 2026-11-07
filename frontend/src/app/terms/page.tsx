"use client";

import { useLanguage } from "@/lib/language-context";
import { ContentPage } from "@/components/site/content-page";

export default function TermsPage() {
  const { t } = useLanguage();
  return (
    <ContentPage
      pageKey="terms"
      eyebrow={t("footer.terms")}
      fallbackTitle={t("footer.terms")}
      breadcrumb={t("footer.terms")}
    />
  );
}
