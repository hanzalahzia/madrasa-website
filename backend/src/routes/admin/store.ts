import { Router } from "express";
import {
  Book,
  BookCategory,
  InventoryMovement,
  Order,
  WhatsAppOrder
} from "../../models/index.js";
import { notifyUser } from "../../services/notify.js";
import { writeAudit } from "../../utils/audit.js";
import {
  ApiError,
  asyncHandler,
  parsePagination,
  paginationMeta,
  validateBody
} from "../../utils/http.js";
import {
  bookSchema,
  orderUpdateSchema,
  stockSchema,
  whatsappOrderUpdateSchema
} from "../../utils/schemas.js";
import { shapeBook, shapeOrder, shapeWhatsAppOrder } from "../../utils/shapes.js";

export const adminStoreRouter = Router();

adminStoreRouter.get(
  "/books",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (req.query.category) filter.category = String(req.query.category);
    if (req.query.language) filter.language = String(req.query.language);
    if (req.query.published === "true") filter.published = true;
    if (req.query.published === "false") filter.published = false;
    if (req.query.archived === "true") filter.archived = true;
    else if (req.query.archived !== "all") filter.archived = false;
    if (req.query.low_stock === "true") {
      filter.$expr = { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] }] };
    }
    if (req.query.out_of_stock === "true") filter.stock = { $lte: 0 };
    const search = String(req.query.search || req.query.q || "").trim();
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { "title.en": pattern },
        { "title.ur": pattern },
        { "title.ar": pattern },
        { author: pattern },
        { sku: pattern },
        { isbn: pattern }
      ];
    }
    const [items, total] = await Promise.all([
      Book.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Book.countDocuments(filter)
    ]);
    res.json({
      items: items.map((book) => shapeBook(book, { includeInternal: true })),
      pagination: paginationMeta(total, page, limit)
    });
  })
);

adminStoreRouter.get(
  "/books/:id",
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id).populate("category", "name slug").lean();
    if (!book) throw new ApiError(404, "Book not found.");
    res.json(shapeBook(book, { includeInternal: true }));
  })
);

adminStoreRouter.post(
  "/books",
  validateBody(bookSchema),
  asyncHandler(async (req, res) => {
    if (req.body.salePrice !== null && req.body.salePrice !== undefined && req.body.salePrice > req.body.price) {
      throw new ApiError(400, "Sale price cannot exceed the regular price.");
    }
    const category = await BookCategory.exists({ _id: req.body.category });
    if (!category) throw new ApiError(400, "Select a valid category.");
    const book = await Book.create({ ...req.body, createdBy: req.user!.id });
    if (book.stock > 0) {
      await InventoryMovement.create({
        book: book._id,
        delta: book.stock,
        reason: "initial_stock",
        actor: req.user!.id,
        stockAfter: book.stock
      });
    }
    await writeAudit(req, "book.create", "Book", String(book._id));
    res.status(201).json(shapeBook(book.toObject(), { includeInternal: true }));
  })
);

adminStoreRouter.put(
  "/books/:id",
  validateBody(bookSchema),
  asyncHandler(async (req, res) => {
    if (req.body.salePrice !== null && req.body.salePrice !== undefined && req.body.salePrice > req.body.price) {
      throw new ApiError(400, "Sale price cannot exceed the regular price.");
    }
    const before = await Book.findById(req.params.id).lean();
    if (!before) throw new ApiError(404, "Book not found.");
    if (before.stock !== req.body.stock) {
      throw new ApiError(400, "Use the stock adjustment action to change inventory and keep the audit trail.");
    }
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate("category", "name slug")
      .lean();
    if (!book) throw new ApiError(404, "Book not found.");
    await writeAudit(req, "book.update", "Book", String(book._id));
    res.json(shapeBook(book, { includeInternal: true }));
  })
);

adminStoreRouter.delete(
  "/books/:id",
  asyncHandler(async (req, res) => {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: { archived: true, published: false } },
      { new: true }
    );
    if (!book) throw new ApiError(404, "Book not found.");
    await writeAudit(req, "book.archive", "Book", String(book._id));
    res.json({ message: "Book archived. Historical orders are unaffected.", book });
  })
);

adminStoreRouter.patch(
  "/books/:id/stock",
  validateBody(stockSchema),
  asyncHandler(async (req, res) => {
    const { delta, reason } = req.body;
    const book = await Book.findOneAndUpdate(
      {
        _id: req.params.id,
        ...(delta < 0 ? { stock: { $gte: Math.abs(delta) } } : {})
      },
      { $inc: { stock: delta } },
      { new: true }
    );
    if (!book) {
      const exists = await Book.exists({ _id: req.params.id });
      if (!exists) throw new ApiError(404, "Book not found.");
      throw new ApiError(409, "The adjustment would make stock negative.");
    }
    await InventoryMovement.create({
      book: book._id,
      delta,
      reason,
      actor: req.user!.id,
      stockAfter: book.stock
    });
    await writeAudit(req, "book.stock_adjust", "Book", String(book._id), { delta, reason });
    res.json(shapeBook(book.toObject(), { includeInternal: true }));
  })
);

adminStoreRouter.get(
  "/inventory-movements",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.bookId) filter.book = String(req.query.bookId);
    const movements = await InventoryMovement.find(filter)
      .populate("book", "title sku")
      .populate("actor", "name email")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    res.json({ items: movements });
  })
);

adminStoreRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (req.query.fulfilmentStatus) filter.fulfilmentStatus = String(req.query.fulfilmentStatus);
    if (req.query.paymentStatus) filter.paymentStatus = String(req.query.paymentStatus);
    const search = String(req.query.search || req.query.q || "").trim();
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { orderNumber: pattern },
        { customerName: pattern },
        { phone: pattern },
        { email: pattern }
      ];
    }
    const [items, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter)
    ]);
    res.json({
      items: items.map((order) => shapeOrder(order, { includeInternal: true })),
      pagination: paginationMeta(total, page, limit)
    });
  })
);

adminStoreRouter.get(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate("user", "name email").lean();
    if (!order) throw new ApiError(404, "Order not found.");
    res.json(shapeOrder(order, { includeInternal: true }));
  })
);

adminStoreRouter.patch(
  "/orders/:id",
  validateBody(orderUpdateSchema),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, "Order not found.");
    if (!req.body.fulfilmentStatus && !req.body.paymentStatus) {
      throw new ApiError(400, "Select a status to update.");
    }
    const nextFulfilment = req.body.fulfilmentStatus;
    const currentFulfilment = order.fulfilmentStatus;
    if (
      ["cancelled", "returned"].includes(currentFulfilment) &&
      nextFulfilment &&
      nextFulfilment !== currentFulfilment
    ) {
      throw new ApiError(409, "Cancelled or returned orders cannot be reopened.");
    }

    if (nextFulfilment) order.fulfilmentStatus = nextFulfilment;
    if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;

    if (
      nextFulfilment &&
      ["cancelled", "returned"].includes(nextFulfilment) &&
      currentFulfilment !== nextFulfilment &&
      !order.stockReleased
    ) {
      for (const item of order.items) {
        const book = await Book.findByIdAndUpdate(
          item.book,
          { $inc: { stock: item.quantity } },
          { new: true }
        );
        if (book) {
          await InventoryMovement.create({
            book: item.book,
            delta: item.quantity,
            reason: nextFulfilment === "cancelled" ? "order_cancelled" : "order_returned",
            order: order._id,
            actor: req.user!.id,
            stockAfter: book.stock
          });
        }
      }
      order.stockReleased = true;
    }

    order.statusHistory.push({
      fulfilmentStatus: order.fulfilmentStatus as any,
      paymentStatus: order.paymentStatus as any,
      note: req.body.note || "Status updated by administrator.",
      by: req.user!.id as any,
      at: new Date()
    });
    await order.save();

    if (order.user) {
      await notifyUser(
        String(order.user),
        "Order status updated",
        `Order ${order.orderNumber} is now ${order.fulfilmentStatus.replace(/_/g, " ")}.`,
        `/orders/${order.orderNumber}`
      );
    }

    await writeAudit(req, "order.status", "Order", String(order._id), {
      fulfilmentStatus: order.fulfilmentStatus,
      paymentStatus: order.paymentStatus
    });
    res.json(shapeOrder(order.toObject(), { includeInternal: true }));
  })
);

adminStoreRouter.get(
  "/whatsapp-orders",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = String(req.query.status);
    const search = String(req.query.search || req.query.q || "").trim();
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { requestNumber: pattern },
        { customerName: pattern },
        { phone: pattern },
        { email: pattern }
      ];
    }
    const [items, total] = await Promise.all([
      WhatsAppOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WhatsAppOrder.countDocuments(filter)
    ]);
    res.json({
      items: items.map((request) => shapeWhatsAppOrder(request)),
      pagination: paginationMeta(total, page, limit)
    });
  })
);

adminStoreRouter.get(
  "/whatsapp-orders/:id",
  asyncHandler(async (req, res) => {
    const request = await WhatsAppOrder.findById(req.params.id).lean();
    if (!request) throw new ApiError(404, "WhatsApp order request not found.");
    res.json(shapeWhatsAppOrder(request));
  })
);

adminStoreRouter.patch(
  "/whatsapp-orders/:id",
  validateBody(whatsappOrderUpdateSchema),
  asyncHandler(async (req, res) => {
    const request = await WhatsAppOrder.findById(req.params.id);
    if (!request) throw new ApiError(404, "WhatsApp order request not found.");

    request.status = req.body.status;
    request.statusHistory.push({
      status: req.body.status,
      note: req.body.note || "Status updated by administrator.",
      by: req.user!.id,
      at: new Date()
    });
    await request.save();

    await writeAudit(req, "whatsapp_order.status", "WhatsAppOrder", String(request._id), {
      status: request.status
    });
    res.json(shapeWhatsAppOrder(request.toObject()));
  })
);
