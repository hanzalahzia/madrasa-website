import mongoose, { Schema, model } from "mongoose";
import { localized } from "./core.js";

const announcementSchema = new Schema(
  {
    title: localized,
    body: localized,
    category: { type: String, default: "general" },
    published: { type: Boolean, default: true, index: true },
    publishDate: { type: Date, default: Date.now, index: true },
    pinned: { type: Boolean, default: false },
    audience: [{ type: String, enum: ["public", "students", "guardians", "teachers"] }]
  },
  { timestamps: true }
);

const eventSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: localized,
    description: localized,
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, default: null },
    location: localized,
    image: { type: String, default: "" },
    published: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const galleryItemSchema = new Schema(
  {
    title: localized,
    alt: localized,
    image: { type: String, required: true },
    category: { type: String, default: "campus" },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const faqSchema = new Schema(
  {
    question: localized,
    answer: localized,
    category: { type: String, default: "general" },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: "" },
    phone: { type: String, default: "" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read", "replied", "archived"], default: "new", index: true },
    ipHash: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Announcement = (mongoose.models.Announcement || model("Announcement", announcementSchema)) as mongoose.Model<Record<string, any>>;
export const Event = (mongoose.models.Event || model("Event", eventSchema)) as mongoose.Model<Record<string, any>>;
export const GalleryItem = (mongoose.models.GalleryItem || model("GalleryItem", galleryItemSchema)) as mongoose.Model<Record<string, any>>;
export const Faq = (mongoose.models.Faq || model("Faq", faqSchema)) as mongoose.Model<Record<string, any>>;
export const ContactMessage = (mongoose.models.ContactMessage || model("ContactMessage", contactMessageSchema)) as mongoose.Model<Record<string, any>>;
