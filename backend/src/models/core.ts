import mongoose, { Schema, model } from "mongoose";

export const userRoles = ["super_admin", "teacher", "student", "guardian", "customer"] as const;
export type UserRole = (typeof userRoles)[number];

export const localizedSchema = new Schema(
  {
    en: { type: String, trim: true, default: "" },
    ur: { type: String, trim: true, default: "" },
    ar: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

export const localized = {
  en: { type: String, trim: true, default: "" },
  ur: { type: String, trim: true, default: "" },
  ar: { type: String, trim: true, default: "" }
};

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: "" },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: userRoles, default: "customer", index: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    resetTokenHash: { type: String, select: false, default: null },
    resetTokenExpires: { type: Date, select: false, default: null }
  },
  { timestamps: true }
);

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    actorEmail: { type: String, default: "" },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const siteSettingSchema = new Schema(
  {
    key: { type: String, unique: true, default: "main" },
    siteName: { type: String, default: "Madrasa Miftah ul Uloom" },
    logoUrl: { type: String, default: "" },
    brandSubtitle: localized,
    heroTitle: localized,
    heroSubtitle: localized,
    heroNote: localized,
    heroImage: { type: String, default: "" },
    tagline: localized,
    aboutShort: localized,
    announcementBar: localized,
    contactPhone: { type: String, default: "" },
    contactPhoneAlt: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    address: localized,
    officeHours: localized,
    admissionEmail: { type: String, default: "" },
    admissionsOpen: { type: Boolean, default: true },
    socials: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      whatsapp: { type: String, default: "" }
    },
    shippingFee: { type: Number, default: 250, min: 0 },
    freeShippingAbove: { type: Number, default: 5000, min: 0 },
    codEnabled: { type: Boolean, default: true },
    bankTransferEnabled: { type: Boolean, default: false },
    bankDetails: localized,
    shippingPolicy: localized,
    paymentPolicy: localized,
    cancellationPolicy: localized,
    returnPolicy: localized,
    mapEmbedUrl: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

const pageContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    title: localized,
    body: localized,
    published: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

export const User = (mongoose.models.User || model("User", userSchema)) as mongoose.Model<Record<string, any>>;
export const AuditLog = (mongoose.models.AuditLog || model("AuditLog", auditLogSchema)) as mongoose.Model<Record<string, any>>;
export const Notification = (mongoose.models.Notification || model("Notification", notificationSchema)) as mongoose.Model<Record<string, any>>;
export const SiteSetting = (mongoose.models.SiteSetting || model("SiteSetting", siteSettingSchema)) as mongoose.Model<Record<string, any>>;
export const PageContent = (mongoose.models.PageContent || model("PageContent", pageContentSchema)) as mongoose.Model<Record<string, any>>;
