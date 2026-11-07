"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { springs } from "@/components/motion/primitives";

export function Tabs({
  tabs,
  value,
  onChange,
  className
}: {
  tabs: Array<{ value: string; label: React.ReactNode; count?: number }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  return (
    <div className={cn("flex gap-1 overflow-x-auto rounded-full border border-brand-950/10 bg-white/70 p-1 shadow-sm backdrop-blur", className)}>
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active ? "text-ivory" : "text-brand-950/70 hover:bg-brand-950/5 hover:text-brand-950"
            )}
          >
            {active ? (
              <motion.span
                layoutId={`tab-pill-${id}`}
                className="absolute inset-0 rounded-full bg-brand-950 shadow-sm"
                transition={reduce ? { duration: 0 } : springs.snappy}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
            {tab.count !== undefined ? (
              <span
                className={cn(
                  "relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-white/15 text-ivory" : "bg-brand-950/10 text-brand-950"
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
