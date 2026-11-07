"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useApi, useDebounced } from "@/lib/use-api";
import { queryString } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { formatNumber } from "@/lib/format";
import type { BookCategory, BooksResponse } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { BookCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/table";
import { FormField, Input, Select } from "@/components/ui/field";

export default function BooksPage() {
  const { t, locale } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounced(search);
  const { data: categories } = useApi<BookCategory[]>("/public/categories");

  const path = useMemo(
    () =>
      `/public/books${queryString({
        search: debouncedSearch,
        category,
        language,
        availability,
        sort,
        page,
        limit: 12
      })}`,
    [debouncedSearch, category, language, availability, sort, page]
  );

  const { data, loading, error, reload } = useApi<BooksResponse>(path);
  const filterCount = [category, language, availability].filter(Boolean).length;

  function reset() {
    setSearch("");
    setCategory("");
    setLanguage("");
    setAvailability("");
    setSort("newest");
    setPage(1);
  }

  return (
    <>
      <PageHero
        eyebrow={t("home.booksEyebrow")}
        title={t("books.title")}
        description={t("books.subtitle")}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("nav.books") }]}
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <aside>
            <div className="sticky top-28 space-y-5 rounded-2xl border border-brand-950/10 bg-white/85 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-brand-950">
                  <SlidersHorizontal className="h-4 w-4" /> {t("books.filters")}
                  {filterCount ? <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] text-gold-800">{filterCount}</span> : null}
                </h2>
                <button type="button" onClick={reset} className="text-[11px] font-medium text-muted underline underline-offset-4 hover:text-brand-900">
                  {t("action.clear")}
                </button>
              </div>
              <FormField label={t("books.category")} htmlFor="filter-category">
                <Select
                  id="filter-category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">{t("books.allCategories")}</option>
                  {(categories || []).map((entry) => (
                    <option key={entry.slug} value={entry.slug}>
                      {entry.name.en || entry.name.ur || entry.name.ar}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label={t("books.language")} htmlFor="filter-language">
                <Select
                  id="filter-language"
                  value={language}
                  onChange={(event) => {
                    setLanguage(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">{t("books.allLanguages")}</option>
                  <option value="en">{t("books.english")}</option>
                  <option value="ur">{t("books.urdu")}</option>
                  <option value="ar">{t("books.arabic")}</option>
                </Select>
              </FormField>
              <FormField label={t("books.availability")} htmlFor="filter-availability">
                <Select
                  id="filter-availability"
                  value={availability}
                  onChange={(event) => {
                    setAvailability(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">{t("books.anyAvailability")}</option>
                  <option value="in_stock">{t("books.inStock")}</option>
                  <option value="low_stock">{t("books.lowStock")}</option>
                  <option value="out_of_stock">{t("books.outOfStock")}</option>
                </Select>
              </FormField>
              <p className="rounded-xl bg-gold-50 p-3 text-[11px] leading-relaxed text-gold-900">{t("books.currencyNote")}</p>
            </div>
          </aside>
          <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder={t("books.searchPlaceholder")}
                  className="ps-9"
                  aria-label={t("action.search")}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                    aria-label={t("action.clear")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">
                  {formatNumber(data?.pagination.total ?? 0, locale)} {t("books.results")}
                </span>
                <Select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                  aria-label={t("books.sort")}
                  className="w-44"
                >
                  <option value="newest">{t("books.newest")}</option>
                  <option value="price_asc">{t("books.priceAsc")}</option>
                  <option value="price_desc">{t("books.priceDesc")}</option>
                  <option value="title">{t("books.titleAsc")}</option>
                </Select>
              </div>
            </div>
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-96" />
                ))}
              </div>
            ) : error ? (
              <ErrorState description={error} onRetry={reload} />
            ) : data?.items.length ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
                <Pagination
                  page={data.pagination.page}
                  pages={data.pagination.pages}
                  onChange={setPage}
                  label={(current) => `${current} / ${data.pagination.pages}`}
                />
              </>
            ) : (
              <EmptyState
                title={t("books.noResults")}
                description={t("books.noResultsHint")}
                action={
                  <Button variant="outline" size="sm" onClick={reset}>
                    {t("action.clear")}
                  </Button>
                }
              />
            )}
            <p className="mt-8 text-center text-[11px] text-muted">{t("books.storeNote")}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
