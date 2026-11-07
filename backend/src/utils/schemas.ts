import { z } from "zod";
import { admissionStatuses, attendanceStatuses } from "../models/academic.js";
import { invoiceStatuses } from "../models/finance.js";
import { bookLanguages, orderFulfilmentStatuses, orderPaymentStatuses, whatsappOrderStatuses } from "../models/store.js";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const optionalId = z
  .union([objectId, z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? value : null));

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/\d/, "Password must include a number");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128)
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(200),
  password: passwordSchema
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().default("")
});

export const admissionSchema = z.object({
  studentName: z.string().trim().min(2).max(160),
  dob: z.coerce.date(),
  gender: z.enum(["male", "female", "other", ""]).optional().default(""),
  guardianName: z.string().trim().min(2).max(160),
  relationship: z.string().trim().max(80).optional().default(""),
  phone: z.string().trim().min(7).max(40),
  email: z.union([z.string().trim().email(), z.literal("")]).optional().default(""),
  address: z.string().trim().min(5).max(600),
  previousEducation: z.string().trim().max(400).optional().default(""),
  program: optionalId,
  session: optionalId,
  additionalFields: z.string().optional().default("{}")
});

export const admissionTrackSchema = z.object({
  reference: z.string().trim().min(5).max(40),
  pin: z.string().trim().regex(/^\d{6}$/, "Enter the six-digit tracking PIN")
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.union([z.string().trim().email(), z.literal("")]).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(200).optional().default("")
});

export const localText = z.object({
  en: z.string().max(8000).default(""),
  ur: z.string().max(8000).default(""),
  ar: z.string().max(8000).default("")
});

export const programSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: localText,
  summary: localText,
  description: localText,
  duration: z.string().max(120).optional().default(""),
  ageGroup: z.string().max(120).optional().default(""),
  monthlyFeeNote: z.string().max(200).optional().default(""),
  image: z.string().max(500).optional().default(""),
  published: z.coerce.boolean().optional().default(true),
  order: z.coerce.number().optional().default(0)
});

export const teacherSchema = z.object({
  name: z.string().trim().min(2).max(160),
  qualifications: z.string().max(400).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  email: z.union([z.string().email(), z.literal("")]).optional().default(""),
  bio: localText,
  programs: z.array(objectId).optional().default([]),
  classes: z.array(objectId).optional().default([]),
  subjects: z.array(objectId).optional().default([]),
  published: z.coerce.boolean().optional().default(false)
});

export const studentSchema = z.object({
  name: z.string().trim().min(2).max(160),
  dob: z.coerce.date().nullable().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional().default(""),
  address: z.string().max(600).optional().default(""),
  previousEducation: z.string().max(400).optional().default(""),
  guardian: z
    .object({
      name: z.string().max(160).optional().default(""),
      relationship: z.string().max(80).optional().default(""),
      phone: z.string().max(40).optional().default(""),
      email: z.union([z.string().email(), z.literal("")]).optional().default("")
    })
    .optional()
    .default({ name: "", relationship: "", phone: "", email: "" }),
  program: optionalId,
  class: optionalId,
  session: optionalId,
  status: z.enum(["active", "inactive", "transferred", "graduated"]).optional().default("active")
});

export const academicSessionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.coerce.boolean().optional().default(false)
});

export const classSchema = z.object({
  name: z.string().trim().min(1).max(120),
  section: z.string().max(40).optional().default(""),
  program: objectId,
  session: objectId,
  teacher: optionalId,
  capacity: z.coerce.number().int().min(1).max(500).optional().default(30)
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(30),
  program: optionalId,
  classes: z.array(objectId).optional().default([]),
  published: z.coerce.boolean().optional().default(true)
});

export const admissionUpdateSchema = z.object({
  status: z.enum(admissionStatuses),
  note: z.string().max(1000).optional().default(""),
  reviewNotes: z.string().max(4000).optional().default("")
});

export const attendanceSchema = z.object({
  classId: objectId,
  date: z.coerce.date(),
  records: z
    .array(
      z.object({
        studentId: objectId,
        status: z.enum(attendanceStatuses)
      })
    )
    .min(1)
    .max(300),
  reason: z.string().max(500).optional().default("")
});

export const examSchema = z.object({
  title: z.string().trim().min(2).max(160),
  program: optionalId,
  class: optionalId,
  session: optionalId,
  startDate: z.coerce.date(),
  subjects: z
    .array(
      z.object({
        subject: objectId,
        maxMarks: z.coerce.number().int().min(1).max(1000),
        passMarks: z.coerce.number().int().min(0).max(1000)
      })
    )
    .min(1),
  published: z.coerce.boolean().optional().default(false)
});

export const marksSchema = z.object({
  examId: objectId,
  subjectId: objectId,
  records: z
    .array(
      z.object({
        studentId: objectId,
        obtainedMarks: z.union([z.null(), z.coerce.number().min(0)])
      })
    )
    .min(1)
    .max(300)
});

export const feeStructureSchema = z.object({
  name: z.string().trim().min(2).max(160),
  program: optionalId,
  session: optionalId,
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        amount: z.coerce.number().min(0),
        dueDate: z.coerce.date().nullable().optional()
      })
    )
    .min(1),
  active: z.coerce.boolean().optional().default(true)
});

export const invoiceSchema = z.object({
  studentId: objectId,
  session: optionalId,
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        amount: z.coerce.number().min(0)
      })
    )
    .min(1),
  discount: z.coerce.number().min(0).optional().default(0),
  fine: z.coerce.number().min(0).optional().default(0),
  dueDate: z.coerce.date(),
  notes: z.string().max(1000).optional().default("")
});

export const generateInvoicesSchema = z.object({
  feeStructureId: objectId,
  classId: optionalId,
  dueDate: z.coerce.date().optional()
});

export const paymentSchema = z.object({
  invoiceId: objectId,
  amount: z.coerce.number().positive(),
  method: z.enum(["cash", "bank_transfer"]),
  reference: z.string().max(200).optional().default(""),
  paidAt: z.coerce.date().optional(),
  note: z.string().max(500).optional().default("")
});

export const announcementSchema = z.object({
  title: localText,
  body: localText,
  category: z.string().max(80).optional().default("general"),
  published: z.coerce.boolean().optional().default(true),
  publishDate: z.coerce.date().optional(),
  pinned: z.coerce.boolean().optional().default(false),
  audience: z.array(z.enum(["public", "students", "guardians", "teachers"])).optional().default(["public"])
});

export const eventSchema = z.object({
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9-]+$/),
  title: localText,
  description: localText,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  location: localText,
  image: z.string().max(500).optional().default(""),
  published: z.coerce.boolean().optional().default(false),
  featured: z.coerce.boolean().optional().default(false)
});

export const gallerySchema = z.object({
  title: localText,
  alt: localText,
  image: z.string().min(1).max(500),
  category: z.string().max(80).optional().default("campus"),
  published: z.coerce.boolean().optional().default(true),
  order: z.coerce.number().optional().default(0)
});

export const faqSchema = z.object({
  question: localText,
  answer: localText,
  category: z.string().max(80).optional().default("general"),
  order: z.coerce.number().optional().default(0),
  published: z.coerce.boolean().optional().default(true)
});

export const pageContentSchema = z.object({
  key: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  title: localText,
  body: localText,
  published: z.coerce.boolean().optional().default(true)
});

export const bookCategorySchema = z.object({
  name: localText,
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  order: z.coerce.number().optional().default(0),
  published: z.coerce.boolean().optional().default(true)
});

export const bookSchema = z.object({
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9-]+$/),
  title: localText,
  author: z.string().trim().min(1).max(200),
  translator: z.string().max(200).optional().default(""),
  description: localText,
  category: objectId,
  language: z.enum(bookLanguages),
  price: z.coerce.number().min(0),
  salePrice: z.union([z.coerce.number().min(0), z.null()]).optional(),
  sku: z.string().trim().min(2).max(60),
  isbn: z.string().max(40).optional().default(""),
  publisher: z.string().max(200).optional().default(""),
  publicationYear: z.string().max(20).optional().default(""),
  pages: z.coerce.number().int().min(1).nullable().optional(),
  coverImage: z.string().max(500).optional().default(""),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
  published: z.coerce.boolean().optional().default(false),
  featured: z.coerce.boolean().optional().default(false),
  archived: z.coerce.boolean().optional().default(false)
});

export const stockSchema = z.object({
  delta: z.coerce.number().int().refine((value) => value !== 0, "Enter a non-zero adjustment"),
  reason: z.string().trim().min(3).max(300)
});

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        bookId: objectId,
        quantity: z.coerce.number().int().min(1).max(20)
      })
    )
    .min(1)
    .max(40),
  customerName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(40),
  email: z.union([z.string().trim().email(), z.literal("")]).optional().default(""),
  address: z.string().trim().min(8).max(600),
  city: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(1000).optional().default(""),
  paymentMethod: z.enum(["cod", "bank_transfer"])
});

export const orderUpdateSchema = z.object({
  fulfilmentStatus: z.enum(orderFulfilmentStatuses).optional(),
  paymentStatus: z.enum(orderPaymentStatuses).optional(),
  note: z.string().max(1000).optional().default("")
});

export const whatsappOrderSchema = z.object({
  items: z
    .array(
      z.object({
        bookId: objectId,
        quantity: z.coerce.number().int().min(1).max(20)
      })
    )
    .min(1)
    .max(40),
  customerName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(40),
  email: z.union([z.string().trim().email(), z.literal("")]).optional().default(""),
  address: z.string().trim().max(600).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  notes: z.string().trim().max(1000).optional().default("")
});

export const whatsappOrderUpdateSchema = z.object({
  status: z.enum(whatsappOrderStatuses),
  note: z.string().trim().max(1000).optional().default("")
});

export const settingsSchema = z.object({
  siteName: z.string().trim().min(2).max(160),
  logoUrl: z.string().max(500).optional().default(""),
  brandSubtitle: localText.optional(),
  heroTitle: localText.optional(),
  heroSubtitle: localText.optional(),
  heroNote: localText.optional(),
  heroImage: z.string().max(500).optional().default(""),
  tagline: localText,
  aboutShort: localText,
  announcementBar: localText,
  contactPhone: z.string().max(40).optional().default(""),
  contactPhoneAlt: z.string().max(40).optional().default(""),
  contactEmail: z.union([z.string().email(), z.literal("")]).optional().default(""),
  address: localText,
  officeHours: localText,
  admissionEmail: z.union([z.string().email(), z.literal("")]).optional().default(""),
  admissionsOpen: z.coerce.boolean().optional().default(true),
  socials: z
    .object({
      facebook: z.string().max(500).optional().default(""),
      instagram: z.string().max(500).optional().default(""),
      youtube: z.string().max(500).optional().default(""),
      whatsapp: z.string().max(500).optional().default("")
    })
    .optional(),
  shippingFee: z.coerce.number().min(0).optional().default(250),
  freeShippingAbove: z.coerce.number().min(0).optional().default(5000),
  codEnabled: z.coerce.boolean().optional().default(true),
  bankTransferEnabled: z.coerce.boolean().optional().default(false),
  bankDetails: localText,
  shippingPolicy: localText,
  paymentPolicy: localText,
  cancellationPolicy: localText,
  returnPolicy: localText,
  mapEmbedUrl: z.string().max(1000).optional().default("")
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email(),
  phone: z.string().max(40).optional().default(""),
  password: passwordSchema,
  role: z.enum(["super_admin", "teacher", "student", "guardian", "customer"])
});

export const messageStatusSchema = z.object({
  status: z.enum(["new", "read", "replied", "archived"])
});

export const createPortalAccountSchema = z.object({
  email: z.string().trim().email(),
  password: passwordSchema,
  name: z.string().trim().min(2).max(160).optional()
});

export const invoiceStatusSchema = z.enum(invoiceStatuses);
