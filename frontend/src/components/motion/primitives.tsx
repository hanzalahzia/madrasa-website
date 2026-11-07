"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type Transition,
  type Variants
} from "motion/react";
import { cn } from "@/lib/utils";

export const premiumEase = [0.16, 1, 0.3, 1] as const;

export const springs = {
  soft: { type: "spring", stiffness: 180, damping: 24, mass: 0.8 } satisfies Transition,
  snappy: { type: "spring", stiffness: 380, damping: 30 } satisfies Transition
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: premiumEase } }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: premiumEase } }
};

export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } }
});

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 18 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.65, ease: premiumEase } }
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  once = true,
  amount = 0.2,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  amount?: number;
} & Omit<HTMLMotionProps<"div">, "children" | "initial" | "whileInView" | "viewport" | "transition">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.7, delay, ease: premiumEase }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  delay = 0,
  gap = 0.08,
  once = true,
  amount = 0.15,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  gap?: number;
  once?: boolean;
  amount?: number;
} & Omit<HTMLMotionProps<"div">, "children" | "initial" | "whileInView" | "viewport" | "variants">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once, amount }}
      variants={staggerContainer(gap, delay)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  variant = "up",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "up" | "scale" | "fade";
} & Omit<HTMLMotionProps<"div">, "children" | "variants">) {
  return (
    <motion.div
      variants={variant === "scale" ? scaleIn : variant === "fade" ? fadeIn : fadeUp}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children" | "whileHover" | "whileTap" | "transition">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -6 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      transition={springs.soft}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({
  value,
  format = (next) => Math.round(next).toLocaleString(),
  duration = 1.1,
  className
}: {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => value);
  const previous = useRef(value);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: premiumEase,
      onUpdate: (latest) => setDisplay(latest)
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, duration, reduce]);

  return <span className={className}>{format(display)}</span>;
}

export function SpotlightCard({
  children,
  className,
  glare = true,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  glare?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">) {
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const reduce = useReducedMotion();
  const background = useTransform(
    [x, y],
    ([latestX, latestY]) =>
      `radial-gradient(420px circle at ${latestX}% ${latestY}%, rgba(200,164,93,0.16), transparent 60%)`
  );

  return (
    <motion.div
      onPointerMove={(event) => {
        if (reduce) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        x.set(((event.clientX - bounds.left) / bounds.width) * 100);
        y.set(((event.clientY - bounds.top) / bounds.height) * 100);
      }}
      className={cn("group/spotlight relative", className)}
      {...props}
    >
      {glare ? (
        <motion.span
          aria-hidden
          style={{ background }}
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        />
      ) : null}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  const scaleX = useTransform(width, (value) => value);
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[95] h-[2px] origin-left bg-gradient-to-r from-gold-500 via-gold-300 to-emerald-400 rtl:origin-right"
    />
  );
}

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.getAttribute("target") === "_blank" || anchor.hasAttribute("download")) return;
      const next = href.split("?")[0].split("#")[0];
      if (next === pathname) return;
      setVisible(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 700);
    return () => window.clearTimeout(timer);
  }, [pathname, visible]);

  if (reduce) return null;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          aria-hidden
          className="fixed inset-x-0 top-0 z-[99] h-[2px] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-gold-600 via-gold-300 to-emerald-400"
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.65, ease: premiumEase }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function MotionLink({
  href,
  children,
  className,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "children" | "className">) {
  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }} transition={springs.soft}>
      <Link href={href} className={className} {...props}>
        {children}
      </Link>
    </motion.div>
  );
}

export function FloatingOrbs({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <motion.span
        className="absolute -start-20 top-10 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl"
        animate={{ y: [0, -22, 0], x: [0, 12, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute -end-16 bottom-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl"
        animate={{ y: [0, 26, 0], x: [0, -14, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute start-1/2 top-1/3 h-40 w-40 rounded-full bg-gold-300/5 blur-2xl"
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.08, 0.95] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function FloatingEmblem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -10, 0], rotate: [0, 0.7, 0, -0.7, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export function Expandable({
  open,
  children,
  className
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: premiumEase }}
          className={cn("overflow-hidden", className)}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
