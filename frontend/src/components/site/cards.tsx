"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Clock, MapPin, Plus, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";
import { availabilityLabel, formatDate, formatMoney } from "@/lib/format";
import type { Localized } from "@/lib/i18n";
import type { Announcement, Book, EventItem, GalleryItem, Program, Teacher } from "@/lib/types";
import { cn, initials, paragraphs } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Expandable,
  premiumEase,
  springs,
  Stagger,
  StaggerItem
} from "@/components/motion/primitives";

export function ProgramCard({ program, index = 0 }: { program: Program; index?: number }) {
  const { t, localized } = useLanguage();
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -6 }}
      transition={springs.soft}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand-950/10 bg-white/90 shadow-card transition-shadow duration-300 hover:border-gold-500/30 hover:shadow-premium"
    >
      <Link href={`/programs/${program.slug}`} className="flex flex-1 flex-col">
        <div className="relative h-44 overflow-hidden bg-brand-950">
          {program.image ? (
            <Image
              src={program.image}
              alt={localized(program.title)}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-700 ease-premium group-hover:scale-105"
            />
          ) : (
            <div className="pattern-islamic flex h-full items-center justify-center bg-gradient-to-br from-brand-950 to-brand-800 opacity-95">
              <span className="font-display text-6xl text-gold-300/70">{String(index + 1).padStart(2, "0")}</span>
            </div>
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-950/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="absolute start-4 top-4 rounded-full bg-ivory/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand-900 shadow-sm">
            {program.duration || t("nav.programs")}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-xl font-semibold text-brand-950 transition-colors group-hover:text-brand-800">
            {localized(program.title)}
          </h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{localized(program.summary)}</p>
          <div className="mt-4 flex items-center justify-between text-xs font-medium text-brand-800">
            <span>{program.ageGroup || t("nav.programs")}</span>
            <span className="inline-flex items-center gap-1 transition-all group-hover:gap-2 group-hover:text-gold-700">
              {t("action.readMore")} <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function BookCard({ book }: { book: Book }) {
  const { t, localized, locale } = useLanguage();
  const { add } = useCart();
  const reduce = useReducedMotion();
  const title = localized(book.title);
  const soldOut = book.availability === "out_of_stock";
  const tone = soldOut ? "danger" : book.availability === "low_stock" ? "warning" : "success";

  function addToCart() {
    if (soldOut) return;
    add(book);
    toast.success(t("books.addedToCart"));
  }

  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -5 }}
      transition={springs.soft}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brand-950/10 bg-white/90 shadow-card transition-shadow duration-300 hover:border-gold-500/30 hover:shadow-premium"
    >
      <Link href={`/books/${book.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-brand-950/[0.04]">
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 ease-premium group-hover:scale-[1.04]"
          />
        ) : (
          <div className="pattern-islamic flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-900 via-brand-950 to-brand-800 p-5 text-center">
            <span className="font-display text-4xl text-gold-300/80">﷽</span>
            <span className="line-clamp-4 font-display text-lg leading-snug text-ivory">{title}</span>
          </div>
        )}
        {book.salePrice ? (
          <span className="absolute start-3 top-3 rounded-full bg-gold-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-sm">
            {t("books.sale")}
          </span>
        ) : null}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-950/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-muted">
          <span className="truncate">{localized(book.category?.name) || book.sku}</span>
          <Badge tone={tone}>{availabilityLabel(book.availability, locale)}</Badge>
        </div>
        <Link href={`/books/${book.slug}`} className="line-clamp-2 font-display text-lg font-semibold leading-snug text-brand-950 hover:text-brand-800">
          {title}
        </Link>
        <p className="mt-1 text-xs text-muted">{book.author}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="font-semibold text-brand-950">{formatMoney(book.effectivePrice, locale)}</p>
            {book.salePrice ? (
              <p className="text-[11px] text-muted line-through">{formatMoney(book.price, locale)}</p>
            ) : null}
          </div>
          <Button
            size="icon"
            variant={soldOut ? "outline" : "primary"}
            disabled={soldOut}
            onClick={addToCart}
            aria-label={`${t("books.addToCart")}: ${title}`}
            title={soldOut ? t("books.outOfStock") : t("books.addToCart")}
            className="transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export function EventCard({ event }: { event: EventItem }) {
  const { localized, locale } = useLanguage();
  const reduce = useReducedMotion();
  const date = new Date(event.startDate);
  return (
    <motion.div whileHover={reduce ? undefined : { x: 4 }} transition={springs.soft}>
      <Link
        href={`/events/${event.slug}`}
        className="group flex gap-4 rounded-2xl border border-brand-950/10 bg-white/90 p-4 shadow-card transition-all duration-300 hover:border-gold-500/30 hover:shadow-premium"
      >
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-950 text-ivory shadow-sm transition-colors group-hover:bg-brand-900">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gold-300">
            {Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(locale, { month: "short" })}
          </span>
          <span className="font-display text-2xl font-semibold leading-none">
            {Number.isNaN(date.getTime()) ? "—" : date.getDate()}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-display text-lg font-semibold text-brand-950 group-hover:text-brand-800">
            {localized(event.title)}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{localized(event.description)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(event.startDate, locale, true)}
            </span>
            {localized(event.location) ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {localized(event.location)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const { t, localized, locale } = useLanguage();
  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={springs.soft}
      className="rounded-2xl border border-brand-950/10 bg-white/90 p-5 shadow-card transition-colors hover:border-gold-500/25"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {announcement.pinned ? <Badge tone="gold">{t("action.publish")}</Badge> : null}
        <Badge tone="neutral">{announcement.category || t("nav.announcements")}</Badge>
        <span className="text-[11px] text-muted">{formatDate(announcement.publishDate, locale)}</span>
      </div>
      <h3 className="font-display text-xl font-semibold text-brand-950">{localized(announcement.title)}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{localized(announcement.body)}</p>
    </motion.article>
  );
}

export function TeacherCard({ teacher }: { teacher: Teacher }) {
  const { t, localized } = useLanguage();
  const reduce = useReducedMotion();
  const programs = Array.isArray(teacher.programs)
    ? teacher.programs
        .map((program) => (typeof program === "string" ? "" : localized(program.title)))
        .filter(Boolean)
    : [];
  return (
    <motion.div whileHover={reduce ? undefined : { y: -4 }} transition={springs.soft}>
      <Card className="flex h-full flex-col transition-colors duration-300 hover:border-gold-500/30">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-950 font-display text-xl text-gold-300 ring-2 ring-gold-500/20">
            {initials(teacher.name)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl font-semibold text-brand-950">{teacher.name}</h3>
            <p className="truncate text-xs text-muted">{teacher.qualifications || t("nav.faculty")}</p>
          </div>
        </div>
        <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-muted">
          {localized(teacher.bio) || teacher.qualifications || t("state.emptyHint")}
        </p>
        {programs.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {programs.slice(0, 3).map((program) => (
              <Badge key={program} tone="neutral">
                {program}
              </Badge>
            ))}
          </div>
        ) : null}
      </Card>
    </motion.div>
  );
}

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const { localized } = useLanguage();
  const [active, setActive] = useState<GalleryItem | null>(null);
  return (
    <>
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.07}>
        {items.map((item, index) => (
          <StaggerItem key={item._id} variant="scale" className={cn(index % 5 === 0 && "sm:col-span-2 sm:row-span-2")}>
            <button
              type="button"
              onClick={() => setActive(item)}
              className={cn(
                "group relative w-full overflow-hidden rounded-2xl border border-brand-950/10 bg-brand-950 text-start shadow-card transition-shadow duration-300 hover:shadow-premium",
                index % 5 === 0 ? "aspect-square" : "aspect-[4/3]"
              )}
            >
              <Image
                src={item.image}
                alt={localized(item.alt) || localized(item.title) || "Madrasa gallery image"}
                fill
                sizes={index % 5 === 0 ? "(min-width: 640px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                className="object-cover transition duration-700 ease-premium group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-brand-950/90 to-transparent p-4 pt-10 text-sm font-medium text-ivory">
                {localized(item.title) || item.category || ""}
              </span>
            </button>
          </StaggerItem>
        ))}
      </Stagger>
      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={localized(active?.title) || "Gallery"} size="lg">
        {active ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
            <Image
              src={active.image}
              alt={localized(active.alt) || localized(active.title) || "Gallery image"}
              fill
              sizes="(min-width: 1024px) 80vw, 100vw"
              className="object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}

export function Prose({ value, className }: { value: unknown; className?: string }) {
  const { localized } = useLanguage();
  const text = localized(value as { en?: string; ur?: string; ar?: string } | string | null | undefined);
  return (
    <div className={cn("space-y-4 text-sm leading-8 text-ink/80 sm:text-[15px]", className)}>
      {paragraphs(text).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

export function MetaItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-950/10 bg-white/70 p-3 transition hover:border-gold-500/30 hover:bg-white">
      {icon ? <span className="mt-0.5 text-brand-700">{icon}</span> : null}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

export function CalendarMeta({ date, locale }: { date: string; locale: Parameters<typeof formatDate>[1] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <CalendarDays className="h-3.5 w-3.5" /> {formatDate(date, locale)}
    </span>
  );
}

export function AuthorMeta({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <UserRound className="h-3.5 w-3.5" /> {name}
    </span>
  );
}

export function FaqAccordion({ items }: { items: Array<{ id: string; question: Localized; answer: Localized }> }) {
  const { localized } = useLanguage();
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="divide-y divide-brand-950/10 overflow-hidden rounded-2xl border border-brand-950/10 bg-white/90 shadow-card">
      {items.map((item) => {
        const expanded = open === item.id;
        return (
          <div key={item.id} className="px-5 py-4 transition-colors hover:bg-gold-50/30">
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : item.id)}
              aria-expanded={expanded}
              aria-controls={`faq-${item.id}`}
              className="flex w-full cursor-pointer items-center justify-between gap-4 text-start font-medium text-brand-950"
            >
              {localized(item.question)}
              <motion.span
                animate={{ rotate: expanded ? 45 : 0 }}
                transition={{ duration: 0.25, ease: premiumEase }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-950/5 text-lg leading-none text-gold-700"
              >
                ＋
              </motion.span>
            </button>
            <Expandable open={expanded}>
              <div id={`faq-${item.id}`} className="pt-3 text-sm leading-7 text-muted">
                {localized(item.answer)}
              </div>
            </Expandable>
          </div>
        );
      })}
    </div>
  );
}
