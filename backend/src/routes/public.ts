import fs from "node:fs";
import crypto from "node:crypto";
import { Router } from "express";
import {
  AcademicSession,
  Admission,
  Announcement,
  Book,
  BookCategory,
  ContactMessage,
  Event,
  Faq,
  GalleryItem,
  InventoryMovement,
  Order,
  PageContent,
  Program,
  Teacher,
  WhatsAppOrder
} from "../models/index.js";
import { env } from "../config/env.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { publicResponseCache } from "../middleware/publicCache.js";
import { formLimiter, checkoutLimiter } from "../middleware/rateLimit.js";
import {
  admissionUpload,
  verifyDocumentContent
} from "../middleware/uploads.js";
import { notifyAdmins } from "../services/notify.js";
import { getSettings } from "../services/settings.js";
import { ApiError, asyncHandler, escapeRegExp, parsePagination, paginationMeta, startOfDay } from "../utils/http.js";
import {
  admissionReference,
  orderNumber,
  randomToken,
  safeEqual,
  sha256,
  trackingPin,
  whatsappOrderNumber
} from "../utils/ids.js";
import {
  admissionSchema,
  admissionTrackSchema,
  contactSchema,
  orderSchema,
  whatsappOrderSchema
} from "../utils/schemas.js";
import { shapeBook, shapeOrder, shapeWhatsAppOrder } from "../utils/shapes.js";
import { whatsappLink } from "../utils/whatsapp.js";

export const publicRouter = Router();

publicRouter.use(publicResponseCache(20));

function publicSettings(settings: any) {
  return {
    siteName: settings.siteName,
    logoUrl: settings.logoUrl,
    brandSubtitle: settings.brandSubtitle,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    heroNote: settings.heroNote,
    heroImage: settings.heroImage,
    tagline: settings.tagline,
    aboutShort: settings.aboutShort,
    announcementBar: settings.announcementBar,
    contactPhone: settings.contactPhone,
    contactPhoneAlt: settings.contactPhoneAlt,
    contactEmail: settings.contactEmail,
    address: settings.address,
    officeHours: settings.officeHours,
    admissionEmail: settings.admissionEmail,
    admissionsOpen: settings.admissionsOpen,
    socials: settings.socials,
    shippingFee: settings.shippingFee,
    freeShippingAbove: settings.freeShippingAbove,
    codEnabled: settings.codEnabled,
    bankTransferEnabled: settings.bankTransferEnabled,
    bankDetails: settings.bankTransferEnabled ? settings.bankDetails : undefined,
    shippingPolicy: settings.shippingPolicy,
    paymentPolicy: settings.paymentPolicy,
    cancellationPolicy: settings.cancellationPolicy,
    returnPolicy: settings.returnPolicy,
    mapEmbedUrl: settings.mapEmbedUrl
  };
}

publicRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await getSettings();
    res.json(publicSettings(settings));
  })
);

publicRouter.get(
  "/home",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const [
      settings,
      statsSeed,
      programs,
      faculty,
      gallery,
      events,
      announcements,
      books,
      about
    ] = await Promise.all([
      getSettings(),
      Promise.all([
        Program.countDocuments({ published: true }),
        Teacher.countDocuments({ published: true }),
        Book.countDocuments({ published: true, archived: false }),
        Event.countDocuments({ published: true, startDate: { $gte: now } })
      ]),
      Program.find({ published: true })
        .select("slug title summary duration ageGroup image")
        .sort({ order: 1, title: 1 })
        .limit(3)
        .lean(),
      Teacher.find({ published: true })
        .select("name qualifications bio programs")
        .populate("programs", "title slug")
        .sort({ name: 1 })
        .limit(3)
        .lean(),
      GalleryItem.find({ published: true }).sort({ order: 1, createdAt: -1 }).limit(5).lean(),
      Event.find({ published: true, startDate: { $gte: now } }).sort({ startDate: 1 }).limit(3).lean(),
      Announcement.find({
        published: true,
        $or: [{ audience: "public" }, { audience: { $size: 0 } }]
      })
        .sort({ pinned: -1, publishDate: -1 })
        .limit(2)
        .lean(),
      Book.find({ published: true, archived: false, featured: true })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate("category", "name slug")
        .lean(),
      PageContent.findOne({ key: "about", published: true }).select("key title body updatedAt").lean()
    ]);

    const [programCount, facultyCount, bookCount, eventCount] = statsSeed;

    res.json({
      settings: publicSettings(settings),
      stats: {
        programs: programCount,
        faculty: facultyCount,
        books: bookCount,
        events: eventCount
      },
      programs,
      faculty,
      gallery,
      events,
      announcements,
      books: { items: books.map((book) => shapeBook(book)) },
      about: about || null
    });
  })
);

publicRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [programs, faculty, books, events] = await Promise.all([
      Program.countDocuments({ published: true }),
      Teacher.countDocuments({ published: true }),
      Book.countDocuments({ published: true, archived: false }),
      Event.countDocuments({ published: true, startDate: { $gte: new Date() } })
    ]);
    res.json({ programs, faculty, books, events });
  })
);

publicRouter.get(
  "/sessions",
  asyncHandler(async (_req, res) => {
    const sessions = await AcademicSession.find({})
      .select("name startDate endDate isActive")
      .sort({ startDate: -1 })
      .limit(20)
      .lean();
    res.json(
      sessions.map((session) => ({
        _id: String(session._id),
        name: session.name,
        startDate: session.startDate,
        endDate: session.endDate,
        isActive: session.isActive
      }))
    );
  })
);

publicRouter.get(
  "/pages/:key",
  asyncHandler(async (req, res) => {
    const page = await PageContent.findOne({ key: req.params.key, published: true }).lean();
    if (!page) throw new ApiError(404, "Page content is not available.");
    res.json({
      key: page.key,
      title: page.title,
      body: page.body,
      updatedAt: page.updatedAt
    });
  })
);

publicRouter.get(
  "/programs",
  asyncHandler(async (_req, res) => {
    const programs = await Program.find({ published: true }).sort({ order: 1, title: 1 }).lean();
    res.json(programs);
  })
);

publicRouter.get(
  "/programs/:slug",
  asyncHandler(async (req, res) => {
    const program = await Program.findOne({ slug: req.params.slug, published: true }).lean();
    if (!program) throw new ApiError(404, "Program not found.");
    res.json(program);
  })
);

publicRouter.get(
  "/faculty",
  asyncHandler(async (_req, res) => {
    const teachers = await Teacher.find({ published: true })
      .select("name qualifications bio programs")
      .populate("programs", "title slug")
      .sort({ name: 1 })
      .lean();
    res.json(teachers);
  })
);

publicRouter.get(
  "/gallery",
  asyncHandler(async (_req, res) => {
    const items = await GalleryItem.find({ published: true }).sort({ order: 1, createdAt: -1 }).lean();
    res.json(items);
  })
);

publicRouter.get(
  "/events",
  asyncHandler(async (_req, res) => {
    const items = await Event.find({ published: true }).sort({ startDate: 1 }).lean();
    res.json(items);
  })
);

publicRouter.get(
  "/events/:slug",
  asyncHandler(async (req, res) => {
    const item = await Event.findOne({ slug: req.params.slug, published: true }).lean();
    if (!item) throw new ApiError(404, "Event not found.");
    res.json(item);
  })
);

publicRouter.get(
  "/announcements",
  asyncHandler(async (_req, res) => {
    const items = await Announcement.find({
      published: true,
      $or: [{ audience: "public" }, { audience: { $size: 0 } }]
    })
      .sort({ pinned: -1, publishDate: -1 })
      .limit(50)
      .lean();
    res.json(items);
  })
);

publicRouter.get(
  "/faqs",
  asyncHandler(async (_req, res) => {
    const items = await Faq.find({ published: true }).sort({ order: 1, createdAt: 1 }).lean();
    res.json(items);
  })
);

publicRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await BookCategory.find({ published: true }).sort({ order: 1, name: 1 }).lean();
    res.json(
      categories.map((category) => ({
        id: String(category._id),
        name: category.name,
        slug: category.slug
      }))
    );
  })
);

publicRouter.get(
  "/books",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const match: Record<string, unknown> = { published: true, archived: false };
    const search = String(req.query.search || "").trim();
    const language = String(req.query.language || "").trim();
    const categorySlug = String(req.query.category || "").trim();
    const availability = String(req.query.availability || "").trim();
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    const featured = req.query.featured === "true";
    const sortKey = String(req.query.sort || "newest");

    if (featured) match.featured = true;
    if (language && ["en", "ur", "ar"].includes(language)) match.language = language;
    if (search) {
      const pattern = new RegExp(escapeRegExp(search), "i");
      match.$or = [
        { "title.en": pattern },
        { "title.ur": pattern },
        { "title.ar": pattern },
        { author: pattern },
        { sku: pattern },
        { isbn: pattern }
      ];
    }
    if (categorySlug) {
      const category = await BookCategory.findOne({ slug: categorySlug, published: true }).lean();
      if (!category) {
        return res.json({ items: [], pagination: paginationMeta(0, page, limit) });
      }
      match.category = category._id;
    }

    const expressions: Record<string, unknown>[] = [];
    if (Number.isFinite(minPrice) && minPrice > 0) {
      expressions.push({ $gte: ["$effectivePrice", minPrice] });
    }
    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      expressions.push({ $lte: ["$effectivePrice", maxPrice] });
    }
    if (availability === "in_stock") {
      expressions.push({ $gt: ["$stock", "$lowStockThreshold"] });
    } else if (availability === "low_stock") {
      expressions.push({ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] });
    } else if (availability === "out_of_stock") {
      expressions.push({ $lte: ["$stock", 0] });
    }
    if (expressions.length) match.$expr = { $and: expressions };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      price_asc: { effectivePrice: 1 },
      price_desc: { effectivePrice: -1 },
      title: { "title.en": 1 }
    };
    const sort = sortMap[sortKey] || sortMap.newest;

    const pipeline: any[] = [
      { $match: match },
      { $addFields: { effectivePrice: { $ifNull: ["$salePrice", "$price"] } } },
      { $sort: sort },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }],
          meta: [{ $count: "total" }]
        }
      }
    ];

    const [result] = await Book.aggregate(pipeline);
    const items = result?.items || [];
    const total = result?.meta?.[0]?.total || 0;
    const categoryIds = Array.from(new Set(items.map((book: any) => String(book.category))));
    const categories = await BookCategory.find({ _id: { $in: categoryIds } }).lean();
    const categoryMap = new Map(categories.map((category) => [String(category._id), category]));

    res.json({
      items: items.map((book: any) =>
        shapeBook({
          ...book,
          category: categoryMap.get(String(book.category)) || {
            _id: book.category,
            name: null,
            slug: ""
          }
        })
      ),
      pagination: paginationMeta(total, page, limit)
    });
  })
);

publicRouter.get(
  "/books/:slug",
  asyncHandler(async (req, res) => {
    const book = await Book.findOne({ slug: req.params.slug, published: true, archived: false })
      .populate("category", "name slug")
      .lean();
    if (!book) throw new ApiError(404, "Book not found.");
    res.json(shapeBook(book));
  })
);

publicRouter.post(
  "/orders",
  optionalAuth,
  checkoutLimiter,
  asyncHandler(async (req, res) => {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "Please check the checkout information.",
        parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      );
    }
    const payload = parsed.data;
    const settings = await getSettings();

    if (payload.paymentMethod === "cod" && !settings.codEnabled) {
      throw new ApiError(400, "Cash on delivery is not currently available.");
    }
    if (payload.paymentMethod === "bank_transfer" && !settings.bankTransferEnabled) {
      throw new ApiError(400, "Bank transfer is not currently available.");
    }

    const quantities = new Map<string, number>();
    for (const item of payload.items) {
      quantities.set(item.bookId, (quantities.get(item.bookId) || 0) + item.quantity);
    }
    const bookIds = Array.from(quantities.keys());
    if (bookIds.some((id) => (quantities.get(id) || 0) > 20)) {
      throw new ApiError(400, "The maximum quantity per book is 20.");
    }

    const books = await Book.find({ _id: { $in: bookIds } }).lean();
    if (books.length !== bookIds.length) throw new ApiError(400, "One or more books are unavailable.");

    let subtotal = 0;
    const snapshots: any[] = [];
    for (const book of books) {
      const quantity = quantities.get(String(book._id)) || 0;
      if (!book.published || book.archived) {
        throw new ApiError(409, `"${book.title?.en || book.sku}" is no longer available for purchase.`);
      }
      if (book.stock < quantity) {
        throw new ApiError(409, `Only ${book.stock} copies of "${book.title?.en || book.sku}" are available.`);
      }
      const unitPrice = book.salePrice ?? book.price;
      subtotal += unitPrice * quantity;
      snapshots.push({
        book: book._id,
        title: book.title?.en || book.title?.ur || book.title?.ar || book.sku,
        sku: book.sku,
        unitPrice,
        quantity
      });
    }

    const shipping =
      settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove
        ? 0
        : Number(settings.shippingFee) || 0;
    const total = subtotal + shipping;

    const adjusted: { bookId: string; quantity: number }[] = [];
    for (const item of snapshots) {
      const updated = await Book.findOneAndUpdate(
        {
          _id: item.book,
          published: true,
          archived: false,
          stock: { $gte: item.quantity }
        },
        { $inc: { stock: -item.quantity } },
        { new: true }
      ).lean();

      if (!updated) {
        for (const restore of adjusted) {
          await Book.updateOne({ _id: restore.bookId }, { $inc: { stock: restore.quantity } });
        }
        throw new ApiError(409, `Stock changed while checking out "${item.title}". Please review your cart.`);
      }
      adjusted.push({ bookId: String(item.book), quantity: item.quantity });
    }

    const accessToken = randomToken(32);
    let order: any = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3 && !order; attempt += 1) {
      try {
        order = await Order.create({
          orderNumber: orderNumber(),
          accessTokenHash: sha256(accessToken),
          user: req.user?.id || null,
          customerName: payload.customerName,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          city: payload.city,
          notes: payload.notes,
          items: snapshots,
          subtotal,
          shipping,
          total,
          paymentMethod: payload.paymentMethod,
          paymentStatus: payload.paymentMethod === "cod" ? "cash_on_delivery" : "pending_verification",
          fulfilmentStatus: "pending",
          statusHistory: [
            {
              fulfilmentStatus: "pending",
              paymentStatus: payload.paymentMethod === "cod" ? "cash_on_delivery" : "pending_verification",
              note: "Order placed."
            }
          ]
        });
      } catch (error) {
        lastError = error;
      }
    }

    if (!order) {
      for (const restore of adjusted) {
        await Book.updateOne({ _id: restore.bookId }, { $inc: { stock: restore.quantity } });
      }
      console.error("Order creation failed", lastError instanceof Error ? lastError.message : lastError);
      throw new ApiError(500, "The order could not be completed. Your stock has not been reserved.");
    }

    for (const item of adjusted) {
      const book = await Book.findById(item.bookId).select("stock").lean();
      await InventoryMovement.create({
        book: item.bookId,
        delta: -item.quantity,
        reason: "order_placed",
        order: order._id,
        actor: req.user?.id || null,
        stockAfter: book?.stock ?? 0
      });
    }

    await notifyAdmins(
      "New bookstore order",
      `${payload.customerName} placed order ${order.orderNumber}.`,
      "/admin/orders"
    );

    res.status(201).json({
      order: shapeOrder(order),
      accessToken,
      paymentMethod: payload.paymentMethod,
      instructions:
        payload.paymentMethod === "bank_transfer" && settings.bankTransferEnabled
          ? settings.bankDetails
          : null
    });
  })
);

publicRouter.post(
  "/whatsapp-orders",
  optionalAuth,
  checkoutLimiter,
  asyncHandler(async (req, res) => {
    const parsed = whatsappOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "Please check the order information.",
        parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      );
    }
    const payload = parsed.data;

    const quantities = new Map<string, number>();
    for (const item of payload.items) {
      quantities.set(item.bookId, (quantities.get(item.bookId) || 0) + item.quantity);
    }
    const bookIds = Array.from(quantities.keys());
    if (bookIds.some((id) => (quantities.get(id) || 0) > 20)) {
      throw new ApiError(400, "The maximum quantity per book is 20.");
    }

    const books = await Book.find({ _id: { $in: bookIds } }).lean();
    if (books.length !== bookIds.length) throw new ApiError(400, "One or more books are unavailable.");

    let subtotal = 0;
    const snapshots: any[] = [];
    for (const book of books) {
      const quantity = quantities.get(String(book._id)) || 0;
      if (!book.published || book.archived) {
        throw new ApiError(409, `"${book.title?.en || book.sku}" is no longer available for purchase.`);
      }
      if (book.stock < quantity) {
        throw new ApiError(409, `Only ${book.stock} copies of "${book.title?.en || book.sku}" are available.`);
      }
      const unitPrice = book.salePrice ?? book.price;
      subtotal += unitPrice * quantity;
      snapshots.push({
        book: book._id,
        title: book.title?.en || book.title?.ur || book.title?.ar || book.sku,
        sku: book.sku,
        unitPrice,
        quantity
      });
    }

    const settings = await getSettings();
    const shipping =
      settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove
        ? 0
        : Number(settings.shippingFee) || 0;
    const total = subtotal + shipping;

    let request: any = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3 && !request; attempt += 1) {
      try {
        request = await WhatsAppOrder.create({
          requestNumber: whatsappOrderNumber(),
          user: req.user?.id || null,
          customerName: payload.customerName,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          city: payload.city,
          notes: payload.notes,
          items: snapshots,
          subtotal,
          shipping,
          total,
          status: "new",
          statusHistory: [
            {
              status: "new",
              note: "WhatsApp order request created from the website."
            }
          ]
        });
      } catch (error) {
        lastError = error;
      }
    }

    if (!request) {
      console.error(
        "WhatsApp order creation failed",
        lastError instanceof Error ? lastError.message : lastError
      );
      throw new ApiError(500, "The WhatsApp order request could not be saved. Please try again.");
    }

    const itemLines = snapshots
      .map(
        (item, index) =>
          `${index + 1}. ${item.title} — ${item.quantity} x Rs ${item.unitPrice.toLocaleString("en-PK")}`
      )
      .join("\n");
    const message = [
      "Assalam-o-Alaikum! I would like to order these books:",
      "",
      `Request: ${request.requestNumber}`,
      itemLines,
      "",
      `Subtotal: Rs ${subtotal.toLocaleString("en-PK")}`,
      `Shipping: Rs ${shipping.toLocaleString("en-PK")}`,
      `Total: Rs ${total.toLocaleString("en-PK")}`,
      "",
      `Name: ${payload.customerName}`,
      `Phone: ${payload.phone}`,
      payload.email ? `Email: ${payload.email}` : "",
      payload.address ? `Address: ${payload.address}${payload.city ? `, ${payload.city}` : ""}` : "",
      payload.notes ? `Notes: ${payload.notes}` : "",
      "",
      "Please confirm availability and delivery."
    ]
      .filter(Boolean)
      .join("\n");

    await notifyAdmins(
      "New WhatsApp order request",
      `${payload.customerName} started order ${request.requestNumber} on WhatsApp.`,
      "/admin/whatsapp-orders"
    );

    res.status(201).json({
      request: shapeWhatsAppOrder(request),
      whatsappUrl: whatsappLink(message)
    });
  })
);

publicRouter.get(
  "/orders/:orderNumber",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() }).select(
      "+accessTokenHash"
    );
    if (!order) throw new ApiError(404, "Order not found.");

    const token = String(req.query.token || "");
    const tokenValid = token.length > 20 && safeEqual(sha256(token), order.accessTokenHash);
    const ownerValid =
      req.user && (req.user.role === "super_admin" || String(order.user || "") === req.user.id);

    if (!tokenValid && !ownerValid) {
      throw new ApiError(403, "This order requires a valid confirmation link.");
    }

    res.json(shapeOrder(order));
  })
);

publicRouter.post(
  "/admissions",
  formLimiter,
  asyncHandler(async (_req, _res, next) => {
    const settings = await getSettings();
    if (!settings.admissionsOpen) {
      throw new ApiError(403, "Online admissions are currently closed.");
    }
    next();
  }),
  admissionUpload.array("documents", 3),
  verifyDocumentContent,
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) || [];
    const parsed = admissionSchema.safeParse(req.body);
    if (!parsed.success) {
      for (const file of files) fs.unlink(file.path, () => undefined);
      throw new ApiError(
        400,
        "Please check the application information.",
        parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      );
    }
    const payload = parsed.data;

    let additionalFields: Record<string, unknown> = {};
    try {
      additionalFields = payload.additionalFields ? JSON.parse(payload.additionalFields) : {};
    } catch {
      additionalFields = {};
    }

    if (payload.program) {
      const program = await Program.exists({ _id: payload.program, published: true });
      if (!program) {
        for (const file of files) fs.unlink(file.path, () => undefined);
        throw new ApiError(400, "The selected program is not available.");
      }
    }
    if (payload.session) {
      const session = await AcademicSession.exists({ _id: payload.session });
      if (!session) {
        for (const file of files) fs.unlink(file.path, () => undefined);
        throw new ApiError(400, "The selected academic session is not available.");
      }
    }

    const pin = trackingPin();
    let admission: any = null;
    for (let attempt = 0; attempt < 3 && !admission; attempt += 1) {
      try {
        admission = await Admission.create({
          reference: admissionReference(),
          pinHash: sha256(pin),
          studentName: payload.studentName,
          dob: startOfDay(payload.dob),
          gender: payload.gender,
          guardianName: payload.guardianName,
          relationship: payload.relationship,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          previousEducation: payload.previousEducation,
          program: payload.program,
          session: payload.session,
          additionalFields,
          documents: files.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size
          })),
          status: "submitted",
          statusHistory: [{ status: "submitted", note: "Application received.", at: new Date() }]
        });
      } catch (error: any) {
        if (error?.code !== 11000) throw error;
      }
    }

    if (!admission) {
      for (const file of files) fs.unlink(file.path, () => undefined);
      throw new ApiError(500, "The application could not be submitted. Please try again.");
    }

    await notifyAdmins(
      "New admission application",
      `${payload.studentName} submitted application ${admission.reference}.`,
      "/admin/admissions"
    );

    res.status(201).json({
      reference: admission.reference,
      trackingPin: pin,
      message: "Application received. Keep the reference and tracking PIN safe."
    });
  })
);

publicRouter.post(
  "/admissions/track",
  formLimiter,
  asyncHandler(async (req, res) => {
    const parsed = admissionTrackSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Enter a valid application reference and tracking PIN.");
    }
    const admission = await Admission.findOne({
      reference: parsed.data.reference.toUpperCase()
    }).select("+pinHash");
    if (!admission || !safeEqual(sha256(parsed.data.pin), admission.pinHash)) {
      throw new ApiError(404, "No matching application was found.");
    }

    const program = admission.program
      ? await Program.findById(admission.program).select("title slug").lean()
      : null;
    const session = admission.session
      ? await AcademicSession.findById(admission.session).select("name").lean()
      : null;

    res.json({
      reference: admission.reference,
      studentName: admission.studentName,
      status: admission.status,
      program: program ? { title: program.title, slug: program.slug } : null,
      session: session ? session.name : null,
      submittedAt: admission.createdAt,
      updatedAt: admission.updatedAt,
      history: (admission.statusHistory || []).map((entry: any) => ({
        status: entry.status,
        at: entry.at
      }))
    });
  })
);

publicRouter.post(
  "/contact",
  formLimiter,
  asyncHandler(async (req, res) => {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "Please check the contact form.",
        parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      );
    }
    if (parsed.data.website) {
      return res.json({ message: "Thank you. Your message has been received." });
    }
    const message = await ContactMessage.create({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      subject: parsed.data.subject,
      message: parsed.data.message,
      ipHash: crypto
        .createHash("sha256")
        .update(`${req.ip || "unknown"}:${env.SESSION_SECRET}`)
        .digest("hex")
    });
    await notifyAdmins("New contact message", `${message.name}: ${message.subject}`, "/admin/messages");
    res.status(201).json({ message: "Thank you. Your message has been received." });
  })
);
