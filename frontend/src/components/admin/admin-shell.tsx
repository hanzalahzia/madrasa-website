"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Command,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  School,
  ScrollText,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
  X
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import type { NotificationItem, PublicSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/feedback";
import { PageTransition, premiumEase, springs } from "@/components/motion/primitives";

const groups = [
  {
    label: "Workspace",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/admissions", label: "Admissions", icon: ClipboardList },
      { href: "/admin/students", label: "Students", icon: GraduationCap },
      { href: "/admin/academics", label: "Academics", icon: School }
    ]
  },
  {
    label: "Finance",
    items: [{ href: "/admin/finance", label: "Fees & invoices", icon: Wallet }]
  },
  {
    label: "Bookstore",
    items: [
      { href: "/admin/books", label: "Books", icon: BookOpen },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/whatsapp-orders", label: "WhatsApp orders", icon: MessageCircle }
    ]
  },
  {
    label: "Website",
    items: [
      { href: "/admin/content", label: "Content", icon: FileText },
      { href: "/admin/messages", label: "Messages", icon: Mail }
    ]
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit", label: "Audit log", icon: ScrollText }
    ]
  }
];

const flatItems = groups.flatMap((group) => group.items);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: settings } = useApi<PublicSettings>("/public/settings");
  const siteName = settings?.siteName || "Madrasa Miftah ul Uloom";
  const logo = settings?.logoUrl || process.env.NEXT_PUBLIC_LOGO_URL || "/branding/emblem-placeholder.svg";
  const { data: notificationData } = useApi<{ items: NotificationItem[] }>("/admin/notifications", {
    enabled: Boolean(user)
  });
  const unread = (notificationData?.items || []).filter((item) => !item.readAt).length;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }
    if (user.role !== "super_admin") router.replace("/portal");
  }, [user, loading, pathname, router]);

  useEffect(() => {
    setOpen(false);
    setPaletteOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = original;
    };
  }, [paletteOpen]);

  const current = useMemo(() => {
    const matches = flatItems.filter((item) => item.href !== "/admin" && pathname?.startsWith(item.href));
    return matches.sort((a, b) => b.href.length - a.href.length)[0] || flatItems[0];
  }, [pathname]);

  const currentGroup = useMemo(
    () => groups.find((group) => group.items.some((item) => item.href === current.href))?.label || "Workspace",
    [current]
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return flatItems;
    return flatItems.filter((item) => item.label.toLowerCase().includes(needle) || item.href.includes(needle));
  }, [query]);

  if (loading || !user || user.role !== "super_admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-ivory">
        <motion.div
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/30 bg-white shadow-glow"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt={`${siteName} emblem`}
            className="h-10 w-10 object-contain"
          />
        </motion.div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Spinner className="h-4 w-4 text-brand-800" />
          Checking your access…
        </div>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.08),_transparent_30%),linear-gradient(180deg,#fbf9f4,#f4f1e8)]">
      <AnimatePresence>
        {open ? (
          <motion.button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-brand-950/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-72 flex-col overflow-hidden border-e border-white/10 bg-brand-950 text-ivory shadow-[30px_0_80px_-40px_rgba(6,78,59,0.6)] transition-transform duration-300 ease-premium lg:translate-x-0 rtl:lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        )}
      >
        <div aria-hidden className="pattern-islamic absolute inset-0 opacity-[0.07]" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />

        <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
          <Link href="/admin" className="group flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gold-400/40 bg-white/5 transition group-hover:border-gold-300/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo}
                alt={`${siteName} emblem`}
                className="h-9 w-9 object-contain"
              />
            </span>
            <span className="leading-tight">
              <span className="block max-w-40 truncate font-display text-base font-semibold">{siteName}</span>
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-gold-300">
                <Sparkles className="h-2.5 w-2.5" /> Admin portal
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-full p-2 text-ivory/70 transition hover:bg-white/10 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative px-3 pt-4">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-start text-xs text-ivory/55 transition hover:border-gold-400/30 hover:bg-white/10 hover:text-ivory"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1">Search admin…</span>
            <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-sans text-[9px] text-ivory/45">Ctrl K</kbd>
          </button>
        </div>

        <nav className="relative flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/40">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active ? "text-gold-100" : "text-ivory/70 hover:bg-white/5 hover:text-ivory"
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="admin-nav-active"
                          className="admin-nav-active absolute inset-0 rounded-xl bg-gold-400/15 ring-1 ring-inset ring-gold-400/30"
                          transition={reduce ? { duration: 0 } : springs.snappy}
                        />
                      ) : null}
                      <Icon className={cn("relative z-10 h-4 w-4 shrink-0 transition", active ? "text-gold-300" : "group-hover:text-gold-300")} />
                      <span className="relative z-10 flex-1">{item.label}</span>
                      {item.href === "/admin/notifications" && unread > 0 ? (
                        <span className="relative z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[9px] font-bold text-ink">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      ) : null}
                      {active ? <ChevronRight className="relative z-10 h-3.5 w-3.5 rtl:rotate-180" /> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-400/20 text-xs font-semibold text-gold-200 ring-1 ring-gold-400/20">
              {initials || "A"}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-[11px] text-ivory/50">{user.email}</span>
            </span>
            <button
              type="button"
              onClick={() => void logout().then(() => router.replace("/login"))}
              className="rounded-full p-2 text-ivory/60 transition hover:bg-white/10 hover:text-ivory"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:ps-72">
        <header className="sticky top-0 z-30 border-b border-brand-950/10 bg-ivory/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="rounded-full border border-brand-950/10 bg-white p-2 text-brand-950 shadow-sm lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">
                Administration
                <ChevronRight className="h-2.5 w-2.5 rtl:rotate-180" />
                <span className="text-muted">{currentGroup}</span>
              </p>
              <h1 className="truncate font-display text-xl font-semibold text-brand-950">{current.label}</h1>
            </div>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-brand-950/10 bg-white px-3 py-2 text-xs font-medium text-muted shadow-sm transition hover:border-gold-500/30 hover:text-brand-950 md:flex"
            >
              <Command className="h-3.5 w-3.5" />
              Quick search
              <kbd className="rounded border border-brand-950/10 bg-brand-950/[0.03] px-1.5 py-0.5 font-sans text-[9px] text-muted">Ctrl K</kbd>
            </button>

            <Link
              href="/admin/notifications"
              className="relative hidden items-center gap-2 rounded-full border border-brand-950/10 bg-white px-3 py-2 text-xs font-medium text-muted shadow-sm transition hover:border-gold-500/30 hover:text-brand-950 sm:flex"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden lg:inline">Notifications</span>
              {unread > 0 ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[9px] font-bold text-ink">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
            <Link
              href="/"
              className="hidden rounded-full border border-brand-950/10 bg-white px-3 py-2 text-xs font-medium text-brand-950 shadow-sm transition hover:border-gold-500/30 sm:block"
            >
              View website
            </Link>
            <Link
              href="/account"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-950 text-xs font-semibold text-ivory shadow-sm transition hover:bg-brand-900"
              aria-label="Account"
            >
              {initials || "A"}
            </Link>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
      </div>

      <AnimatePresence>
        {paletteOpen ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-start justify-center bg-brand-950/55 p-4 pt-[12vh] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPaletteOpen(false);
            }}
          >
            <motion.div
              initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.985 }}
              transition={{ duration: 0.22, ease: premiumEase }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-ivory shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-brand-950/10 bg-white/80 px-4 py-3">
                <Search className="h-4 w-4 text-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Jump to a page or search…"
                  className="h-9 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/60"
                />
                <button
                  type="button"
                  onClick={() => setPaletteOpen(false)}
                  className="rounded-full p-1.5 text-muted transition hover:bg-brand-950/5 hover:text-brand-950"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {results.length ? (
                  results.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setPaletteOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/80 transition hover:bg-gold-50 hover:text-brand-950"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-950/5 text-brand-800">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted">{item.href}</span>
                      </Link>
                    );
                  })
                ) : (
                  <p className="px-3 py-8 text-center text-sm text-muted">No matching admin pages.</p>
                )}
              </div>
              <div className="border-t border-brand-950/10 bg-white/60 px-4 py-2 text-[10px] uppercase tracking-wider text-muted">
                Press Esc to close · Ctrl K to reopen
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
