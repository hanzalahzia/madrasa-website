import { Router } from "express";
import { z } from "zod";
import {
  Admission,
  Attendance,
  AuditLog,
  Book,
  Event,
  Exam,
  Invoice,
  Notification,
  Order,
  Payment,
  Student,
  Teacher,
  User
} from "../../models/index.js";
import {
  imageUpload,
  uploadResponse,
  verifyImageContent
} from "../../middleware/uploads.js";
import { writeAudit } from "../../utils/audit.js";
import { hashPassword } from "../../utils/auth.js";
import { ApiError, asyncHandler, startOfDay, validateBody } from "../../utils/http.js";
import { passwordSchema, userCreateSchema } from "../../utils/schemas.js";

export const adminSystemRouter = Router();

adminSystemRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = req.query.to ? new Date(String(req.query.to)) : now;
    to.setHours(23, 59, 59, 999);
    const today = startOfDay(now);

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [
      activeStudents,
      teachers,
      pendingAdmissions,
      attendanceToday,
      booksLowStock,
      orderStats,
      feeStats,
      paymentsInRange,
      recentOrders,
      recentAdmissions,
      upcomingEvents,
      upcomingExams,
      lowStockBooks,
      monthlyPayments,
      monthlyOrders
    ] = await Promise.all([
      Student.countDocuments({ status: "active" }),
      Teacher.countDocuments({}),
      Admission.countDocuments({ status: { $in: ["submitted", "under_review"] } }),
      Attendance.aggregate([
        { $match: { date: today } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Book.countDocuments({
        $expr: { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] }] },
        archived: false
      }),
      Order.aggregate([
        { $group: { _id: "$fulfilmentStatus", count: { $sum: 1 }, total: { $sum: "$total" } } }
      ]),
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
            paid: { $sum: "$paid" },
            balance: { $sum: "$balance" }
          }
        }
      ]),
      Payment.aggregate([
        { $match: { paidAt: { $gte: from, $lte: to } } },
        { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } }
      ]),
      Order.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      Admission.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      Event.find({ published: true, startDate: { $gte: now } }).sort({ startDate: 1 }).limit(5).lean(),
      Exam.find({ startDate: { $gte: now } }).sort({ startDate: 1 }).limit(5).lean(),
      Book.find({
        published: true,
        archived: false,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] }
      })
        .sort({ stock: 1 })
        .limit(6)
        .select("title sku stock lowStockThreshold")
        .lean(),
      Payment.aggregate([
        { $match: { paidAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
            amount: { $sum: "$amount" }
          }
        }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, fulfilmentStatus: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
            total: { $sum: "$total" }
          }
        }
      ])
    ]);

    const attendance: Record<string, number> = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const entry of attendanceToday) attendance[entry._id] = entry.count;

    const orders = {
      total: 0,
      pending: 0,
      revenue: 0,
      cancelled: 0
    };
    for (const entry of orderStats) {
      orders.total += entry.count;
      if (["pending", "confirmed", "processing"].includes(entry._id)) orders.pending += entry.count;
      if (entry._id === "cancelled") orders.cancelled += entry.count;
      if (entry._id !== "cancelled") orders.revenue += entry.total;
    }

    const fee = feeStats[0] || { total: 0, paid: 0, balance: 0 };
    const inRange = paymentsInRange[0] || { amount: 0, count: 0 };

    const months: { key: string; label: string; payments: number; orders: number; orderValue: number }[] = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const paymentEntry = monthlyPayments.find((entry) => entry._id === key);
      const orderEntry = monthlyOrders.find((entry) => entry._id === key);
      months.push({
        key,
        label: date.toLocaleString("en", { month: "short" }),
        payments: paymentEntry?.amount || 0,
        orders: orderEntry?.count || 0,
        orderValue: orderEntry?.total || 0
      });
    }

    res.json({
      range: { from, to },
      students: { active: activeStudents },
      teachers,
      admissions: { pending: pendingAdmissions },
      attendance,
      books: { lowStock: booksLowStock },
      orders,
      fees: { total: fee.total, paid: fee.paid, outstanding: fee.balance, collectedInRange: inRange.amount, transactions: inRange.count },
      recentOrders,
      recentAdmissions,
      upcomingEvents,
      upcomingExams,
      lowStockBooks,
      chart: months
    });
  })
);

adminSystemRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.role) filter.role = String(req.query.role);
    const search = String(req.query.search || req.query.q || "").trim();
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: pattern }, { email: pattern }];
    }
    const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).limit(500).lean();
    res.json({ items: users });
  })
);

adminSystemRouter.post(
  "/users",
  validateBody(userCreateSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    if (await User.exists({ email })) throw new ApiError(409, "An account with this email already exists.");
    const user = await User.create({
      name: req.body.name,
      email,
      phone: req.body.phone,
      role: req.body.role,
      passwordHash: await hashPassword(req.body.password)
    });
    await writeAudit(req, "user.create", "User", String(user._id), { role: user.role });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive }
    });
  })
);

const userUpdateSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  phone: z.string().max(40).optional(),
  role: z.enum(["super_admin", "teacher", "student", "guardian", "customer"]).optional(),
  isActive: z.boolean().optional()
});

adminSystemRouter.patch(
  "/users/:id",
  validateBody(userUpdateSchema),
  asyncHandler(async (req, res) => {
    if (String(req.user!.id) === req.params.id) {
      if (req.body.isActive === false) throw new ApiError(400, "You cannot deactivate your own account.");
      if (req.body.role && req.body.role !== "super_admin") {
        throw new ApiError(400, "You cannot remove your own administrator role.");
      }
    }
    const target = await User.findById(req.params.id);
    if (!target) throw new ApiError(404, "User not found.");
    if (target.role === "super_admin" && (req.body.role && req.body.role !== "super_admin" || req.body.isActive === false)) {
      const activeAdmins = await User.countDocuments({ role: "super_admin", isActive: true });
      if (activeAdmins <= 1) throw new ApiError(409, "At least one active administrator is required.");
    }
    Object.assign(target, req.body);
    await target.save();
    await writeAudit(req, "user.update", "User", String(target._id), {
      role: target.role,
      isActive: target.isActive
    });
    res.json({
      user: {
        id: target._id,
        name: target.name,
        email: target.email,
        role: target.role,
        isActive: target.isActive
      }
    });
  })
);

adminSystemRouter.post(
  "/users/:id/reset-password",
  validateBody(z.object({ password: passwordSchema })),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found.");
    user.passwordHash = await hashPassword(req.body.password);
    user.passwordChangedAt = new Date();
    await user.save();
    await writeAudit(req, "user.password_reset", "User", String(user._id));
    res.json({ message: "Password reset." });
  })
);

adminSystemRouter.get(
  "/audit-logs",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.entity) filter.entity = String(req.query.entity);
    if (req.query.action) filter.action = String(req.query.action);
    const logs = await AuditLog.find(filter)
      .populate("actor", "name email")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    res.json({ items: logs });
  })
);

adminSystemRouter.post(
  "/uploads",
  imageUpload.single("file"),
  verifyImageContent,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Choose an image to upload.");
    await writeAudit(req, "upload.image", "Upload", req.file.filename);
    res.status(201).json(uploadResponse(req.file));
  })
);

adminSystemRouter.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const items = await Notification.find({ user: req.user!.id }).sort({ createdAt: -1 }).limit(30).lean();
    res.json({ items });
  })
);

adminSystemRouter.patch(
  "/notifications/read-all",
  asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
      { user: req.user!.id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ updated: result.modifiedCount });
  })
);

adminSystemRouter.patch(
  "/notifications/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.id },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notification) throw new ApiError(404, "Notification not found.");
    res.json(notification);
  })
);
