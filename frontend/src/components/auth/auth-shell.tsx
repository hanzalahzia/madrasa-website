"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "@/lib/language-context";
import { useApi } from "@/lib/use-api";
import type { PublicSettings } from "@/lib/types";
import { Section } from "@/components/site/section";
import { premiumEase } from "@/components/motion/primitives";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t, localized } = useLanguage();
  const { data: settings } = useApi<PublicSettings>("/public/settings");
  const siteName = settings?.siteName || "Madrasa Miftah ul Uloom";
  const logo = settings?.logoUrl || process.env.NEXT_PUBLIC_LOGO_URL || "/branding/emblem-placeholder.svg";
  const reduce = useReducedMotion();
  return (
    <Section className="max-w-5xl">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 26, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: premiumEase }}
        className="grid overflow-hidden rounded-[2rem] border border-brand-950/10 bg-white shadow-premium lg:grid-cols-[1fr_0.85fr]"
      >
        <div className="p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-700">{eyebrow}</p>
          <h1 className="mt-2 text-balance font-display text-3xl font-semibold text-brand-950 sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 border-t border-brand-950/10 pt-5 text-sm text-muted">{footer}</div> : null}
        </div>
        <div className="relative hidden overflow-hidden bg-brand-950 p-10 text-ivory lg:flex lg:flex-col lg:justify-between">
          <div aria-hidden className="pattern-islamic absolute inset-0 opacity-[0.15]" />
          <motion.div
            aria-hidden
            className="absolute -end-16 top-1/4 h-52 w-52 rounded-full bg-gold-400/10 blur-3xl"
            animate={reduce ? undefined : { y: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute -start-12 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
            animate={reduce ? undefined : { y: [0, 18, 0], x: [0, 10, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo}
                alt={siteName}
                className="h-14 w-14 object-contain drop-shadow-[0_8px_24px_rgba(200,164,93,0.3)]"
              />
              <span className="font-display text-xl font-semibold">{siteName}</span>
            </Link>
          </div>
          <div className="relative">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: premiumEase }}
              className="text-balance font-display text-3xl leading-snug text-gold-200"
            >
              {localized(settings?.heroTitle) || t("home.heroTitle")}
            </motion.p>
            <p className="mt-4 text-xs leading-relaxed text-ivory/60">{t("auth.demoNotice")}</p>
            <Link href="/" className="mt-6 inline-flex text-xs font-semibold text-gold-300 underline underline-offset-4">
              {t("nav.home")}
            </Link>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
