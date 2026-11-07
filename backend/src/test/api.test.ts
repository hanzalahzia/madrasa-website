import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";
import { createApp } from "../app.js";
import { connectDB, disconnectDB } from "../config/db.js";
import {
  AcademicSession,
  Book,
  BookCategory,
  Notification,
  Program,
  SchoolClass,
  Student,
  Subject,
  Teacher,
  User
} from "../models/index.js";
import { hashPassword } from "../utils/auth.js";

let app: Express;
let adminAgent: ReturnType<typeof request.agent>;
let studentAgent: ReturnType<typeof request.agent>;
let teacherAgent: ReturnType<typeof request.agent>;

const password = "TestPass123!";
const ids: Record<string, string> = {};

async function login(agent: ReturnType<typeof request.agent>, email: string) {
  const response = await agent.post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
}

beforeAll(async () => {
  await connectDB();
  app = createApp();

  const admin = await User.create({
    name: "Test Administrator",
    email: "admin@test.local",
    passwordHash: await hashPassword(password),
    role: "super_admin"
  });
  const teacherUser = await User.create({
    name: "Test Teacher",
    email: "teacher@test.local",
    passwordHash: await hashPassword(password),
    role: "teacher"
  });
  const studentUser = await User.create({
    name: "Test Student",
    email: "student@test.local",
    passwordHash: await hashPassword(password),
    role: "student"
  });

  const program = await Program.create({
    slug: "test-program",
    title: { en: "Test Program", ur: "", ar: "" },
    summary: { en: "Summary", ur: "", ar: "" },
    description: { en: "Description", ur: "", ar: "" },
    published: true
  });
  const session = await AcademicSession.create({
    name: "2026-2027",
    startDate: new Date("2026-04-01"),
    endDate: new Date("2027-03-31"),
    isActive: true
  });
  const schoolClass = await SchoolClass.create({
    name: "Grade One",
    section: "A",
    program: program._id,
    session: session._id
  });
  const subject = await Subject.create({
    name: "Quran",
    code: "QUR-1",
    program: program._id,
    classes: [schoolClass._id],
    published: true
  });
  const teacher = await Teacher.create({
    teacherId: "T-100",
    name: "Test Teacher",
    user: teacherUser._id,
    programs: [program._id],
    classes: [schoolClass._id],
    subjects: [subject._id],
    published: true
  });
  schoolClass.teacher = teacher._id;
  await schoolClass.save();

  const student = await Student.create({
    studentId: "S-100",
    name: "Test Student",
    user: studentUser._id,
    program: program._id,
    class: schoolClass._id,
    session: session._id,
    status: "active",
    guardian: { name: "Test Guardian", relationship: "Father", phone: "03001234567", email: "" }
  });

  const category = await BookCategory.create({
    name: { en: "Test Category", ur: "", ar: "" },
    slug: "test-category",
    published: true
  });
  const book = await Book.create({
    slug: "test-book",
    title: { en: "Test Book", ur: "", ar: "" },
    author: "Test Author",
    description: { en: "A test book", ur: "", ar: "" },
    category: category._id,
    language: "en",
    price: 1200,
    salePrice: 1000,
    sku: "BOOK-1",
    stock: 10,
    lowStockThreshold: 2,
    published: true
  });

  const unreadNotification = await Notification.create({
    user: admin._id,
    title: "Admission received",
    body: "A new application is awaiting review.",
    link: "/admin/admissions"
  });
  await Notification.create({
    user: admin._id,
    title: "Payment received",
    body: "A fee payment was recorded.",
    readAt: new Date()
  });

  Object.assign(ids, {
    admin: String(admin._id),
    notification: String(unreadNotification._id),
    program: String(program._id),
    session: String(session._id),
    class: String(schoolClass._id),
    subject: String(subject._id),
    student: String(student._id),
    book: String(book._id)
  });

  adminAgent = request.agent(app);
  teacherAgent = request.agent(app);
  studentAgent = request.agent(app);
  await Promise.all([
    login(adminAgent, "admin@test.local"),
    login(teacherAgent, "teacher@test.local"),
    login(studentAgent, "student@test.local")
  ]);
}, 60_000);

afterAll(async () => {
  await disconnectDB();
  const dbPath = process.env.IN_MEMORY_DB_PATH;
  if (dbPath) fs.rmSync(path.resolve(process.cwd(), dbPath), { recursive: true, force: true });
});

describe("public API and security", () => {
  it("reports health and public settings", async () => {
    const health = await request(app).get("/api/health");
    expect(health.status).toBe(200);
    expect(health.body.status).toBe("ok");

    const settings = await request(app).get("/api/public/settings");
    expect(settings.status).toBe(200);
    expect(settings.body.siteName).toBeTruthy();
    expect(settings.body.bankDetails).toBeUndefined();
  });

  it("serves the public catalogue and hides unpublished content", async () => {
    const books = await request(app).get("/api/public/books?search=Test");
    expect(books.status).toBe(200);
    expect(books.body.items).toHaveLength(1);
    expect(books.body.items[0].salePrice).toBe(1000);
    expect(books.body.items[0].stock).toBe(10);

    const programs = await request(app).get("/api/public/programs");
    expect(programs.status).toBe(200);
    expect(programs.body.some((program: { slug: string }) => program.slug === "test-program")).toBe(true);

    const detail = await request(app).get("/api/public/books/test-book");
    expect(detail.status).toBe(200);
    expect(detail.body.slug).toBe("test-book");
  });

  it("enforces authentication and administrator roles", async () => {
    const anonymous = await request(app).get("/api/admin/dashboard");
    expect(anonymous.status).toBe(401);

    const student = await studentAgent.get("/api/admin/dashboard");
    expect(student.status).toBe(403);

    const admin = await adminAgent.get("/api/admin/dashboard");
    expect(admin.status).toBe(200);
    expect(admin.body.students.active).toBe(1);
  });

  it("serves every administrator collection endpoint without route shadowing", async () => {
    const endpoints = [
      "/api/admin/dashboard",
      "/api/admin/admissions",
      "/api/admin/sessions",
      "/api/admin/classes",
      "/api/admin/subjects",
      "/api/admin/exams",
      `/api/admin/attendance?classId=${ids.class}&date=2026-10-20`,
      "/api/admin/results",
      "/api/admin/fee-structures",
      "/api/admin/invoices",
      "/api/admin/collections",
      "/api/admin/books",
      "/api/admin/book-categories",
      "/api/admin/inventory-movements",
      "/api/admin/orders",
      "/api/admin/whatsapp-orders",
      "/api/admin/students",
      "/api/admin/guardians",
      "/api/admin/programs",
      "/api/admin/faculty",
      "/api/admin/announcements",
      "/api/admin/events",
      "/api/admin/gallery",
      "/api/admin/faqs",
      "/api/admin/pages",
      "/api/admin/messages",
      "/api/admin/users",
      "/api/admin/settings",
      "/api/admin/audit-logs",
      "/api/admin/notifications"
    ];
    for (const endpoint of endpoints) {
      const response = await adminAgent.get(endpoint);
      expect(response.status, endpoint).toBe(200);
    }
  });

  it("lists, reads and bulk-reads administrator notifications", async () => {
    const list = await adminAgent.get("/api/admin/notifications");
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(2);

    const read = await adminAgent.patch(`/api/admin/notifications/${ids.notification}/read`);
    expect(read.status).toBe(200);
    expect(read.body.readAt).toBeTruthy();

    await Notification.create({
      user: ids.admin,
      title: "New message",
      body: "A contact enquiry was received.",
      link: "/admin/messages"
    });
    const readAll = await adminAgent.patch("/api/admin/notifications/read-all");
    expect(readAll.status).toBe(200);
    expect(readAll.body.updated).toBe(1);

    const after = await adminAgent.get("/api/admin/notifications");
    expect(after.body.items.every((item: { readAt?: string | null }) => Boolean(item.readAt))).toBe(true);
  });

  it("creates, publishes and deletes a program with audit logging", async () => {
    const created = await adminAgent.post("/api/admin/programs").send({
      slug: "crud-program",
      title: { en: "CRUD Program", ur: "", ar: "" },
      summary: { en: "Summary", ur: "", ar: "" },
      description: { en: "Description", ur: "", ar: "" },
      published: false
    });
    expect(created.status).toBe(201);
    const programId = created.body._id;

    const hidden = await request(app).get("/api/public/programs");
    expect(hidden.body.some((program: { slug: string }) => program.slug === "crud-program")).toBe(false);

    const updated = await adminAgent.put(`/api/admin/programs/${programId}`).send({
      slug: "crud-program",
      title: { en: "CRUD Program", ur: "", ar: "" },
      summary: { en: "Summary", ur: "", ar: "" },
      description: { en: "Description", ur: "", ar: "" },
      published: true,
      duration: "One year"
    });
    expect(updated.status).toBe(200);
    expect(updated.body.published).toBe(true);

    const visible = await request(app).get("/api/public/programs/crud-program");
    expect(visible.status).toBe(200);
    expect(visible.body.duration).toBe("One year");

    const audit = await adminAgent.get("/api/admin/audit-logs?entity=Program");
    expect(audit.status).toBe(200);
    expect(audit.body.items.some((entry: { action: string }) => entry.action.includes("program"))).toBe(true);

    const removed = await adminAgent.delete(`/api/admin/programs/${programId}`);
    expect(removed.status).toBe(200);
  });
});

describe("admissions", () => {
  it("accepts a public application, tracks it, and approves it into a student record", async () => {
    const created = await request(app)
      .post("/api/public/admissions")
      .field("studentName", "Applicant Child")
      .field("dob", "2014-06-15")
      .field("guardianName", "Applicant Guardian")
      .field("phone", "03009876543")
      .field("address", "House 1, Test Street, Lahore")
      .field("program", ids.program)
      .field("additionalFields", "{}");
    expect(created.status).toBe(201);
    expect(created.body.reference).toMatch(/^MMU-ADM-/);
    expect(created.body.trackingPin).toMatch(/^\d{6}$/);

    const wrongPin = await request(app).post("/api/public/admissions/track").send({
      reference: created.body.reference,
      pin: "000000"
    });
    expect(wrongPin.status).toBe(404);

    const tracked = await request(app).post("/api/public/admissions/track").send({
      reference: created.body.reference,
      pin: created.body.trackingPin
    });
    expect(tracked.status).toBe(200);
    expect(tracked.body.status).toBe("submitted");

    const list = await adminAgent.get("/api/admin/admissions?status=submitted");
    expect(list.status).toBe(200);
    const application = list.body.items.find(
      (entry: { reference: string }) => entry.reference === created.body.reference
    );
    expect(application).toBeTruthy();

    const approved = await adminAgent
      .post(`/api/admin/admissions/${application._id}/approve`)
      .send({ note: "Approved in test" });
    expect(approved.status).toBe(200);
    expect(approved.body.admission.status).toBe("approved");
    expect(approved.body.student.studentId).toBeTruthy();

    const students = await adminAgent.get("/api/admin/students?search=Applicant%20Child");
    expect(students.status).toBe(200);
    expect(students.body.items).toHaveLength(1);
  });
});

describe("bookstore orders", () => {
  it("places an order, protects its confirmation link, and restores stock on cancellation", async () => {
    const placed = await request(app).post("/api/public/orders").send({
      items: [{ bookId: ids.book, quantity: 2 }],
      customerName: "Test Buyer",
      phone: "03001112223",
      address: "House 2, Test Road",
      city: "Lahore",
      paymentMethod: "cod"
    });
    expect(placed.status).toBe(201);
    expect(placed.body.order.subtotal).toBe(2000);
    expect(placed.body.order.total).toBe(2250);
    expect(placed.body.order.shipping).toBe(250);
    expect(placed.body.accessToken).toBeTruthy();

    const bookAfterOrder = await Book.findById(ids.book).lean();
    expect(bookAfterOrder?.stock).toBe(8);

    const forbidden = await request(app).get(`/api/public/orders/${placed.body.order.orderNumber}`);
    expect(forbidden.status).toBe(403);

    const tracked = await request(app).get(
      `/api/public/orders/${placed.body.order.orderNumber}?token=${placed.body.accessToken}`
    );
    expect(tracked.status).toBe(200);
    expect(tracked.body.orderNumber).toBe(placed.body.order.orderNumber);

    const cancelled = await adminAgent
      .patch(`/api/admin/orders/${placed.body.order.id}`)
      .send({ fulfilmentStatus: "cancelled", note: "Cancelled in test" });
    expect(cancelled.status).toBe(200);

    const bookAfterCancel = await Book.findById(ids.book).lean();
    expect(bookAfterCancel?.stock).toBe(10);

    const reopen = await adminAgent
      .patch(`/api/admin/orders/${placed.body.order.id}`)
      .send({ fulfilmentStatus: "processing" });
    expect(reopen.status).toBe(409);
  });
});

describe("WhatsApp book orders", () => {
  it("saves a WhatsApp order request, returns a wa.me link, and lets the admin follow up", async () => {
    const created = await request(app).post("/api/public/whatsapp-orders").send({
      items: [{ bookId: ids.book, quantity: 1 }],
      customerName: "WhatsApp Buyer",
      phone: "03005556667",
      email: "buyer@example.com",
      address: "House 3, Test Street",
      city: "Lahore",
      notes: "Please confirm delivery time."
    });
    expect(created.status).toBe(201);
    expect(created.body.request.requestNumber).toMatch(/^MMU-WA-/);
    expect(created.body.request.total).toBe(1250);
    expect(created.body.whatsappUrl).toContain("https://wa.me/923343595001");
    expect(decodeURIComponent(created.body.whatsappUrl.replace(/\+/g, "%20"))).toContain("WhatsApp Buyer");

    const bookAfterRequest = await Book.findById(ids.book).lean();
    expect(bookAfterRequest?.stock).toBe(10);

    const list = await adminAgent.get("/api/admin/whatsapp-orders");
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].requestNumber).toBe(created.body.request.requestNumber);

    const updated = await adminAgent
      .patch(`/api/admin/whatsapp-orders/${created.body.request.id}`)
      .send({ status: "contacted", note: "Messaged customer on WhatsApp." });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe("contacted");
    expect(updated.body.statusHistory).toHaveLength(2);
  });

  it("rejects quantities above available stock without reserving inventory", async () => {
    const response = await request(app).post("/api/public/whatsapp-orders").send({
      items: [{ bookId: ids.book, quantity: 11 }],
      customerName: "WhatsApp Buyer",
      phone: "03005556667"
    });
    expect(response.status).toBe(409);
    const bookAfter = await Book.findById(ids.book).lean();
    expect(bookAfter?.stock).toBe(10);
  });
});

describe("finance and portal", () => {
  it("records a partial payment and exposes it to the student portal", async () => {
    const invoiceResponse = await adminAgent.post("/api/admin/invoices").send({
      studentId: ids.student,
      session: ids.session,
      items: [{ title: "Tuition", amount: 1000 }],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString()
    });
    expect(invoiceResponse.status).toBe(201);
    expect(invoiceResponse.body.total).toBe(1000);
    expect(invoiceResponse.body.status).toBe("unpaid");

    const paymentResponse = await adminAgent.post("/api/admin/payments").send({
      invoiceId: invoiceResponse.body._id,
      amount: 400,
      method: "cash",
      note: "Part payment"
    });
    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.invoice.status).toBe("partial");
    expect(paymentResponse.body.invoice.balance).toBe(600);

    const overview = await studentAgent.get("/api/portal/overview");
    expect(overview.status).toBe(200);
    expect(overview.body.role).toBe("student");
    expect(overview.body.data.fees.balance).toBe(600);
    expect(overview.body.data.invoices[0].payments).toHaveLength(1);

    const reversed = await adminAgent.post(
      `/api/admin/payments/${paymentResponse.body.payment._id}/reverse`
    );
    expect(reversed.status).toBe(201);
    expect(reversed.body.invoice.balance).toBe(1000);
    expect(reversed.body.invoice.paid).toBe(0);
  });

  it("lets an assigned teacher mark attendance and correct it", async () => {
    const date = "2026-10-20";
    const roster = await teacherAgent.get(
      `/api/portal/teacher/attendance?classId=${ids.class}&date=${date}`
    );
    expect(roster.status).toBe(200);
    expect(roster.body.students).toHaveLength(1);

    const saved = await teacherAgent.post("/api/portal/teacher/attendance").send({
      classId: ids.class,
      date,
      records: [{ studentId: ids.student, status: "present" }]
    });
    expect(saved.status).toBe(200);
    expect(saved.body.created).toBe(1);

    const corrected = await teacherAgent.post("/api/portal/teacher/attendance").send({
      classId: ids.class,
      date,
      records: [{ studentId: ids.student, status: "late" }],
      reason: "Arrived late"
    });
    expect(corrected.status).toBe(200);
    expect(corrected.body.corrected).toBe(1);

    const overview = await studentAgent.get("/api/portal/overview");
    expect(overview.status).toBe(200);
    expect(overview.body.data.attendanceSummary.late).toBe(1);
  });

  it("prevents teachers from accessing administrator endpoints", async () => {
    const response = await teacherAgent.get("/api/admin/users");
    expect(response.status).toBe(403);
  });
});
