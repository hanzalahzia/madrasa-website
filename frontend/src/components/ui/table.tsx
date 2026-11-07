"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface Column<T> {
  key: string;
  label: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyFor,
  empty,
  loading,
  onRowClick
}: {
  columns: Column<T>[];
  rows: T[];
  keyFor: (row: T) => string;
  empty?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (row: T) => void;
}) {
  const reduce = useReducedMotion();

  if (loading) {
    return (
      <div className="space-y-2 rounded-2xl border border-brand-950/10 bg-white/70 p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-500" />
          Loading records
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-11 animate-shimmer rounded-lg bg-brand-950/[0.06] bg-[length:700px_100%]"
            style={{
              animationDelay: `${index * 90}ms`,
              backgroundImage:
                "linear-gradient(90deg, rgba(6,78,59,0.04) 0%, rgba(6,78,59,0.09) 50%, rgba(6,78,59,0.04) 100%)"
            }}
          />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <div className="rounded-2xl border border-dashed border-brand-950/15 bg-white/40">{empty}</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-950/10 bg-white/90 shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-brand-950/10 bg-brand-950/[0.03]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-muted",
                    column.headerClassName
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <motion.tr
                key={keyFor(row)}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(index * 0.025, 0.2) }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "group border-b border-brand-950/5 transition-colors duration-150 last:border-0 hover:bg-gold-50/50",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3 align-middle text-ink", column.className)}>
                    {column.render
                      ? column.render(row)
                      : String((row as Record<string, unknown>)[column.key] ?? "—")}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onChange,
  label
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  label: (page: number) => string;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
      </Button>
      <span className="rounded-full border border-brand-950/10 bg-white/70 px-3 py-1 text-xs font-medium text-muted">
        {label(page)}
      </span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
      </Button>
    </div>
  );
}
