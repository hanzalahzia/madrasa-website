function asId(value: unknown): string {
  if (!value) return "";
  return String(value);
}

export function availabilityFor(stock: number, lowStockThreshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= lowStockThreshold) return "low_stock";
  return "in_stock";
}

export function shapeBook(book: any, options: { includeInternal?: boolean } = {}) {
  const category = book.category && typeof book.category === "object" && book.category.name
    ? {
        id: asId(book.category._id),
        name: book.category.name,
        slug: book.category.slug
      }
    : { id: asId(book.category), name: null, slug: "" };

  const shaped = {
    id: asId(book._id),
    slug: book.slug,
    title: book.title,
    author: book.author,
    translator: book.translator,
    description: book.description,
    language: book.language,
    price: book.price,
    salePrice: book.salePrice ?? null,
    effectivePrice: book.salePrice ?? book.price,
    category,
    sku: book.sku,
    isbn: book.isbn,
    publisher: book.publisher,
    publicationYear: book.publicationYear,
    pages: book.pages,
    coverImage: book.coverImage,
    stock: book.stock,
    lowStockThreshold: book.lowStockThreshold,
    availability: availabilityFor(book.stock, book.lowStockThreshold),
    published: book.published,
    featured: book.featured,
    archived: book.archived ?? false,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt
  };

  if (!options.includeInternal) return shaped;

  return {
    ...shaped,
    createdBy: asId(book.createdBy)
  };
}

export function shapeOrder(order: any, options: { includeInternal?: boolean } = {}) {
  const base = {
    id: asId(order._id),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    address: order.address,
    city: order.city,
    notes: order.notes,
    items: (order.items || []).map((item: any) => ({
      bookId: asId(item.book),
      title: item.title,
      sku: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.unitPrice * item.quantity
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    fulfilmentStatus: order.fulfilmentStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };

  if (!options.includeInternal) return base;

  return {
    ...base,
    user: asId(order.user),
    stockReleased: order.stockReleased,
    statusHistory: order.statusHistory || [],
    demo: order.demo
  };
}

export function shapeWhatsAppOrder(request: any) {
  return {
    id: asId(request._id),
    requestNumber: request.requestNumber,
    customerName: request.customerName,
    phone: request.phone,
    email: request.email,
    address: request.address,
    city: request.city,
    notes: request.notes,
    items: (request.items || []).map((item: any) => ({
      bookId: asId(item.book),
      title: item.title,
      sku: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.unitPrice * item.quantity
    })),
    subtotal: request.subtotal,
    shipping: request.shipping,
    total: request.total,
    status: request.status,
    statusHistory: request.statusHistory || [],
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  };
}

export function shapePublicUser(user: any) {
  return {
    id: asId(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt
  };
}
