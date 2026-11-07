import type { Localized } from "./i18n";

export type Role = "super_admin" | "teacher" | "student" | "guardian" | "customer";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  createdAt?: string;
}

export interface PortalProfile {
  type: "student" | "teacher" | "guardian" | "customer";
  id: string;
  reference: string;
}

export interface PublicSettings {
  siteName: string;
  logoUrl?: string;
  brandSubtitle?: Localized;
  heroTitle?: Localized;
  heroSubtitle?: Localized;
  heroNote?: Localized;
  heroImage?: string;
  tagline: Localized;
  aboutShort: Localized;
  announcementBar: Localized;
  contactPhone: string;
  contactPhoneAlt: string;
  contactEmail: string;
  address: Localized;
  officeHours: Localized;
  admissionEmail: string;
  admissionsOpen: boolean;
  socials: { facebook?: string; instagram?: string; youtube?: string; whatsapp?: string };
  shippingFee: number;
  freeShippingAbove: number;
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  bankDetails?: Localized;
  shippingPolicy: Localized;
  paymentPolicy: Localized;
  cancellationPolicy: Localized;
  returnPolicy: Localized;
  mapEmbedUrl: string;
}

export interface PublicStats {
  programs: number;
  faculty: number;
  books: number;
  events: number;
}

export interface HomePayload {
  settings: PublicSettings;
  stats: PublicStats;
  programs: Program[];
  faculty: Teacher[];
  gallery: GalleryItem[];
  events: EventItem[];
  announcements: Announcement[];
  books: { items: Book[] };
  about: PageContent | null;
}

export interface Program {
  _id: string;
  slug: string;
  title: Localized;
  summary: Localized;
  description: Localized;
  duration?: string;
  ageGroup?: string;
  monthlyFeeNote?: string;
  image?: string;
  published: boolean;
  order?: number;
  createdAt?: string;
}

export interface Teacher {
  _id: string;
  teacherId?: string;
  name: string;
  qualifications?: string;
  phone?: string;
  email?: string;
  bio?: Localized;
  programs?: Array<{ _id: string; title?: Localized; slug?: string } | string>;
  classes?: string[];
  subjects?: string[];
  published?: boolean;
  demo?: boolean;
  user?: string | null;
}

export interface AcademicSession {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface SchoolClass {
  _id: string;
  name: string;
  section?: string;
  program?: { _id: string; title?: Localized; slug?: string } | string;
  session?: { _id: string; name?: string } | string;
  teacher?: { _id: string; name?: string } | string | null;
  capacity?: number;
  studentCount?: number;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  program?: string | { _id: string; title?: Localized };
  classes?: string[];
  published?: boolean;
}

export interface GalleryItem {
  _id: string;
  title?: Localized;
  alt?: Localized;
  image: string;
  category?: string;
  published?: boolean;
  order?: number;
}

export interface EventItem {
  _id: string;
  slug: string;
  title: Localized;
  description: Localized;
  startDate: string;
  endDate?: string | null;
  location?: Localized;
  image?: string;
  featured?: boolean;
  published?: boolean;
}

export interface Announcement {
  _id: string;
  title: Localized;
  body: Localized;
  category?: string;
  published?: boolean;
  publishDate?: string;
  pinned?: boolean;
  audience?: string[];
}

export interface Faq {
  _id: string;
  question: Localized;
  answer: Localized;
  category?: string;
  order?: number;
}

export interface PageContent {
  key: string;
  title: Localized;
  body: Localized;
  updatedAt?: string;
}

export interface BookCategory {
  id?: string;
  _id?: string;
  name: Localized;
  slug: string;
  order?: number;
  published?: boolean;
}

export interface Book {
  id: string;
  slug: string;
  title: Localized;
  author: string;
  translator?: string;
  description: Localized;
  language: "en" | "ur" | "ar";
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  category: { id: string; name: Localized | null; slug: string };
  sku: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: string;
  pages?: number | null;
  coverImage?: string;
  stock: number;
  lowStockThreshold: number;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  published: boolean;
  featured: boolean;
  archived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface BooksResponse {
  items: Book[];
  pagination: Pagination;
}

export interface OrderItem {
  bookId: string;
  title: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: "cod" | "bank_transfer";
  paymentStatus: string;
  fulfilmentStatus: string;
  createdAt: string;
  updatedAt?: string;
  statusHistory?: Array<{
    fulfilmentStatus?: string;
    paymentStatus?: string;
    note?: string;
    at?: string;
  }>;
}

export interface WhatsAppOrder {
  id: string;
  requestNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: "new" | "contacted" | "confirmed" | "closed";
  createdAt: string;
  updatedAt?: string;
  statusHistory?: Array<{
    status?: string;
    note?: string;
    at?: string;
  }>;
}

export interface WhatsAppOrderResponse {
  request: WhatsAppOrder;
  whatsappUrl: string;
}

export interface Admission {
  _id: string;
  reference: string;
  studentName: string;
  dob: string;
  gender?: string;
  guardianName: string;
  relationship?: string;
  phone: string;
  email?: string;
  address: string;
  previousEducation?: string;
  program?: { _id: string; title?: Localized; slug?: string } | string | null;
  session?: { _id: string; name?: string } | string | null;
  documents?: Array<{ filename: string; originalName: string; mimeType?: string; size?: number }>;
  status: string;
  reviewNotes?: string;
  statusHistory?: Array<{ status: string; note?: string; at?: string }>;
  linkedStudent?: { _id: string; studentId?: string; name?: string; status?: string } | string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Student {
  _id: string;
  studentId: string;
  name: string;
  dob?: string;
  gender?: string;
  address?: string;
  previousEducation?: string;
  guardian?: { name?: string; relationship?: string; phone?: string; email?: string };
  program?: { _id: string; title?: Localized; slug?: string } | string | null;
  class?: { _id: string; name?: string; section?: string } | string | null;
  session?: { _id: string; name?: string } | string | null;
  status: string;
  user?: { _id: string; name?: string; email?: string } | string | null;
  guardianUsers?: Array<{ _id: string; name?: string; email?: string; role?: string } | string>;
  createdAt?: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  student?: Student | string;
  session?: { _id: string; name?: string } | string | null;
  items: Array<{ title: string; amount: number }>;
  discount: number;
  fine: number;
  total: number;
  paid: number;
  balance: number;
  status: string;
  dueDate: string;
  notes?: string;
  createdAt?: string;
}

export interface Payment {
  _id: string;
  receiptNumber: string;
  invoice: string | Invoice;
  amount: number;
  method: "cash" | "bank_transfer";
  reference?: string;
  paidAt: string;
  isReversal?: boolean;
  note?: string;
}

export interface ExamSubject {
  subject: { _id: string; name: string; code?: string } | string;
  maxMarks: number;
  passMarks: number;
}

export interface Exam {
  _id: string;
  title: string;
  program?: { _id: string; title?: Localized } | string | null;
  class?: { _id: string; name?: string; section?: string } | string | null;
  session?: { _id: string; name?: string } | string | null;
  startDate: string;
  subjects: ExamSubject[];
  published: boolean;
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  body?: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
}

export interface ResultGroup {
  examId: string;
  title: string;
  date: string;
  subjects: Array<{
    name: string;
    code?: string;
    obtainedMarks: number;
    maxMarks: number;
    passMarks: number;
    grade: string;
    passed: boolean;
  }>;
  obtained: number;
  total: number;
  percentage: number;
  grade: string;
  passed: boolean;
}

export interface StudentPortalData {
  student: Student & { dob?: string; address?: string; guardian?: Record<string, string> };
  attendanceSummary: Record<string, number>;
  attendance: Array<{ id: string; date: string; status: string }>;
  invoices: Array<Invoice & { payments: Payment[] }>;
  fees: { total: number; paid: number; balance: number };
  results: ResultGroup[];
  admission?: { reference: string; status: string; updatedAt?: string } | null;
}

export interface PortalOverview {
  role: Role;
  data?: StudentPortalData;
  children?: StudentPortalData[];
  teacher?: Teacher & { qualifications?: string };
  classes?: SchoolClass[];
  exams?: Exam[];
  orders?: Order[];
  announcements: Announcement[];
  notifications: NotificationItem[];
}

export interface DashboardData {
  range: { from: string; to: string };
  students: { active: number };
  teachers: number;
  admissions: { pending: number };
  attendance: Record<string, number>;
  books: { lowStock: number };
  orders: { total: number; pending: number; revenue: number; cancelled: number };
  fees: {
    total: number;
    paid: number;
    outstanding: number;
    collectedInRange: number;
    transactions: number;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    fulfilmentStatus: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  recentAdmissions: Array<{
    _id: string;
    reference: string;
    studentName: string;
    status: string;
    createdAt: string;
  }>;
  upcomingEvents: EventItem[];
  upcomingExams: Exam[];
  lowStockBooks: Array<{ _id: string; title: Localized; sku: string; stock: number; lowStockThreshold: number }>;
  chart: Array<{ key: string; label: string; payments: number; orders: number; orderValue: number }>;
}

export interface CrudList<T> {
  items: T[];
  pagination?: Pagination;
}
