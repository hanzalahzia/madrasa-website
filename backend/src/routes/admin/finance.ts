import { Router } from "express";
import {
  FeeStructure,
  Invoice,
  Payment,
  Student
} from "../../models/index.js";
import { crudRouter } from "../../services/crud.js";
import { writeAudit } from "../../utils/audit.js";
import {
  ApiError,
  asyncHandler,
  parsePagination,
  paginationMeta,
  startOfDay,
  validateBody
} from "../../utils/http.js";
import { invoiceNumber, receiptNumber } from "../../utils/ids.js";
import {
  feeStructureSchema,
  generateInvoicesSchema,
  invoiceSchema,
  paymentSchema
} from "../../utils/schemas.js";

export const adminFinanceRouter = Router();

adminFinanceRouter.use(
  "/fee-structures",
  crudRouter({
    model: FeeStructure,
    entityName: "Fee structure",
    schema: feeStructureSchema,
    sort: { createdAt: -1 },
    searchFields: ["name"]
  })
);

async function markOverdue() {
  await Invoice.updateMany(
    {
      status: { $in: ["unpaid", "partial"] },
      balance: { $gt: 0 },
      dueDate: { $lt: startOfDay(new Date()) }
    },
    { $set: { status: "overdue" } }
  );
}

async function uniqueInvoiceNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = invoiceNumber();
    if (!(await Invoice.exists({ invoiceNumber: candidate }))) return candidate;
  }
  throw new ApiError(500, "Could not generate an invoice number.");
}

async function uniqueReceiptNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = receiptNumber();
    if (!(await Payment.exists({ receiptNumber: candidate }))) return candidate;
  }
  throw new ApiError(500, "Could not generate a receipt number.");
}

function statusFor(balance: number, paid: number, dueDate: Date): string {
  if (balance <= 0) return "paid";
  if (dueDate < startOfDay(new Date())) return "overdue";
  if (paid > 0) return "partial";
  return "unpaid";
}

adminFinanceRouter.get(
  "/invoices",
  asyncHandler(async (req, res) => {
    await markOverdue();
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.student) filter.student = String(req.query.student);
    const search = String(req.query.search || "").trim();
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const students = await Student.find({ name: pattern }).select("_id").lean();
      filter.$or = [
        { invoiceNumber: pattern },
        { student: { $in: students.map((student) => student._id) } }
      ];
    }
    const [items, total] = await Promise.all([
      Invoice.find(filter)
        .populate("student", "name studentId class")
        .populate("session", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter)
    ]);
    res.json({ items, pagination: paginationMeta(total, page, limit) });
  })
);

adminFinanceRouter.get(
  "/invoices/:id",
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id)
      .populate("student", "name studentId class guardian")
      .populate("session", "name")
      .lean();
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    const payments = await Payment.find({ invoice: invoice._id }).sort({ paidAt: -1 }).lean();
    res.json({ invoice, payments });
  })
);

adminFinanceRouter.post(
  "/invoices",
  validateBody(invoiceSchema),
  asyncHandler(async (req, res) => {
    const student = await Student.findById(req.body.studentId).lean();
    if (!student) throw new ApiError(404, "Student not found.");
    const itemsTotal = req.body.items.reduce((sum: number, item: any) => sum + item.amount, 0);
    const total = itemsTotal - req.body.discount + req.body.fine;
    if (total < 0) throw new ApiError(400, "Discount cannot exceed the invoice total.");
    const dueDate = startOfDay(req.body.dueDate);

    const invoice = await Invoice.create({
      invoiceNumber: await uniqueInvoiceNumber(),
      student: student._id,
      session: req.body.session || student.session,
      items: req.body.items,
      discount: req.body.discount,
      fine: req.body.fine,
      total,
      paid: 0,
      balance: total,
      status: statusFor(total, 0, dueDate),
      dueDate,
      notes: req.body.notes,
      createdBy: req.user!.id
    });
    await writeAudit(req, "invoice.create", "Invoice", String(invoice._id), { total });
    res.status(201).json(invoice);
  })
);

adminFinanceRouter.post(
  "/invoices/generate",
  validateBody(generateInvoicesSchema),
  asyncHandler(async (req, res) => {
    const structure = await FeeStructure.findById(req.body.feeStructureId).lean();
    if (!structure || !structure.active) throw new ApiError(404, "Active fee structure not found.");
    const studentFilter: Record<string, unknown> = { status: "active" };
    if (req.body.classId) studentFilter.class = req.body.classId;
    if (structure.program) studentFilter.program = structure.program;
    if (structure.session) studentFilter.session = structure.session;
    const students = await Student.find(studentFilter).lean();
    if (!students.length) throw new ApiError(404, "No matching active students were found.");

    const fallbackDue = structure.items.find((item: any) => item.dueDate)?.dueDate || new Date(Date.now() + 30 * 86400000);
    const dueDate = startOfDay(req.body.dueDate || fallbackDue);
    const total = structure.items.reduce((sum: number, item: any) => sum + item.amount, 0);
    const marker = `Generated from ${structure.name}`;
    let created = 0;
    let skipped = 0;

    for (const student of students) {
      const exists = await Invoice.exists({
        student: student._id,
        session: structure.session || student.session,
        notes: marker
      });
      if (exists) {
        skipped += 1;
        continue;
      }
      await Invoice.create({
        invoiceNumber: await uniqueInvoiceNumber(),
        student: student._id,
        session: structure.session || student.session,
        items: structure.items.map((item: any) => ({ title: item.title, amount: item.amount })),
        discount: 0,
        fine: 0,
        total,
        paid: 0,
        balance: total,
        status: statusFor(total, 0, dueDate),
        dueDate,
        notes: marker,
        createdBy: req.user!.id
      });
      created += 1;
    }
    await writeAudit(req, "invoice.generate", "FeeStructure", String(structure._id), { created, skipped });
    res.status(201).json({ created, skipped, totalStudents: students.length });
  })
);

adminFinanceRouter.post(
  "/payments",
  validateBody(paymentSchema),
  asyncHandler(async (req, res) => {
    const now = new Date();
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.body.invoiceId, balance: { $gte: req.body.amount } },
      [
        {
          $set: {
            paid: { $add: ["$paid", req.body.amount] },
            balance: { $subtract: ["$balance", req.body.amount] }
          }
        },
        {
          $set: {
            status: {
              $cond: [
                { $lte: ["$balance", 0] },
                "paid",
                {
                  $cond: [
                    { $lt: ["$dueDate", startOfDay(now)] },
                    "overdue",
                    "partial"
                  ]
                }
              ]
            }
          }
        }
      ],
      { new: true }
    );
    if (!invoice) {
      const exists = await Invoice.findById(req.body.invoiceId).lean();
      if (!exists) throw new ApiError(404, "Invoice not found.");
      throw new ApiError(400, "Payment exceeds the outstanding balance or the invoice is already paid.");
    }

    let payment;
    try {
      payment = await Payment.create({
        receiptNumber: await uniqueReceiptNumber(),
        invoice: invoice._id,
        student: invoice.student,
        amount: req.body.amount,
        method: req.body.method,
        reference: req.body.reference,
        paidAt: req.body.paidAt || now,
        recordedBy: req.user!.id,
        note: req.body.note
      });
    } catch (error) {
      await Invoice.updateOne(
        { _id: invoice._id },
        { $inc: { paid: -req.body.amount, balance: req.body.amount } }
      );
      throw error;
    }

    await writeAudit(req, "payment.record", "Invoice", String(invoice._id), {
      receiptNumber: payment.receiptNumber,
      amount: req.body.amount
    });
    res.status(201).json({ payment, invoice });
  })
);

adminFinanceRouter.post(
  "/payments/:id/reverse",
  asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id).lean();
    if (!payment) throw new ApiError(404, "Payment not found.");
    if (payment.isReversal) throw new ApiError(400, "A reversal entry cannot be reversed again.");
    if (await Payment.exists({ reversalOf: payment._id })) {
      throw new ApiError(409, "This payment has already been reversed.");
    }
    const invoice = await Invoice.findById(payment.invoice);
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    if (invoice.paid < payment.amount) {
      throw new ApiError(409, "The invoice state does not allow this reversal.");
    }

    const reversal = await Payment.create({
      receiptNumber: await uniqueReceiptNumber(),
      invoice: invoice._id,
      student: invoice.student,
      amount: -payment.amount,
      method: payment.method,
      reference: payment.reference,
      paidAt: new Date(),
      recordedBy: req.user!.id,
      isReversal: true,
      reversalOf: payment._id,
      note: String(req.body.note || "Payment reversal")
    });

    invoice.paid = Math.max(0, invoice.paid - payment.amount);
    invoice.balance = invoice.total - invoice.paid;
    invoice.status = statusFor(invoice.balance, invoice.paid, invoice.dueDate) as any;
    await invoice.save();

    await writeAudit(req, "payment.reverse", "Payment", String(payment._id), {
      reversalReceipt: reversal.receiptNumber,
      amount: payment.amount
    });
    res.status(201).json({ reversal, invoice });
  })
);

adminFinanceRouter.get(
  "/payments/:id/receipt",
  asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: "invoice",
        populate: { path: "student", select: "name studentId guardian address" }
      })
      .lean();
    if (!payment) throw new ApiError(404, "Payment not found.");
    res.json(payment);
  })
);

adminFinanceRouter.get(
  "/collections",
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : startOfDay(new Date());
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    to.setHours(23, 59, 59, 999);
    const payments = await Payment.find({ paidAt: { $gte: from, $lte: to } }).lean();
    const methods: Record<string, number> = { cash: 0, bank_transfer: 0 };
    let total = 0;
    for (const payment of payments) {
      methods[payment.method] = (methods[payment.method] || 0) + payment.amount;
      total += payment.amount;
    }
    const atRisk = await Invoice.aggregate([
      { $match: { balance: { $gt: 0 }, status: { $in: ["overdue", "partial", "unpaid"] } } },
      { $group: { _id: null, outstanding: { $sum: "$balance" }, count: { $sum: 1 } } }
    ]);
    res.json({
      from,
      to,
      total,
      methods,
      transactions: payments.length,
      outstanding: atRisk[0]?.outstanding || 0,
      outstandingInvoices: atRisk[0]?.count || 0
    });
  })
);
