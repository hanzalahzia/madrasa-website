"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { premiumEase } from "@/components/motion/primitives";

export function Section({
  className,
  children,
  id
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  className
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.65, ease: premiumEase }}
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-10",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold-700">
            {align === "center" ? null : <span aria-hidden className="h-px w-6 bg-gold-500/70" />}
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-brand-950 sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </motion.div>
  );
}
