"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BookOpen, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { useCart } from "@/lib/cart-context";
import { availabilityLabel, formatMoney } from "@/lib/format";
import type { Book, BooksResponse } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { BookCard, MetaItem, Prose } from "@/components/site/cards";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/ui/feedback";
import { FormField, Select } from "@/components/ui/field";

export default function BookDetailPage() {
  const params = useParams<{ slug: string }>();
  const { t, localized, locale } = useLanguage();
  const { add } = useCart();
  const { data: book, loading, error, reload } = useApi<Book>(`/public/books/${params.slug}`);
  const [quantity, setQuantity] = useState(1);
  const categorySlug = book?.category?.slug || "";
  const relatedPath = categorySlug ? `/public/books?category=${categorySlug}&limit=4` : null;
  const { data: related } = useApi<BooksResponse>(relatedPath);

  if (loading) {
    return (
      <Section>
        <LoadingPanel label={t("state.loading")} />
      </Section>
    );
  }

  if (error || !book) {
    return (
      <Section>
        <ErrorState title={t("state.notFound")} description={error || t("state.notFoundHint")} onRetry={reload} />
        <div className="mt-6 text-center">
          <Link href="/books" className="text-sm font-semibold text-brand-800 underline underline-offset-4">
            {t("books.backToStore")}
          </Link>
        </div>
      </Section>
    );
  }

  const title = localized(book.title);
  const soldOut = book.availability === "out_of_stock";
  const tone = soldOut ? "danger" : book.availability === "low_stock" ? "warning" : "success";
  const max = Math.max(1, Math.min(20, book.stock));
  const relatedItems = (related?.items || []).filter((item) => item.id !== book.id).slice(0, 4);

  function addToCart() {
    if (!book || soldOut) return;
    add(book, quantity);
    toast.success(t("books.addedToCart"));
  }

  return (
    <>
      <PageHero
        eyebrow={localized(book.category?.name) || t("nav.books")}
        title={title}
        description={`${t("books.author")}: ${book.author}`}
        breadcrumbs={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.books"), href: "/books" },
          { label: title }
        ]}
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-brand-950/10 bg-white shadow-card">
              <div className="relative aspect-[3/4]">
                {book.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverImage} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="pattern-islamic flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand-900 via-brand-950 to-brand-800 p-8 text-center">
                    <span className="font-display text-5xl text-gold-300/80">﷽</span>
                    <span className="font-display text-2xl leading-snug text-ivory">{title}</span>
                    <span className="text-xs text-gold-200/70">{book.author}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <MetaItem label={t("books.sku")} value={book.sku} />
              <MetaItem label={t("books.pages")} value={book.pages ? String(book.pages) : "—"} />
            </div>
          </div>
          <div>
            <div className="rounded-2xl border border-brand-950/10 bg-white/85 p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={tone}>{availabilityLabel(book.availability, locale)}</Badge>
                {book.stock > 0 ? (
                  <Badge tone="neutral">
                    {book.stock} {t("books.inStock")}
                  </Badge>
                ) : null}
                <Badge tone="gold">{book.language.toUpperCase()}</Badge>
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold text-brand-950">{title}</h2>
              <p className="mt-1 text-sm text-muted">
                {t("books.author")}: <span className="font-medium text-ink">{book.author}</span>
                {book.translator ? ` · ${t("books.translator")}: ${book.translator}` : ""}
              </p>
              <div className="mt-5 flex items-end gap-3">
                <p className="font-display text-3xl font-semibold text-brand-950">{formatMoney(book.effectivePrice, locale)}</p>
                {book.salePrice ? (
                  <p className="pb-1 text-sm text-muted line-through">{formatMoney(book.price, locale)}</p>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-muted">{t("books.currencyNote")}</p>

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <FormField label={t("form.quantity")} htmlFor="book-quantity" className="w-24">
                  <Select
                    id="book-quantity"
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    disabled={soldOut}
                  >
                    {Array.from({ length: max }).map((_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index + 1}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <Button onClick={addToCart} disabled={soldOut} className="h-11">
                  <ShoppingBag className="h-4 w-4" /> {soldOut ? t("books.outOfStock") : t("books.addToCart")}
                </Button>
                <Link
                  href="/cart"
                  className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-950/5"
                >
                  {t("cart.viewCart")}
                </Link>
              </div>
              {book.stock > 0 && book.stock < 20 ? (
                <p className="mt-3 text-xs text-amber-800">{t("cart.stockLimit").replace("{count}", String(book.stock))}</p>
              ) : null}
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <MetaItem label={t("books.publisher")} value={book.publisher || "—"} />
                <MetaItem label={t("books.publication")} value={book.publicationYear || "—"} />
                <MetaItem label={t("books.isbn")} value={book.isbn || "—"} />
                <MetaItem label={t("books.category")} value={localized(book.category?.name) || "—"} />
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-brand-950/10 bg-white/85 p-6 shadow-card sm:p-8">
              <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-brand-950">
                <BookOpen className="h-4 w-4" /> {t("books.description")}
              </h3>
              <div className="mt-3">
                <Prose value={book.description} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="mb-5 font-display text-2xl font-semibold text-brand-950">{t("books.related")}</h2>
          {relatedItems.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedItems.map((item) => (
                <BookCard key={item.id} book={item} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("books.noResults")} description={t("books.noResultsHint")} />
          )}
        </div>
      </Section>
    </>
  );
}
