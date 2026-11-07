"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  ShoppingBag,
  Sparkles,
  Users
} from "lucide-react";
import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  AnimatedNumber,
  FloatingEmblem,
  FloatingOrbs,
  premiumEase,
  Reveal,
  Stagger,
  StaggerItem
} from "@/components/motion/primitives";
import { seedApiCache, useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatNumber } from "@/lib/format";
import type { Book, HomePayload } from "@/lib/types";
import { Badge } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingPanel, Skeleton } from "@/components/ui/feedback";
import { Section, SectionHeading } from "@/components/site/section";
import { AnnouncementCard, BookCard, EventCard, GalleryGrid, ProgramCard, Prose, TeacherCard } from "@/components/site/cards";

export function HomePage({ initial }: { initial?: HomePayload | null }) {
  const { t, localized, locale } = useLanguage();
  const reduce = useReducedMotion();
  const seeded = useRef(false);
  if (initial && !seeded.current) {
    seedApiCache("/public/home", initial);
    seeded.current = true;
  }
  const heroVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } }
  };
  const heroItem = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: premiumEase } }
  };
  const { data: home, loading: homeLoading } = useApi<HomePayload>("/public/home");
  const settings = home?.settings;
  const stats = home?.stats;
  const programs = home?.programs || [];
  const books = home?.books;
  const events = home?.events || [];
  const announcements = home?.announcements || [];
  const faculty = home?.faculty || [];
  const gallery = home?.gallery || [];
  const about = home?.about;
  const programsLoading = homeLoading && !home;
  const booksLoading = homeLoading && !books;

  const featuredPrograms = programs.slice(0, 3);
  const upcomingEvents = events.slice(0, 3);
  const latestAnnouncements = announcements.slice(0, 2);
  const featuredBooks = (books?.items || []).slice(0, 4);
  const featuredFaculty = faculty.slice(0, 3);
  const galleryPreview = gallery.slice(0, 5);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 text-ivory">
        <div aria-hidden className="pattern-islamic absolute inset-0 opacity-[0.13]" />
        {settings?.heroImage ? (
          <div aria-hidden className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.heroImage} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-brand-950/80" />
          </div>
        ) : null}
        <FloatingOrbs />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(200,164,93,0.12),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <motion.div initial={false} animate="visible" variants={heroVariants}>
            <motion.div variants={heroItem} className="mb-5 flex flex-wrap items-center gap-3">
              <Badge tone="gold">{settings?.admissionsOpen ? t("nav.applyNow") : t("nav.admissions")}</Badge>
              <span className="text-[11px] uppercase tracking-[0.28em] text-ivory/55">{t("home.heroEyebrow")}</span>
            </motion.div>
            <motion.h1
              variants={heroItem}
              className="max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.08] text-ivory sm:text-5xl lg:text-6xl"
            >
              {localized(settings?.heroTitle) || t("home.heroTitle")}
            </motion.h1>
            <motion.p variants={heroItem} className="mt-6 max-w-2xl text-sm leading-relaxed text-ivory/75 sm:text-base">
              {localized(settings?.heroSubtitle) || t("home.heroSubtitle")}
            </motion.p>
            <motion.div variants={heroItem} className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/admissions" variant="secondary" size="lg" className="group shine-sweep">
                {t("nav.applyNow")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </ButtonLink>
              <ButtonLink href="/programs" variant="outline" size="lg" className="border-white/25 bg-white/5 text-ivory hover:bg-white/10">
                {t("nav.programs")}
              </ButtonLink>
            </motion.div>
            <motion.p variants={heroItem} className="mt-6 flex items-center gap-2 text-xs text-ivory/55">
              <Sparkles className="h-3.5 w-3.5 text-gold-300" /> {localized(settings?.heroNote) || t("home.values")}
            </motion.p>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 34, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: premiumEase }}
            className="relative mx-auto w-full max-w-sm lg:max-w-none"
          >
            <div aria-hidden className="absolute -inset-6 rounded-[16rem] bg-gold-400/5 blur-2xl" />
            <FloatingEmblem className="relative">
              <div className="premium-border relative overflow-hidden rounded-t-[14rem] rounded-b-3xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_40px_100px_-50px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-8">
                <div aria-hidden className="pattern-lines absolute inset-0 opacity-40" />
                <motion.div
                  aria-hidden
                  className="absolute inset-3 rounded-t-[13rem] rounded-b-2xl border border-gold-400/15"
                  animate={reduce ? undefined : { opacity: [0.35, 0.8, 0.35] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative flex flex-col items-center text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings?.logoUrl || process.env.NEXT_PUBLIC_LOGO_URL || "/branding/emblem-placeholder.svg"}
                    alt={`${settings?.siteName || "Madrasa Miftah ul Uloom"} emblem`}
                    className="h-24 w-24 object-contain drop-shadow-[0_10px_30px_rgba(200,164,93,0.25)] sm:h-28 sm:w-28"
                  />
                  <div className="mt-5 h-px w-24 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
                  <p className="mt-5 font-display text-2xl font-semibold text-ivory">{settings?.siteName || "Madrasa Miftah ul Uloom"}</p>
                  <p className="mt-2 text-xs leading-relaxed text-ivory/65">{localized(settings?.brandSubtitle) || t("home.values")}</p>
                  <div className="mt-7 grid w-full grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-brand-950/30 py-4">
                    {[
                      { label: t("nav.programs"), value: stats?.programs ?? 0 },
                      { label: t("nav.faculty"), value: stats?.faculty ?? 0 },
                      { label: t("nav.books"), value: stats?.books ?? 0 }
                    ].map((item) => (
                      <div key={item.label} className="px-2">
                        <p className="font-display text-2xl font-semibold text-gold-300">
                          <AnimatedNumber value={item.value} format={(next) => formatNumber(Math.round(next), locale)} />
                        </p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ivory/55">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FloatingEmblem>
          </motion.div>
        </div>
        <motion.div
          aria-hidden
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.35, ease: premiumEase }}
          className="h-px w-full origin-left bg-gradient-to-r from-transparent via-gold-400/70 to-transparent rtl:origin-right"
        />
      </section>

      <div className="relative overflow-hidden border-b border-brand-950/10 bg-gradient-to-r from-gold-50/80 via-ivory to-gold-50/80">
        <div aria-hidden className="pattern-dots absolute inset-0 opacity-30" />
        <Stagger className="relative mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4 sm:px-6 lg:px-8" gap={0.08}>
          {[
            { icon: BookOpen, label: t("home.programsEyebrow"), value: stats?.programs ?? 0 },
            { icon: Users, label: t("home.facultyEyebrow"), value: stats?.faculty ?? 0 },
            { icon: ShoppingBag, label: t("nav.books"), value: stats?.books ?? 0 },
            { icon: CalendarDays, label: t("nav.events"), value: stats?.events ?? 0 }
          ].map((item) => (
            <StaggerItem key={item.label} className="group flex items-center justify-center gap-3">
              <span className="rounded-full bg-brand-950/5 p-2 text-brand-800 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-gold-100 group-hover:text-gold-800">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold leading-none text-brand-950">
                  <AnimatedNumber value={item.value} format={(next) => formatNumber(Math.round(next), locale)} />
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{item.label}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold-700">
              <span aria-hidden className="h-px w-6 bg-gold-500/70" />
              {t("home.aboutEyebrow")}
            </p>
            <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-brand-950 sm:text-4xl">{t("home.aboutTitle")}</h2>
            <div className="mt-5">
              {about ? (
                <Prose value={about.body} className="line-clamp-[8]" />
              ) : (
                <p className="text-sm leading-relaxed text-muted">{localized(settings?.aboutShort) || t("state.loading")}</p>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/about" variant="primary">
                {t("action.readMore")}
              </ButtonLink>
              <ButtonLink href="/mission-vision" variant="ghost">
                {t("nav.mission")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </ButtonLink>
            </div>
          </Reveal>
          <Stagger className="grid gap-4 sm:grid-cols-2" gap={0.09}>
            {[
              { title: t("home.values"), text: localized(settings?.tagline) || t("home.heroSubtitle"), icon: Sparkles },
              { title: t("nav.admissions"), text: t("home.admissionsText"), icon: GraduationCap },
              { title: t("nav.books"), text: t("books.subtitle"), icon: BookOpen },
              { title: t("nav.contact"), text: localized(settings?.address) || t("footer.contact"), icon: Users }
            ].map((card, index) => (
              <StaggerItem key={card.title}>
                <div
                  className={`group h-full rounded-2xl border border-brand-950/10 bg-white/85 p-5 shadow-card transition duration-300 ease-premium hover:-translate-y-1 hover:border-gold-500/30 hover:shadow-premium ${index % 2 === 1 ? "sm:translate-y-5" : ""}`}
                >
                  <span className="inline-flex rounded-xl bg-gold-50 p-2 text-gold-700 transition group-hover:scale-105">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-brand-950">{card.title}</h3>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted">{card.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section className="rounded-[2rem] bg-white/50 py-14 shadow-inner sm:py-16">
        <SectionHeading
          eyebrow={t("home.programsEyebrow")}
          title={t("home.programsTitle")}
          description={t("home.programsSubtitle")}
          action={
            <ButtonLink href="/programs" variant="outline">
              {t("action.viewAll")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </ButtonLink>
          }
        />
        {programsLoading ? (
          <LoadingPanel label={t("state.loading")} />
        ) : featuredPrograms.length ? (
          <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {featuredPrograms.map((program, index) => (
              <StaggerItem key={program._id} variant="scale">
                <ProgramCard program={program} index={index} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <EmptyState title={t("state.empty")} description={t("state.emptyHint")} />
        )}
      </Section>

      <Section>
        <SectionHeading
          eyebrow={t("home.booksEyebrow")}
          title={t("home.booksTitle")}
          description={t("books.storeNote")}
          action={
            <ButtonLink href="/books" variant="outline">
              {t("nav.visitStore")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </ButtonLink>
          }
        />
        {booksLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-96" />
            ))}
          </div>
        ) : featuredBooks.length ? (
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
            {featuredBooks.map((book: Book) => (
              <StaggerItem key={book.id} variant="scale">
                <BookCard book={book} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <EmptyState title={t("books.noResults")} description={t("state.emptyHint")} />
        )}
      </Section>

      <Section className="bg-brand-950/[0.03]">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <SectionHeading
              eyebrow={t("home.eventsEyebrow")}
              title={t("home.eventsTitle")}
              action={
                <ButtonLink href="/events" variant="ghost" size="sm">
                  {t("action.viewAll")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </ButtonLink>
              }
            />
            {upcomingEvents.length ? (
              <Stagger className="grid gap-4" gap={0.07}>
                {upcomingEvents.map((event) => (
                  <StaggerItem key={event._id}>
                    <EventCard event={event} />
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <EmptyState title={t("state.empty")} description={t("state.emptyHint")} />
            )}
          </div>
          <div>
            <SectionHeading
              eyebrow={t("nav.announcements")}
              title={t("home.announcementsTitle")}
              action={
                <ButtonLink href="/announcements" variant="ghost" size="sm">
                  {t("action.viewAll")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </ButtonLink>
              }
            />
            {latestAnnouncements.length ? (
              <Stagger className="grid gap-4" gap={0.07}>
                {latestAnnouncements.map((announcement) => (
                  <StaggerItem key={announcement._id}>
                    <AnnouncementCard announcement={announcement} />
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <EmptyState title={t("state.empty")} description={t("state.emptyHint")} />
            )}
          </div>
        </div>
      </Section>

      {featuredFaculty.length ? (
        <Section>
          <SectionHeading
            eyebrow={t("home.facultyEyebrow")}
            title={t("home.facultyTitle")}
            action={
              <ButtonLink href="/faculty" variant="outline">
                {t("action.viewAll")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </ButtonLink>
            }
          />
          <Stagger className="grid gap-5 md:grid-cols-3" gap={0.08}>
            {featuredFaculty.map((teacher) => (
              <StaggerItem key={teacher._id} variant="scale">
                <TeacherCard teacher={teacher} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      ) : null}

      {galleryPreview.length ? (
        <Section>
          <SectionHeading
            eyebrow={t("home.galleryEyebrow")}
            title={t("home.galleryTitle")}
            action={
              <ButtonLink href="/gallery" variant="outline">
                {t("action.viewAll")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </ButtonLink>
            }
          />
          <GalleryGrid items={galleryPreview} />
        </Section>
      ) : null}

      <Section>
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-brand-950 px-6 py-12 text-ivory shadow-premium sm:px-12 sm:py-14">
          <div aria-hidden className="pattern-islamic absolute inset-0 opacity-[0.14]" />
          <FloatingOrbs />
          <div aria-hidden className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold-300">{t("home.admissionsEyebrow")}</p>
              <h2 className="font-display text-3xl font-semibold text-ivory sm:text-4xl">{t("home.admissionsTitle")}</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ivory/70">{t("home.admissionsText")}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[t("nav.applyNow"), t("nav.trackApplication"), t("nav.contact")].map((label) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-ivory/75">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gold-300" /> {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ButtonLink href="/admissions" variant="secondary" size="lg" className="shine-sweep">
                {t("nav.applyNow")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </ButtonLink>
              <ButtonLink href="/admissions/track" variant="outline" size="lg" className="border-white/25 bg-white/5 text-ivory hover:bg-white/10">
                {t("nav.trackApplication")}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Section>

    </>
  );
}
