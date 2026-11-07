import mongoose, { Schema, model } from "mongoose";
import { localized } from "./core.js";

export const bookLanguages = ["en", "ur", "ar"] as const;
export const orderFulfilmentStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned"
] as const;
export const orderPaymentStatuses = [
  "unpaid",
  "pending_verification",
  "paid",
  "failed",
  "refunded",
  "cash_on_delivery"
] as const;
export const whatsappOrderStatuses = ["new", "contacted", "confirmed", "closed"] as const;

const bookCategorySchema = new Schema(
  {
    name: localized,
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

const bookSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: localized,
    author: { type: String, required: true, trim: true },
    translator: { type: String, default: "" },
    description: localized,
    category: { type: Schema.Types.ObjectId, ref: "BookCategory", required: true, index: true },
    language: { type: String, enum: bookLanguages, default: "en", index: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: null, min: 0 },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    isbn: { type: String, default: "" },
    publisher: { type: String, default: "" },
    publicationYear: { type: String, default: "" },
    pages: { type: Number, default: null },
    coverImage: { type: String, default: "" },
    stock: { type: Number, required: true, default: 0, min: 0, index: true },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    published: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false },
    archived: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);
bookSchema.index({ category: 1, published: 1, archived: 1 });

const inventoryMovementSchema = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    delta: { type: Number, required: true },
    reason: { type: String, required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", default: null, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    stockAfter: { type: Number, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const orderItemSchema = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    title: { type: String, required: true },
    sku: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    accessTokenHash: { type: String, required: true, select: false },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true, default: "" },
    address: { type: String, required: true },
    city: { type: String, required: true },
    notes: { type: String, default: "" },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cod", "bank_transfer"], required: true },
    paymentStatus: { type: String, enum: orderPaymentStatuses, default: "unpaid", index: true },
    fulfilmentStatus: { type: String, enum: orderFulfilmentStatuses, default: "pending", index: true },
    statusHistory: [
      {
        fulfilmentStatus: { type: String, enum: orderFulfilmentStatuses },
        paymentStatus: { type: String, enum: orderPaymentStatuses },
        note: { type: String, default: "" },
        by: { type: Schema.Types.ObjectId, ref: "User", default: null },
        at: { type: Date, default: Date.now }
      }
    ],
    stockReleased: { type: Boolean, default: false },
    demo: { type: Boolean, default: false }
  },
  { timestamps: true }
);
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

const whatsappOrderSchema = new Schema(
  {
    requestNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    notes: { type: String, default: "" },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: whatsappOrderStatuses, default: "new", index: true },
    statusHistory: [
      {
        status: { type: String, enum: whatsappOrderStatuses },
        note: { type: String, default: "" },
        by: { type: Schema.Types.ObjectId, ref: "User", default: null },
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);
whatsappOrderSchema.index({ createdAt: -1 });
whatsappOrderSchema.index({ status: 1, createdAt: -1 });

export const BookCategory = (mongoose.models.BookCategory || model("BookCategory", bookCategorySchema)) as mongoose.Model<Record<string, any>>;
export const Book = (mongoose.models.Book || model("Book", bookSchema)) as mongoose.Model<Record<string, any>>;
export const InventoryMovement = (mongoose.models.InventoryMovement || model("InventoryMovement", inventoryMovementSchema)) as mongoose.Model<Record<string, any>>;
export const Order = (mongoose.models.Order || model("Order", orderSchema)) as mongoose.Model<Record<string, any>>;
export const WhatsAppOrder = (mongoose.models.WhatsAppOrder || model("WhatsAppOrder", whatsappOrderSchema)) as mongoose.Model<Record<string, any>>;
