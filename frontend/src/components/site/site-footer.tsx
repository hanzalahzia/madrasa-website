"use client";

import Link from "next/link";
import { ArrowUp, Mail, MapPin, Phone } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { PublicSettings } from "@/lib/types";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { whatsappUrl } from "@/lib/whatsapp";
import { Brand } from "./brand";
import { WhatsAppIcon } from "./whatsapp-icon";

const quickLinks = [
  { href: "/about", key: "nav.about" },
  { href: "/programs", key: "nav.programs" },
  { href: "/admissions", key: "nav.admissions" },
  { href: "/faculty", key: "nav.faculty" },
  { href: "/contact", key: "nav.contact" }
];

const resourceLinks = [
  { href: "/books", key: "nav.books" },
  { href: "/events", key: "nav.events" },
  { href: "/announcements", key: "nav.announcements" },
  { href: "/faqs", key: "nav.faqs" },
  { href: "/gallery", key: "nav.gallery" }
];

export function SiteFooter() {
  const { t, localized } = useLanguage();
  const { data: settings } = useApi<PublicSettings>("/public/settings");
  const reduce = useReducedMotion();
  const socials = settings?.socials || {};
  const year = new Date().getFullYear();

  function backToTop() {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-gold-600/20 bg-brand-950 text-ivory">
      <div aria-hidden className="pattern-islamic absolute inset-0 opacity-[0.06]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
      <div aria-hidden className="absolute -start-24 top-0 h-64 w-64 rounded-full bg-gold-500/5 blur-3xl" />

      <Stagger className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.7fr_1fr] lg:px-8" gap={0.09}>
        <StaggerItem className="space-y-4">
          <Brand inverted />
          <p className="max-w-sm text-sm leading-relaxed text-ivory/70">{localized(settings?.aboutShort)}</p>
          <p className="max-w-sm text-xs leading-relaxed text-gold-200/70">{t("footer.managed")}</p>
        </StaggerItem>
        <StaggerItem>
          <h3 className="mb-4 font-display text-lg font-semibold text-gold-200">{t("footer.quickLinks")}</h3>
          <ul className="space-y-2 text-sm text-ivory/75">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="group inline-flex items-center gap-1.5 transition hover:text-gold-200">
                  <span className="h-px w-0 bg-gold-300 transition-all duration-300 group-hover:w-3" />
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </StaggerItem>
        <StaggerItem>
          <h3 className="mb-4 font-display text-lg font-semibold text-gold-200">{t("footer.resources")}</h3>
          <ul className="space-y-2 text-sm text-ivory/75">
            {resourceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="group inline-flex items-center gap-1.5 transition hover:text-gold-200">
                  <span className="h-px w-0 bg-gold-300 transition-all duration-300 group-hover:w-3" />
                  {t(link.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className="group inline-flex items-center gap-1.5 transition hover:text-gold-200">
                <span className="h-px w-0 bg-gold-300 transition-all duration-300 group-hover:w-3" />
                {t("nav.login")}
              </Link>
            </li>
          </ul>
        </StaggerItem>
        <StaggerItem>
          <h3 className="mb-4 font-display text-lg font-semibold text-gold-200">{t("footer.contact")}</h3>
          <ul className="space-y-3 text-sm text-ivory/75">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
              <span>{localized(settings?.address) || t("common.notProvided")}</span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
              <span dir="ltr">{settings?.contactPhone || t("common.notProvided")}</span>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
              <span dir="ltr">{settings?.contactEmail || t("common.notProvided")}</span>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-2">
            <a
              href={socials.whatsapp || whatsappUrl(t("whatsapp.greeting"))}
              target="_blank"
              rel="noreferrer"
              aria-label={t("whatsapp.chat")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] transition hover:-translate-y-0.5 hover:border-[#25D366] hover:text-[#25D366]"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
            {socials.facebook ? (
              <a href={socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-gold-300 hover:text-gold-300">
                f
              </a>
            ) : null}
            {socials.instagram ? (
              <a href={socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[10px] font-semibold transition hover:-translate-y-0.5 hover:border-gold-300 hover:text-gold-300">
                IG
              </a>
            ) : null}
            {socials.youtube ? (
              <a href={socials.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[10px] font-semibold transition hover:-translate-y-0.5 hover:border-gold-300 hover:text-gold-300">
                YT
              </a>
            ) : null}
          </div>
        </StaggerItem>
      </Stagger>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-xs text-ivory/55 sm:flex-row sm:px-6 sm:text-start lg:px-8">
          <p>© {year} {settings?.siteName || "Madrasa Miftah ul Uloom"}. {t("footer.rights")}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy" className="transition hover:text-gold-200">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="transition hover:text-gold-200">
              {t("footer.terms")}
            </Link>
            <Link href="/admissions/track" className="transition hover:text-gold-200">
              {t("nav.trackApplication")}
            </Link>
            <motion.button
              type="button"
              onClick={backToTop}
              whileHover={reduce ? undefined : { y: -2 }}
              whileTap={reduce ? undefined : { scale: 0.95 }}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-wider transition hover:border-gold-300 hover:text-gold-200"
              aria-label="Back to top"
            >
              <ArrowUp className="h-3 w-3" /> Top
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
