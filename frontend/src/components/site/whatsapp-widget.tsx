"use client";

import { useLanguage } from "@/lib/language-context";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./whatsapp-icon";

export function WhatsAppWidget() {
  const { t } = useLanguage();

  return (
    <a
      href={whatsappUrl(t("whatsapp.greeting"))}
      target="_blank"
      rel="noreferrer"
      aria-label={t("whatsapp.chat")}
      title={t("whatsapp.chat")}
      className="fixed bottom-5 end-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_40px_-8px_rgba(37,211,102,0.7)] transition hover:-translate-y-1 hover:bg-[#1ebe5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
