"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { PageTransition } from "@/components/motion/primitives";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { WhatsAppWidget } from "./whatsapp-widget";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const bare = pathname.startsWith("/admin") || pathname.startsWith("/print");

  if (bare) return <>{children}</>;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-950 focus:px-4 focus:py-2 focus:text-sm focus:text-ivory"
      >
        {t("nav.home")}
      </a>
      <SiteHeader />
      <main id="main-content" className="min-h-[60vh]">
        <PageTransition key={pathname}>{children}</PageTransition>
      </main>
      <SiteFooter />
      <WhatsAppWidget />
    </>
  );
}
