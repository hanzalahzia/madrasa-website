"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
  Sparkles,
  UserRound,
  X
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useApi, prefetchApi } from "@/lib/use-api";
import { useAuth, portalPathFor } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import type { PublicSettings } from "@/lib/types";
import { springs } from "@/components/motion/primitives";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";

interface NavLink {
  href: string;
  key: string;
}

const primaryLinks: NavLink[] = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/programs", key: "nav.programs" },
  { href: "/admissions", key: "nav.admissions" },
  { href: "/faculty", key: "nav.faculty" },
  { href: "/books", key: "nav.books" },
  { href: "/contact", key: "nav.contact" }
];

const moreLinks: NavLink[] = [
  { href: "/mission-vision", key: "nav.mission" },
  { href: "/management", key: "nav.management" },
  { href: "/facilities", key: "nav.facilities" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/events", key: "nav.events" },
  { href: "/announcements", key: "nav.announcements" },
  { href: "/faqs", key: "nav.faqs" }
];

const prefetchMap: Record<string, string> = {
  "/programs": "/public/programs",
  "/faculty": "/public/faculty",
  "/books": "/public/books?limit=12",
  "/events": "/public/events",
  "/announcements": "/public/announcements",
  "/gallery": "/public/gallery",
  "/faqs": "/public/faqs",
  "/about": "/public/pages/about",
  "/mission-vision": "/public/pages/mission-vision",
  "/management": "/public/pages/management",
  "/facilities": "/public/pages/facilities"
};

function warmLink(href: string) {
  const target = prefetchMap[href];
  if (target) prefetchApi(target);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, localized } = useLanguage();
  const { user, loading, logout } = useAuth();
  const { count } = useCart();
  const { data: settings } = useApi<PublicSettings>("/public/settings");
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (moreRef.current && !moreRef.current.contains(target)) setMoreOpen(false);
      if (accountRef.current && !accountRef.current.contains(target)) setAccountOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreOpen(false);
        setAccountOpen(false);
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const announcement = localized(settings?.announcementBar);

  async function signOut() {
    await logout();
    toast.success(t("auth.signedOut"));
    router.push("/");
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300",
        scrolled
          ? "border-brand-950/10 bg-ivory/90 shadow-[0_18px_50px_-32px_rgba(6,78,59,0.45)] backdrop-blur-xl"
          : "border-transparent bg-ivory/80 backdrop-blur-md"
      )}
    >
      <AnimatePresence initial={false}>
        {announcement ? (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/announcements"
              className="group relative block overflow-hidden bg-brand-950 px-4 py-2 text-center text-[11px] font-medium tracking-wide text-ivory transition hover:bg-brand-900 sm:text-xs"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-gold-300" />
                <span className="line-clamp-1">{announcement}</span>
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gold-400/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
              />
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <motion.div whileHover={reduce ? undefined : { scale: 1.01 }} transition={springs.soft}>
          <Brand compact />
        </motion.div>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          {primaryLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => warmLink(link.href)}
                onFocus={() => warmLink(link.href)}
                className={cn(
                  "relative rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-brand-950" : "text-ink/70 hover:text-brand-950"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="site-nav-active"
                    className="absolute inset-0 rounded-full bg-brand-950/[0.06] ring-1 ring-inset ring-brand-950/5"
                    transition={springs.snappy}
                  />
                ) : null}
                <span className="relative z-10">{t(link.key)}</span>
              </Link>
            );
          })}
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                moreOpen ? "bg-brand-950/5 text-brand-950" : "text-ink/70 hover:bg-brand-950/5 hover:text-brand-950"
              )}
              aria-expanded={moreOpen}
            >
              {t("nav.more")}
              <motion.span animate={{ rotate: moreOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </button>
            <AnimatePresence>
              {moreOpen ? (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute end-0 top-full z-50 mt-2 w-64 origin-top overflow-hidden rounded-2xl border border-brand-950/10 bg-ivory/95 p-2 shadow-soft backdrop-blur-xl"
                >
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onMouseEnter={() => warmLink(link.href)}
                      onFocus={() => warmLink(link.href)}
                      className={cn(
                        "block rounded-xl px-3 py-2 text-sm transition",
                        isActive(link.href)
                          ? "bg-gold-50 font-medium text-brand-950"
                          : "text-ink/75 hover:bg-gold-50/70 hover:text-brand-950"
                      )}
                    >
                      {t(link.key)}
                    </Link>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher compact />
          </div>
          <Link
            href="/cart"
            className="group relative rounded-full p-2.5 text-brand-950 transition hover:bg-brand-950/5"
            aria-label={`${t("nav.cart")} (${count})`}
          >
            <ShoppingCart className="h-5 w-5 transition group-hover:-rotate-6" />
            <AnimatePresence>
              {count > 0 ? (
                <motion.span
                  key={count}
                  initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springs.snappy}
                  className="absolute -end-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink shadow-sm"
                >
                  {count}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </Link>

          {loading ? (
            <span className="hidden h-9 w-20 animate-pulse rounded-full bg-brand-950/5 sm:block" />
          ) : user ? (
            <div ref={accountRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-brand-950/10 bg-white/70 py-1.5 pe-3 ps-1.5 text-sm font-medium text-brand-950 transition hover:border-brand-950/25 hover:bg-white"
                aria-expanded={accountOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-950 text-xs font-semibold text-ivory">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[6rem] truncate">{user.name.split(" ")[0]}</span>
                <motion.span animate={{ rotate: accountOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
              </button>
              <AnimatePresence>
                {accountOpen ? (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute end-0 top-full z-50 mt-2 w-60 origin-top rounded-2xl border border-brand-950/10 bg-ivory/95 p-2 shadow-soft backdrop-blur-xl"
                  >
                    <Link
                      href={portalPathFor(user.role)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-gold-50"
                    >
                      <LayoutDashboard className="h-4 w-4" /> {user.role === "super_admin" ? t("nav.admin") : t("nav.portal")}
                    </Link>
                    <Link href="/account" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-gold-50">
                      <UserRound className="h-4 w-4" /> {t("auth.myAccount")}
                    </Link>
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-red-700 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> {t("nav.logout")}
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-full bg-brand-950 px-4 py-2 text-sm font-semibold text-ivory shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-900 hover:shadow-md sm:flex"
            >
              <UserRound className="h-4 w-4" /> {t("nav.login")}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="relative rounded-full p-2.5 text-brand-950 transition hover:bg-brand-950/5 xl:hidden"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "close" : "open"}
                initial={reduce ? false : { rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={reduce ? undefined : { rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-brand-950/10 bg-ivory/95 backdrop-blur-xl xl:hidden"
          >
            <div className="px-4 pb-6 pt-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <LanguageSwitcher />
                {user ? (
                  <Link href={portalPathFor(user.role)} className="rounded-full bg-brand-950 px-3 py-2 text-xs font-semibold text-ivory">
                    {user.role === "super_admin" ? t("nav.admin") : t("nav.portal")}
                  </Link>
                ) : (
                  <Link href="/login" className="rounded-full bg-brand-950 px-3 py-2 text-xs font-semibold text-ivory">
                    {t("nav.login")}
                  </Link>
                )}
              </div>
              <motion.nav
                className="grid gap-1"
                aria-label="Mobile navigation"
                initial={reduce ? false : "hidden"}
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.035 } } }}
              >
                {[...primaryLinks, ...moreLinks].map((link) => (
                  <motion.div
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      visible: { opacity: 1, x: 0 }
                    }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        "block rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        isActive(link.href) ? "bg-gold-50 text-brand-950" : "text-ink/75 hover:bg-brand-950/5"
                      )}
                    >
                      {t(link.key)}
                    </Link>
                  </motion.div>
                ))}
                {user ? (
                  <motion.button
                    type="button"
                    onClick={signOut}
                    variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                    className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-red-700"
                  >
                    <LogOut className="h-4 w-4" /> {t("nav.logout")}
                  </motion.button>
                ) : null}
              </motion.nav>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
