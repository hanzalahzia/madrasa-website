import mongoose from "mongoose";
import { Router } from "express";
import {
  Admission,
  Announcement,
  Attendance,
  Exam,
  Invoice,
  Notification,
  Order,
  Payment,
  Result,
  SchoolClass,
  Student,
  Teacher
} from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/auth.js";
import { writeAudit } from "../utils/audit.js";
import {
  ApiError,
  asyncHandler,
  parseDate,
  startOfDay,
  validateBody
} from "../utils/http.js";
import { gradeFor } from "../utils/ids.js";
import { attendanceSchema, marksSchema } from "../utils/schemas.js";
import { shapeOrder } from "../utils/shapes.js";

export const portalRouter = Router();

portalRouter.use(requireAuth);

async function announcementsFor(audience: string) {
  return Announcement.find({
    published: true,
    $or: [{ audience: "public" }, { audience }, { audience: { $size: 0 } }]
  })
    .sort({ pinned: -1, publishDate: -1 })
    .limit(10)
    .lean();
}

async function buildStudentPortal(studentId: string) {
  const student = await Student.findById(studentId)
    .populate("program", "title slug")
    .populate("class", "name section")
    .populate("session", "name")
    .lean();
  if (!student) throw new ApiError(404, "Student record not found.");

  const [attendance, invoices, results, admission] = await Promise.all([
    Attendance.find({ student: student._id }).sort({ date: -1 }).limit(60).lean(),
    Invoice.find({ student: student._id }).sort({ createdAt: -1 }).limit(50).lean(),
    Result.find({ student: student._id })
      .populate("exam")
      .populate("subject", "name code")
      .lean(),
    student.admission
      ? Admission.findById(student.admission).select("reference status updatedAt").lean()
      : null
  ]);

  const invoiceIds = invoices.map((invoice) => invoice._id);
  const payments = invoiceIds.length
    ? await Payment.find({ invoice: { $in: invoiceIds } }).sort({ paidAt: -1 }).lean()
    : [];
  const paymentsByInvoice = new Map<string, any[]>();
  for (const payment of payments) {
    const key = String(payment.invoice);
    if (!paymentsByInvoice.has(key)) paymentsByInvoice.set(key, []);
    paymentsByInvoice.get(key)!.push(payment);
  }

  const attendanceSummary: Record<string, number> = { present: 0, absent: 0, late: 0, leave: 0 };
  for (const record of attendance) {
    attendanceSummary[record.status] = (attendanceSummary[record.status] || 0) + 1;
  }

  const publishedResults = results.filter((result) => (result.exam as any)?.published);
  const grouped = new Map<string, any>();
  for (const result of publishedResults) {
    const exam: any = result.exam;
    const key = String(exam._id);
    if (!grouped.has(key)) {
      grouped.set(key, {
        examId: key,
        title: exam.title,
        date: exam.startDate,
        subjects: [],
        obtained: 0,
        total: 0
      });
    }
    const entry = grouped.get(key)!;
    const examSubject = (exam.subjects || []).find(
      (subject: any) => String(subject.subject) === String((result.subject as any)?._id || result.subject)
    );
    const maxMarks = examSubject?.maxMarks || result.maxMarks;
    const passMarks = examSubject?.passMarks || 0;
    entry.subjects.push({
      name: (result.subject as any)?.name || "Subject",
      code: (result.subject as any)?.code || "",
      obtainedMarks: result.obtainedMarks,
      maxMarks,
      passMarks,
      grade: result.grade,
      passed: result.obtainedMarks >= passMarks
    });
    entry.obtained += result.obtainedMarks;
    entry.total += maxMarks;
  }
  const resultGroups = Array.from(grouped.values()).map((entry) => ({
    ...entry,
    percentage: entry.total ? Math.round((entry.obtained / entry.total) * 1000) / 10 : 0,
    grade: entry.total ? gradeFor((entry.obtained / entry.total) * 100) : "-",
    passed: entry.subjects.every((subject: any) => subject.passed)
  }));

  const fees = invoices.reduce(
    (summary, invoice) => {
      summary.total += invoice.total;
      summary.paid += invoice.paid;
      summary.balance += invoice.balance;
      return summary;
    },
    { total: 0, paid: 0, balance: 0 }
  );

  return {
    student,
    attendanceSummary,
    attendance: attendance.map((record) => ({
      id: record._id,
      date: record.date,
      status: record.status
    })),
    invoices: invoices.map((invoice) => ({
      id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      items: invoice.items,
      discount: invoice.discount,
      fine: invoice.fine,
      total: invoice.total,
      paid: invoice.paid,
      balance: invoice.balance,
      status: invoice.status,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      payments: paymentsByInvoice.get(String(invoice._id)) || []
    })),
    fees,
    results: resultGroups,
    admission
  };
}

async function teacherClassIds(teacher: any): Promise<string[]> {
  const classes = await SchoolClass.find({
    $or: [{ _id: { $in: teacher.classes || [] } }, { teacher: teacher._id }]
  })
    .select("_id")
    .lean();
  return classes.map((entry) => String(entry._id));
}

portalRouter.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (req.user!.role === "student") {
      const student = await Student.findOne({ user: req.user!.id }).lean();
      if (!student) throw new ApiError(404, "No student profile is linked to this account.");
      res.json({
        role: "student",
        data: await buildStudentPortal(String(student._id)),
        announcements: await announcementsFor("students"),
        notifications
      });
      return;
    }

    if (req.user!.role === "guardian") {
      const children = await Student.find({ guardianUsers: req.user!.id }).select("_id name").lean();
      const data = [];
      for (const child of children) {
        data.push(await buildStudentPortal(String(child._id)));
      }
      res.json({
        role: "guardian",
        children: data,
        announcements: await announcementsFor("guardians"),
        notifications
      });
      return;
    }

    if (req.user!.role === "teacher") {
      const teacher = await Teacher.findOne({ user: req.user!.id })
        .populate("programs", "title slug")
        .populate("subjects", "name code")
        .lean();
      if (!teacher) throw new ApiError(404, "No teacher profile is linked to this account.");
      const classIds = await teacherClassIds(teacher);
      const [classes, exams] = await Promise.all([
        SchoolClass.find({ _id: { $in: classIds } })
          .populate("program", "title")
          .populate("session", "name")
          .lean(),
        Exam.find({
          $or: [
            { class: { $in: classIds } },
            {
              program: {
                $in: (teacher.programs || []).map((program: any) => program._id || program)
              }
            }
          ]
        })
          .populate("class", "name section")
          .populate("subjects.subject", "name code")
          .sort({ startDate: -1 })
          .lean()
      ]);
      const studentCounts = await Student.aggregate([
        { $match: { class: { $in: classIds.map((id) => new mongoose.Types.ObjectId(id)) }, status: "active" } },
        { $group: { _id: "$class", count: { $sum: 1 } } }
      ]);
      const countMap = new Map(studentCounts.map((entry: any) => [String(entry._id), entry.count]));
      res.json({
        role: "teacher",
        teacher,
        classes: classes.map((entry: any) => ({
          ...entry,
          studentCount: countMap.get(String(entry._id)) || 0
        })),
        exams,
        announcements: await announcementsFor("teachers"),
        notifications
      });
      return;
    }

    if (req.user!.role === "customer") {
      const orders = await Order.find({ user: req.user!.id }).sort({ createdAt: -1 }).lean();
      res.json({
        role: "customer",
        orders: orders.map((order) => shapeOrder(order)),
        announcements: await announcementsFor("public"),
        notifications
      });
      return;
    }

    throw new ApiError(403, "Use the administration dashboard for this account.");
  })
);

portalRouter.get(
  "/teacher/attendance",
  requireRole("teacher"),
  asyncHandler(async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user!.id }).lean();
    if (!teacher) throw new ApiError(404, "Teacher profile not found.");
    const classIds = await teacherClassIds(teacher);
    const classId = String(req.query.classId || "");
    if (!classIds.includes(classId)) throw new ApiError(403, "This class is not assigned to you.");
    const date = startOfDay(parseDate(req.query.date || new Date()));
    const [schoolClass, students, records] = await Promise.all([
      SchoolClass.findById(classId).populate("program", "title").lean(),
      Student.find({ class: classId, status: "active" }).sort({ name: 1 }).select("name studentId").lean(),
      Attendance.find({ class: classId, date }).lean()
    ]);
    const byStudent = new Map(records.map((record) => [String(record.student), record]));
    res.json({
      class: schoolClass,
      date,
      students: students.map((student) => {
        const record: any = byStudent.get(String(student._id));
        return {
          id: String(student._id),
          name: student.name,
          studentId: student.studentId,
          status: record?.status || "",
          recordId: record?._id || null
        };
      })
    });
  })
);

portalRouter.post(
  "/teacher/attendance",
  requireRole("teacher"),
  validateBody(attendanceSchema),
  asyncHandler(async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user!.id }).lean();
    if (!teacher) throw new ApiError(404, "Teacher profile not found.");
    const classIds = await teacherClassIds(teacher);
    if (!classIds.includes(String(req.body.classId))) {
      throw new ApiError(403, "This class is not assigned to you.");
    }
    const day = startOfDay(req.body.date);
    const students = await Student.find({
      _id: { $in: req.body.records.map((record: any) => record.studentId) },
      class: req.body.classId,
      status: "active"
    })
      .select("_id name")
      .lean();
    if (students.length !== req.body.records.length) {
      throw new ApiError(400, "One or more students are not in this class.");
    }

    let created = 0;
    let corrected = 0;
    for (const record of req.body.records) {
      const existing = await Attendance.findOne({
        student: record.studentId,
        class: req.body.classId,
        date: day
      });
      if (!existing) {
        await Attendance.create({
          student: record.studentId,
          class: req.body.classId,
          date: day,
          status: record.status,
          markedBy: req.user!.id
        });
        created += 1;
      } else if (existing.status !== record.status) {
        existing.corrections.push({
          previousStatus: existing.status,
          newStatus: record.status,
          reason: req.body.reason || "Attendance corrected by teacher.",
          by: req.user!.id,
          at: new Date()
        });
        existing.status = record.status;
        await existing.save();
        corrected += 1;
      }
    }
    await writeAudit(req, "teacher.attendance_save", "Attendance", String(req.body.classId), {
      date: day.toISOString(),
      created,
      corrected
    });
    res.json({ message: "Attendance saved.", created, corrected });
  })
);

portalRouter.get(
  "/teacher/exams/:id/marks",
  requireRole("teacher"),
  asyncHandler(async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user!.id })
      .populate("subjects", "name code")
      .lean();
    if (!teacher) throw new ApiError(404, "Teacher profile not found.");
    const classIds = await teacherClassIds(teacher);
    const exam = await Exam.findById(req.params.id).populate("subjects.subject", "name code").lean();
    if (!exam) throw new ApiError(404, "Exam not found.");
    const assigned = classIds.includes(String(exam.class)) || (teacher.programs || []).some((program: any) => String(program) === String(exam.program));
    if (!assigned) throw new ApiError(403, "This exam is not assigned to you.");
    const subjectId = String(req.query.subjectId || "");
    const examSubject = (exam.subjects || []).find(
      (entry: any) => String(entry.subject?._id || entry.subject) === subjectId
    );
    if (!examSubject) throw new ApiError(400, "This subject is not part of the selected exam.");
    if (
      (teacher.subjects || []).length > 0 &&
      !(teacher.subjects || []).some((subject: any) => String(subject?._id || subject) === subjectId)
    ) {
      throw new ApiError(403, "This subject is not assigned to you.");
    }
    const filter: Record<string, unknown> = { status: "active" };
    if (exam.class) filter.class = exam.class;
    if (exam.program) filter.program = exam.program;
    const [students, results] = await Promise.all([
      Student.find(filter).sort({ name: 1 }).select("name studentId").lean(),
      Result.find({ exam: exam._id, subject: subjectId }).lean()
    ]);
    const byStudent = new Map(results.map((result) => [String(result.student), result]));
    res.json({
      exam,
      subject: examSubject,
      students: students.map((student) => {
        const result: any = byStudent.get(String(student._id));
        return {
          id: String(student._id),
          name: student.name,
          studentId: student.studentId,
          obtainedMarks: result?.obtainedMarks ?? null
        };
      })
    });
  })
);

portalRouter.post(
  "/teacher/results",
  requireRole("teacher"),
  validateBody(marksSchema),
  asyncHandler(async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user!.id }).lean();
    if (!teacher) throw new ApiError(404, "Teacher profile not found.");
    const classIds = await teacherClassIds(teacher);
    const exam = await Exam.findById(req.body.examId);
    if (!exam) throw new ApiError(404, "Exam not found.");
    const assigned = classIds.includes(String(exam.class)) || (teacher.programs || []).some((program: any) => String(program) === String(exam.program));
    if (!assigned) throw new ApiError(403, "This exam is not assigned to you.");
    if (
      (teacher.subjects || []).length > 0 &&
      !(teacher.subjects || []).some((subject: any) => String(subject) === req.body.subjectId)
    ) {
      throw new ApiError(403, "This subject is not assigned to you.");
    }
    const examSubject = exam.subjects.find((entry: any) => String(entry.subject) === String(req.body.subjectId));
    if (!examSubject) throw new ApiError(400, "This subject is not part of the selected exam.");

    let created = 0;
    let updated = 0;
    let deleted = 0;
    for (const record of req.body.records) {
      const existing = await Result.findOne({
        exam: exam._id,
        student: record.studentId,
        subject: req.body.subjectId
      });
      if (record.obtainedMarks === null) {
        if (existing) {
          await existing.deleteOne();
          deleted += 1;
        }
        continue;
      }
      if (record.obtainedMarks > examSubject.maxMarks) {
        throw new ApiError(400, `Marks cannot exceed ${examSubject.maxMarks}.`);
      }
      if (existing) {
        if (existing.obtainedMarks !== record.obtainedMarks) {
          existing.history.push({
            previousMarks: existing.obtainedMarks,
            newMarks: record.obtainedMarks,
            by: req.user!.id as any,
            at: new Date()
          });
          existing.obtainedMarks = record.obtainedMarks;
          existing.grade = gradeFor((record.obtainedMarks / examSubject.maxMarks) * 100);
          existing.enteredBy = req.user!.id as any;
          await existing.save();
          updated += 1;
        }
      } else {
        await Result.create({
          exam: exam._id,
          student: record.studentId,
          subject: req.body.subjectId,
          obtainedMarks: record.obtainedMarks,
          maxMarks: examSubject.maxMarks,
          grade: gradeFor((record.obtainedMarks / examSubject.maxMarks) * 100),
          enteredBy: req.user!.id
        });
        created += 1;
      }
    }
    await writeAudit(req, "teacher.results_enter", "Exam", String(exam._id), {
      subjectId: req.body.subjectId,
      created,
      updated,
      deleted
    });
    res.json({ message: "Marks saved.", created, updated, deleted });
  })
);
