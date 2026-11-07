import { Router } from "express";
import {
  AcademicSession,
  Attendance,
  Exam,
  Result,
  SchoolClass,
  Student,
  Subject
} from "../../models/index.js";
import { crudRouter } from "../../services/crud.js";
import { writeAudit } from "../../utils/audit.js";
import {
  ApiError,
  asyncHandler,
  parseDate,
  startOfDay,
  validateBody
} from "../../utils/http.js";
import { gradeFor } from "../../utils/ids.js";
import {
  academicSessionSchema,
  attendanceSchema,
  classSchema,
  examSchema,
  marksSchema,
  subjectSchema
} from "../../utils/schemas.js";

export const adminAcademicsRouter = Router();

adminAcademicsRouter.use(
  "/sessions",
  crudRouter({
    model: AcademicSession,
    entityName: "Academic session",
    schema: academicSessionSchema,
    sort: { startDate: -1 },
    searchFields: ["name"],
    afterCreate: async (_req, doc) => {
      if (doc.isActive) {
        await AcademicSession.updateMany({ _id: { $ne: doc._id } }, { $set: { isActive: false } });
      }
    },
    afterUpdate: async (_req, doc) => {
      if (doc.isActive) {
        await AcademicSession.updateMany({ _id: { $ne: doc._id } }, { $set: { isActive: false } });
      }
    },
    beforeDelete: async (_req, doc) => {
      const used =
        (await Student.exists({ session: doc._id })) ||
        (await SchoolClass.exists({ session: doc._id }));
      if (used) throw new ApiError(409, "This session is in use and cannot be deleted.");
    }
  })
);

adminAcademicsRouter.use(
  "/classes",
  crudRouter({
    model: SchoolClass,
    entityName: "Class",
    schema: classSchema,
    sort: { name: 1, section: 1 },
    searchFields: ["name", "section"],
    beforeDelete: async (_req, doc) => {
      const used = (await Student.exists({ class: doc._id })) || (await Attendance.exists({ class: doc._id }));
      if (used) throw new ApiError(409, "This class has students or attendance records and cannot be deleted.");
    }
  })
);

adminAcademicsRouter.use(
  "/subjects",
  crudRouter({
    model: Subject,
    entityName: "Subject",
    schema: subjectSchema,
    sort: { name: 1 },
    searchFields: ["name", "code"],
    beforeDelete: async (_req, doc) => {
      const used = await Result.exists({ subject: doc._id });
      if (used) throw new ApiError(409, "This subject has results and cannot be deleted.");
    }
  })
);

adminAcademicsRouter.get(
  "/attendance",
  asyncHandler(async (req, res) => {
    const classId = String(req.query.classId || "");
    const date = parseDate(req.query.date || new Date());
    if (!classId) throw new ApiError(400, "Select a class.");
    const schoolClass = await SchoolClass.findById(classId).populate("program", "title").lean();
    if (!schoolClass) throw new ApiError(404, "Class not found.");
    const day = startOfDay(date);
    const [students, records] = await Promise.all([
      Student.find({ class: classId, status: "active" }).sort({ name: 1 }).select("name studentId").lean(),
      Attendance.find({ class: classId, date: day }).lean()
    ]);
    const byStudent = new Map(records.map((record) => [String(record.student), record]));
    res.json({
      class: schoolClass,
      date: day,
      students: students.map((student) => {
        const record: any = byStudent.get(String(student._id));
        return {
          id: String(student._id),
          name: student.name,
          studentId: student.studentId,
          status: record?.status || "",
          recordId: record?._id || null,
          corrections: record?.corrections || []
        };
      })
    });
  })
);

adminAcademicsRouter.post(
  "/attendance",
  validateBody(attendanceSchema),
  asyncHandler(async (req, res) => {
    const schoolClass = await SchoolClass.findById(req.body.classId).lean();
    if (!schoolClass) throw new ApiError(404, "Class not found.");
    const day = startOfDay(req.body.date);
    const students = await Student.find({
      _id: { $in: req.body.records.map((record: any) => record.studentId) },
      class: req.body.classId,
      status: "active"
    }).select("_id").lean();
    const validIds = new Set(students.map((student) => String(student._id)));
    if (validIds.size !== req.body.records.length) {
      throw new ApiError(400, "One or more students do not belong to this class.");
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
          reason: req.body.reason || "Attendance corrected by administrator.",
          by: req.user!.id,
          at: new Date()
        });
        existing.status = record.status;
        existing.markedBy = req.user!.id;
        await existing.save();
        corrected += 1;
      }
    }

    await writeAudit(req, "attendance.save", "Attendance", String(req.body.classId), {
      date: day.toISOString(),
      created,
      corrected
    });
    res.json({ message: "Attendance saved.", created, corrected });
  })
);

adminAcademicsRouter.get(
  "/attendance/summary",
  asyncHandler(async (req, res) => {
    const classId = String(req.query.classId || "");
    const month = String(req.query.month || "");
    if (!classId || !/^\d{4}-\d{2}$/.test(month)) {
      throw new ApiError(400, "A class and month (YYYY-MM) are required.");
    }
    const [year, monthIndex] = month.split("-").map(Number);
    const from = new Date(year, monthIndex - 1, 1);
    const to = new Date(year, monthIndex, 1);
    const students = await Student.find({ class: classId, status: "active" })
      .sort({ name: 1 })
      .select("name studentId")
      .lean();
    const records = await Attendance.find({ class: classId, date: { $gte: from, $lt: to } }).lean();
    const map = new Map<string, Record<string, number>>();
    for (const record of records) {
      const key = String(record.student);
      if (!map.has(key)) map.set(key, { present: 0, absent: 0, late: 0, leave: 0 });
      const summary = map.get(key)!;
      summary[record.status] = (summary[record.status] || 0) + 1;
    }
    res.json({
      month,
      classId,
      students: students.map((student) => {
        const summary = map.get(String(student._id)) || { present: 0, absent: 0, late: 0, leave: 0 };
        const total = Object.values(summary).reduce((sum, value) => sum + value, 0);
        return {
          id: String(student._id),
          name: student.name,
          studentId: student.studentId,
          ...summary,
          total,
          percentage: total ? Math.round((summary.present / total) * 100) : 0
        };
      })
    });
  })
);

adminAcademicsRouter.get(
  "/exams",
  asyncHandler(async (_req, res) => {
    const exams = await Exam.find({})
      .populate("class", "name section")
      .populate("program", "title")
      .populate("session", "name")
      .populate("subjects.subject", "name code")
      .sort({ startDate: -1 })
      .lean();
    res.json({ items: exams });
  })
);

adminAcademicsRouter.post(
  "/exams",
  validateBody(examSchema),
  asyncHandler(async (req, res) => {
    const subjectIds = req.body.subjects.map((entry: any) => entry.subject);
    if (new Set(subjectIds).size !== subjectIds.length) throw new ApiError(400, "Each subject may appear only once.");
    if (req.body.subjects.some((entry: any) => entry.passMarks > entry.maxMarks)) {
      throw new ApiError(400, "Pass marks cannot exceed maximum marks.");
    }
    const exam = await Exam.create({ ...req.body, createdBy: req.user!.id });
    await writeAudit(req, "exam.create", "Exam", String(exam._id));
    res.status(201).json(exam);
  })
);

adminAcademicsRouter.put(
  "/exams/:id",
  validateBody(examSchema),
  asyncHandler(async (req, res) => {
    if (req.body.subjects.some((entry: any) => entry.passMarks > entry.maxMarks)) {
      throw new ApiError(400, "Pass marks cannot exceed maximum marks.");
    }
    const exam = await Exam.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!exam) throw new ApiError(404, "Exam not found.");
    await writeAudit(req, "exam.update", "Exam", String(exam._id));
    res.json(exam);
  })
);

adminAcademicsRouter.delete(
  "/exams/:id",
  asyncHandler(async (req, res) => {
    if (await Result.exists({ exam: req.params.id })) {
      throw new ApiError(409, "This exam has recorded results and cannot be deleted.");
    }
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) throw new ApiError(404, "Exam not found.");
    await writeAudit(req, "exam.delete", "Exam", String(exam._id));
    res.json({ message: "Exam removed." });
  })
);

adminAcademicsRouter.patch(
  "/exams/:id/publish",
  asyncHandler(async (req, res) => {
    if (typeof req.body.published !== "boolean") throw new ApiError(400, "A published boolean is required.");
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { $set: { published: req.body.published } },
      { new: true }
    );
    if (!exam) throw new ApiError(404, "Exam not found.");
    await writeAudit(req, "exam.publish", "Exam", String(exam._id), { published: exam.published });
    res.json(exam);
  })
);

adminAcademicsRouter.get(
  "/exams/:id/marks",
  asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).populate("subjects.subject", "name code").lean();
    if (!exam) throw new ApiError(404, "Exam not found.");
    const subjectId = String(req.query.subjectId || "");
    const examSubject = (exam.subjects || []).find((entry: any) => String(entry.subject?._id || entry.subject) === subjectId);
    if (!examSubject) throw new ApiError(400, "This subject is not part of the selected exam.");
    const filter: Record<string, unknown> = { status: "active" };
    if (exam.class) filter.class = exam.class;
    if (exam.program) filter.program = exam.program;
    const [students, results] = await Promise.all([
      Student.find(filter).sort({ name: 1 }).select("name studentId class").lean(),
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

adminAcademicsRouter.post(
  "/results/bulk",
  validateBody(marksSchema),
  asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.body.examId);
    if (!exam) throw new ApiError(404, "Exam not found.");
    const examSubject = exam.subjects.find((entry: any) => String(entry.subject) === String(req.body.subjectId));
    if (!examSubject) throw new ApiError(400, "This subject is not part of the selected exam.");

    let created = 0;
    let updated = 0;
    for (const record of req.body.records) {
      if (record.obtainedMarks > examSubject.maxMarks) {
        throw new ApiError(400, `Marks cannot exceed the maximum of ${examSubject.maxMarks}.`);
      }
      const existing = await Result.findOne({
        exam: exam._id,
        student: record.studentId,
        subject: req.body.subjectId
      });
      if (existing) {
        if (existing.obtainedMarks !== record.obtainedMarks) {
          existing.history.push({
            previousMarks: existing.obtainedMarks,
            newMarks: record.obtainedMarks,
            by: req.user!.id,
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

    await writeAudit(req, "results.enter", "Exam", String(exam._id), {
      subjectId: req.body.subjectId,
      created,
      updated
    });
    res.json({ message: "Marks saved.", created, updated });
  })
);

adminAcademicsRouter.get(
  "/results",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.examId) filter.exam = String(req.query.examId);
    if (req.query.studentId) filter.student = String(req.query.studentId);
    const results = await Result.find(filter)
      .populate("student", "name studentId")
      .populate("subject", "name code")
      .populate("exam", "title published")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ items: results });
  })
);
