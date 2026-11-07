"use client";

import { useMemo, useState } from "react";
import { Archive, Boxes, ImagePlus, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, queryString, uploadImage } from "@/lib/api";
import { useApi, useDebounced } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatMoney } from "@/lib/format";
import type { Book, BookCategory, BooksResponse } from "@/lib/types";
import type { Localized } from "@/lib/i18n";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, LocalizedField, Select, Textarea, CheckRow } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { DataTable, Pagination, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { ResourceManager, type AdminField } from "@/components/admin/resource-manager";

interface BookForm {
  slug: string;
  title: Localized;
  author: string;
  translator: string;
  description: Localized;
  category: string;
  language: "en" | "ur" | "ar";
  price: string;
  salePrice: string;
  sku: string;
  isbn: string;
  publisher: string;
  publicationYear: string;
  pages: string;
  coverImage: string;
  stock: string;
  lowStockThreshold: string;
  published: boolean;
  featured: boolean;
  archived: boolean;
}

const blankBook: BookForm = {
  slug: "",
  title: { en: "", ur: "", ar: "" },
  author: "",
  translator: "",
  description: { en: "", ur: "", ar: "" },
  category: "",
  language: "en",
  price: "0",
  salePrice: "",
  sku: "",
  isbn: "",
  publisher: "",
  publicationYear: "",
  pages: "",
  coverImage: "",
  stock: "0",
  lowStockThreshold: "5",
  published: false,
  featured: false,
  archived: false
};

function categoryId(category: BookCategory): string {
  return String(category._id || category.id || "");
}

function availabilityTone(availability: Book["availability"]): "success" | "warning" | "danger" {
  if (availability === "in_stock") return "success";
  if (availability === "low_stock") return "warning";
  return "danger";
}

export default function AdminBooksPage() {
  const { locale, localized } = useLanguage();
  const [tab, setTab] = useState("books");
  const [search, setSearch] = useState("");
  const [published, setPublished] = useState("");
  const [archived, setArchived] = useState("false");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  const [bookOpen, setBookOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState<BookForm>(blankBook);
  const [saving, setSaving] = useState(false);
  const [stockFor, setStockFor] = useState<Book | null>(null);
  const [stockForm, setStockForm] = useState({ delta: "", reason: "" });
  const [stockSaving, setStockSaving] = useState(false);

  const booksPath = `/admin/books${queryString({
    search: debounced,
    published,
    archived,
    low_stock: lowStock,
    page,
    limit: 20
  })}`;
  const books = useApi<BooksResponse>(booksPath);
  const categories = useApi<{ items: BookCategory[] }>("/admin/book-categories?limit=200");

  const rows = useMemo(() => books.data?.items || [], [books.data]);
  const categoryOptions = categories.data?.items || [];

  const openCreate = () => {
    setEditing(null);
    setBookForm(blankBook);
    setBookOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditing(book);
    setBookForm({
      slug: book.slug,
      title: book.title,
      author: book.author,
      translator: book.translator || "",
      description: book.description,
      category: book.category?.id || "",
      language: book.language,
      price: String(book.price),
      salePrice: book.salePrice === null ? "" : String(book.salePrice),
      sku: book.sku,
      isbn: book.isbn || "",
      publisher: book.publisher || "",
      publicationYear: book.publicationYear || "",
      pages: book.pages === null || book.pages === undefined ? "" : String(book.pages),
      coverImage: book.coverImage || "",
      stock: String(book.stock),
      lowStockThreshold: String(book.lowStockThreshold),
      published: book.published,
      featured: book.featured,
      archived: book.archived
    });
    setBookOpen(true);
  };

  const update = <K extends keyof BookForm>(key: K, value: BookForm[K]) =>
    setBookForm((current) => ({ ...current, [key]: value }));

  const submitBook = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        slug: bookForm.slug,
        title: bookForm.title,
        author: bookForm.author,
        translator: bookForm.translator,
        description: bookForm.description,
        category: bookForm.category,
        language: bookForm.language,
        price: Number(bookForm.price) || 0,
        salePrice: bookForm.salePrice === "" ? null : Number(bookForm.salePrice),
        sku: bookForm.sku,
        isbn: bookForm.isbn,
        publisher: bookForm.publisher,
        publicationYear: bookForm.publicationYear,
        pages: bookForm.pages === "" ? null : Number(bookForm.pages),
        coverImage: bookForm.coverImage,
        stock: Number(bookForm.stock) || 0,
        lowStockThreshold: Number(bookForm.lowStockThreshold) || 0,
        published: bookForm.published,
        featured: bookForm.featured,
        archived: bookForm.archived
      };
      if (editing) {
        await api(`/admin/books/${editing.id}`, { method: "PUT", body: payload });
        toast.success("Book updated");
      } else {
        await api("/admin/books", { method: "POST", body: payload });
        toast.success("Book created");
      }
      setBookOpen(false);
      books.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const submitStock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stockFor) return;
    setStockSaving(true);
    try {
      await api(`/admin/books/${stockFor.id}/stock`, {
        method: "PATCH",
        body: { delta: Number(stockForm.delta), reason: stockForm.reason }
      });
      toast.success("Stock adjusted");
      setStockFor(null);
      books.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setStockSaving(false);
    }
  };

  const archiveBook = async (book: Book) => {
    if (!window.confirm(`Archive "${localized(book.title)}"? Orders are preserved.`)) return;
    try {
      await api(`/admin/books/${book.id}`, { method: "DELETE" });
      toast.success("Book archived");
      books.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    }
  };

  const columns: Column<Book>[] = [
    {
      key: "title",
      label: "Book",
      render: (book) => (
        <div className="flex items-center gap-3">
          {book.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverImage} alt="" className="h-14 w-10 rounded-md border border-brand-950/10 object-cover" />
          ) : (
            <span className="flex h-14 w-10 items-center justify-center rounded-md border border-dashed border-brand-950/15 text-[9px] text-muted">
              No cover
            </span>
          )}
          <div>
            <p className="font-medium text-brand-950">{localized(book.title) || book.slug}</p>
            <p className="text-xs text-muted">
              {book.author} · {book.sku}
            </p>
          </div>
        </div>
      )
    },
    {
      key: "category",
      label: "Category",
      render: (book) => <span className="text-sm">{book.category?.name ? localized(book.category.name) : "—"}</span>
    },
    {
      key: "price",
      label: "Price",
      render: (book) => (
        <div>
          {book.salePrice !== null ? (
            <>
              <p className="font-semibold text-brand-950">{formatMoney(book.salePrice, locale)}</p>
              <p className="text-xs text-muted line-through">{formatMoney(book.price, locale)}</p>
            </>
          ) : (
            <p className="font-semibold text-brand-950">{formatMoney(book.price, locale)}</p>
          )}
        </div>
      )
    },
    {
      key: "stock",
      label: "Stock",
      render: (book) => (
        <div className="flex flex-col items-start gap-1">
          <Badge tone={availabilityTone(book.availability)}>{book.stock} in stock</Badge>
          <span className="text-[10px] text-muted">Low at {book.lowStockThreshold}</span>
        </div>
      )
    },
    {
      key: "visibility",
      label: "Visibility",
      render: (book) => (
        <div className="flex flex-wrap gap-1">
          {book.published ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>}
          {book.featured ? <Badge tone="gold">Featured</Badge> : null}
          {book.archived ? <Badge tone="danger">Archived</Badge> : null}
        </div>
      )
    },
    {
      key: "actions",
      label: "",
      className: "text-end whitespace-nowrap",
      headerClassName: "text-end",
      render: (book) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Adjust stock"
            onClick={() => {
              setStockFor(book);
              setStockForm({ delta: "", reason: "" });
            }}
          >
            <Boxes className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" title="Edit" onClick={() => openEdit(book)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Archive"
            onClick={() => void archiveBook(book)}
            disabled={book.archived}
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const categoryFields: AdminField[] = [
    { name: "name", label: "Category name", type: "localized", required: true },
    { name: "slug", label: "Slug", type: "text", required: true, placeholder: "quran-studies" },
    { name: "order", label: "Display order", type: "number" },
    { name: "published", label: "Published", type: "checkbox" }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">Bookstore</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Books</h1>
          <p className="mt-1 text-sm text-muted">Catalogue, pricing, visibility and stock control.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add book
        </Button>
      </div>

      <Tabs
        tabs={[
          { value: "books", label: "Catalogue" },
          { value: "categories", label: "Categories" }
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "categories" ? (
        <ResourceManager<BookCategory>
          endpoint="/admin/book-categories"
          title="Book categories"
          description="Organise the bookstore catalogue."
          createLabel="Add category"
          keyFor={categoryId}
          fields={categoryFields}
          columns={[
            {
              key: "name",
              label: "Category",
              render: (category) => <span className="font-medium">{localized(category.name)}</span>
            },
            { key: "slug", label: "Slug", render: (category) => <span className="font-mono text-xs">{category.slug}</span> },
            { key: "order", label: "Order", render: (category) => category.order ?? 0 },
            {
              key: "published",
              label: "Status",
              render: (category) => (category.published ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>)
            }
          ]}
        />
      ) : (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-56 flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search title, author, SKU or ISBN…"
                  className="ps-9"
                />
              </div>
              <Select
                value={published}
                onChange={(event) => {
                  setPublished(event.target.value);
                  setPage(1);
                }}
                className="w-40"
              >
                <option value="">All visibility</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </Select>
              <Select
                value={archived}
                onChange={(event) => {
                  setArchived(event.target.value);
                  setPage(1);
                }}
                className="w-40"
              >
                <option value="false">Active books</option>
                <option value="true">Archived</option>
                <option value="all">All books</option>
              </Select>
              <CheckRow label="Low stock only" className="h-11 items-center bg-white">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-900"
                  checked={lowStock}
                  onChange={(event) => {
                    setLowStock(event.target.checked);
                    setPage(1);
                  }}
                />
              </CheckRow>
            </div>
          </Card>

          {books.error ? (
            <ErrorState description={books.error} onRetry={books.reload} />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                keyFor={(book) => book.id}
                loading={books.loading}
                empty={
                  <EmptyState
                    title="No books found"
                    description="Adjust filters or add the first title."
                    action={
                      <Button size="sm" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> Add book
                      </Button>
                    }
                  />
                }
              />
              {books.data?.pagination ? (
                <Pagination
                  page={books.data.pagination.page}
                  pages={books.data.pagination.pages}
                  onChange={setPage}
                  label={(value) => `Page ${value} of ${books.data?.pagination?.pages || 1}`}
                />
              ) : null}
            </>
          )}
        </div>
      )}

      <Modal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        title={editing ? "Edit book" : "Add book"}
        description={editing ? "Stock changes must be made with the stock adjustment action." : "Add a new title to the bookstore."}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setBookOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="book-form" loading={saving}>
              Save book
            </Button>
          </div>
        }
      >
        <form id="book-form" onSubmit={submitBook} className="space-y-5">
          <LocalizedField label="Title" value={bookForm.title} onChange={(value) => update("title", value)} required />
          <LocalizedField
            label="Description"
            value={bookForm.description}
            onChange={(value) => update("description", value)}
            multiline
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Slug" required>
              <Input value={bookForm.slug} onChange={(event) => update("slug", event.target.value)} required />
            </FormField>
            <FormField label="Author" required>
              <Input value={bookForm.author} onChange={(event) => update("author", event.target.value)} required />
            </FormField>
            <FormField label="Translator">
              <Input value={bookForm.translator} onChange={(event) => update("translator", event.target.value)} />
            </FormField>
            <FormField label="Category" required>
              <Select value={bookForm.category} onChange={(event) => update("category", event.target.value)} required>
                <option value="">Select category…</option>
                {categoryOptions.map((category) => (
                  <option key={categoryId(category)} value={categoryId(category)}>
                    {localized(category.name)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Language" required>
              <Select
                value={bookForm.language}
                onChange={(event) => update("language", event.target.value as BookForm["language"])}
              >
                <option value="en">English</option>
                <option value="ur">اردو</option>
                <option value="ar">العربية</option>
              </Select>
            </FormField>
            <FormField label="SKU" required>
              <Input value={bookForm.sku} onChange={(event) => update("sku", event.target.value)} required />
            </FormField>
            <FormField label="Price" required>
              <Input type="number" min={0} value={bookForm.price} onChange={(event) => update("price", event.target.value)} required />
            </FormField>
            <FormField label="Sale price" hint="Leave blank for no sale.">
              <Input type="number" min={0} value={bookForm.salePrice} onChange={(event) => update("salePrice", event.target.value)} />
            </FormField>
            <FormField label="ISBN">
              <Input value={bookForm.isbn} onChange={(event) => update("isbn", event.target.value)} />
            </FormField>
            <FormField label="Publisher">
              <Input value={bookForm.publisher} onChange={(event) => update("publisher", event.target.value)} />
            </FormField>
            <FormField label="Publication year">
              <Input value={bookForm.publicationYear} onChange={(event) => update("publicationYear", event.target.value)} />
            </FormField>
            <FormField label="Pages">
              <Input type="number" min={1} value={bookForm.pages} onChange={(event) => update("pages", event.target.value)} />
            </FormField>
            <FormField label="Stock" hint={editing ? "Use Adjust stock after saving." : undefined} required>
              <Input
                type="number"
                min={0}
                value={bookForm.stock}
                onChange={(event) => update("stock", event.target.value)}
                disabled={Boolean(editing)}
                required
              />
            </FormField>
            <FormField label="Low stock threshold">
              <Input
                type="number"
                min={0}
                value={bookForm.lowStockThreshold}
                onChange={(event) => update("lowStockThreshold", event.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Cover image">
            <div className="flex gap-2">
              <Input value={bookForm.coverImage} onChange={(event) => update("coverImage", event.target.value)} />
              <label className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-brand-950/15 bg-white px-3 text-xs font-semibold text-brand-900">
                <ImagePlus className="h-4 w-4" /> Upload
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void uploadImage(file)
                      .then((uploaded) => {
                        update("coverImage", uploaded.url);
                        toast.success("Cover uploaded");
                      })
                      .catch((caught) => toast.error(errorMessage(caught)));
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            {bookForm.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bookForm.coverImage} alt="" className="mt-2 h-28 w-20 rounded-lg border object-cover" />
            ) : null}
          </FormField>

          <div className="grid gap-2 sm:grid-cols-3">
            <CheckRow label="Published">
              <input type="checkbox" className="h-4 w-4 accent-brand-900" checked={bookForm.published} onChange={(event) => update("published", event.target.checked)} />
            </CheckRow>
            <CheckRow label="Featured">
              <input type="checkbox" className="h-4 w-4 accent-brand-900" checked={bookForm.featured} onChange={(event) => update("featured", event.target.checked)} />
            </CheckRow>
            <CheckRow label="Archived">
              <input type="checkbox" className="h-4 w-4 accent-brand-900" checked={bookForm.archived} onChange={(event) => update("archived", event.target.checked)} />
            </CheckRow>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(stockFor)}
        onClose={() => setStockFor(null)}
        title="Adjust stock"
        description={stockFor ? `${localized(stockFor.title)} · current stock ${stockFor.stock}` : undefined}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setStockFor(null)}>
              Cancel
            </Button>
            <Button type="submit" form="stock-form" loading={stockSaving}>
              Save adjustment
            </Button>
          </div>
        }
      >
        <form id="stock-form" onSubmit={submitStock} className="space-y-4">
          <FormField label="Adjustment" required hint="Use a positive number to add stock, negative to remove.">
            <Input
              type="number"
              value={stockForm.delta}
              onChange={(event) => setStockForm({ ...stockForm, delta: event.target.value })}
              placeholder="e.g. 10 or -2"
              required
            />
          </FormField>
          <FormField label="Reason" required>
            <Textarea
              rows={3}
              value={stockForm.reason}
              onChange={(event) => setStockForm({ ...stockForm, reason: event.target.value })}
              placeholder="New delivery, damaged copies, stock count correction…"
              required
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
