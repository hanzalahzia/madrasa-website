"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { premiumEase } from "@/components/motion/primitives";

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
  compact = false
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: premiumEase } }
  };

  return (
    <section className="relative overflow-hidden bg-brand-950 text-ivory">
      <div aria-hidden className="pattern-islamic absolute inset-0 opacity-[0.14]" />
      <motion.div
        aria-hidden
        className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
        animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 start-1/4 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl"
        animate={reduce ? undefined : { scale: [1, 1.08, 1], x: [0, 16, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-950/60" />

      <div className={cn("relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", compact ? "py-10 sm:py-14" : "py-14 sm:py-20")}>
        <motion.div initial={reduce ? false : "hidden"} animate="visible" variants={container}>
          {breadcrumbs?.length ? (
            <motion.nav
              variants={item}
              aria-label="Breadcrumb"
              className="mb-6 flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-widest text-ivory/60"
            >
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 ? <ChevronRight className="h-3 w-3 rtl:rotate-180" aria-hidden /> : null}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition hover:text-gold-200">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gold-200">{crumb.label}</span>
                  )}
                </span>
              ))}
            </motion.nav>
          ) : null}
          <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              {eyebrow ? (
                <motion.p
                  variants={item}
                  className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-300"
                >
                  <span aria-hidden className="h-px w-8 bg-gradient-to-r from-gold-400 to-transparent" />
                  {eyebrow}
                </motion.p>
              ) : null}
              <motion.h1
                variants={item}
                className="max-w-4xl text-balance font-display text-4xl font-semibold leading-tight text-ivory sm:text-5xl lg:text-6xl"
              >
                {title}
              </motion.h1>
              {description ? (
                <motion.div variants={item} className="mt-5 max-w-2xl text-sm leading-relaxed text-ivory/75 sm:text-base">
                  {description}
                </motion.div>
              ) : null}
            </div>
            {children ? <motion.div variants={item}>{children}</motion.div> : null}
          </div>
        </motion.div>
      </div>
      <motion.div
        aria-hidden
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.1, ease: premiumEase }}
        className="h-1 w-full origin-left bg-gradient-to-r from-gold-600 via-gold-300 to-emerald-500 rtl:origin-right"
      />
    </section>
  );
}
