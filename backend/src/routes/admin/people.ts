import { Router } from "express";
import {
  Attendance,
  Guardian,
  Invoice,
  Result,
  Student,
  Teacher,
  User
} from "../../models/index.js";
import { writeAudit } from "../../utils/audit.js";
import { hashPassword } from "../../utils/auth.js";
import { ApiError, asyncHandler, parsePagination, paginationMeta, validateBody } from "../../utils/http.js";
import { studentId } from "../../utils/ids.js";
import {
  createPortalAccountSchema,
  studentSchema
} from "../../utils/schemas.js";

export const adminPeopleRouter = Router();

async function createPortalUser(email: string, password: string, name: string, role: string) {
  const normalized = email.toLowerCase();
  if (await User.exists({ email: normalized })) {
    throw new ApiError(409, "An account with this email already exists.");
  }
  return User.create({
    name,
    email: normalized,
    passwordHash: await hashPassword(password),
    role
  });
}

adminPeopleRouter.get(
  "/students",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.class) filter.class = String(req.query.class);
    if (req.query.program) filter.program = String(req.query.program);
    const search = String(req.query.search || req.query.q || "").trim();
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { name: pattern },
        { studentId: pattern },
        { "guardian.name": pattern },
        { "guardian.phone": pattern }
      ];
    }
    const [items, total] = await Promise.all([
      Student.find(filter)
        .populate("program", "title slug")
        .populate("class", "name section")
        .populate("session", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter)
    ]);
    res.json({ items, pagination: paginationMeta(total, page, limit) });
  })
);

adminPeopleRouter.get(
  "/students/export.csv",
  asyncHandler(async (_req, res) => {
    const students = await Student.find({})
      .populate("program", "title")
      .populate("class", "name section")
      .lean();
    const header = "Student ID,Name,Status,Program,Class,Guardian,Guardian Phone\n";
    const rows = students
      .map((student: any) => {
        const values = [
          student.studentId,
          student.name,
          student.status,
          student.program?.title?.en || "",
          `${student.class?.name || ""} ${student.class?.section || ""}`.trim(),
          student.guardian?.name || "",
          student.guardian?.phone || ""
        ];
        return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");
      })
      .join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=students.csv");
    res.send(header + rows);
  })
);

adminPeopleRouter.get(
  "/students/:id",
  asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id)
      .populate("program", "title slug")
      .populate("class", "name section")
      .populate("session", "name")
      .populate("user", "name email role isActive")
      .populate("guardianUsers", "name email phone role isActive")
      .lean();
    if (!student) throw new ApiError(404, "Student not found.");

    const [invoices, attendance, results] = await Promise.all([
      Invoice.find({ student: student._id }).sort({ createdAt: -1 }).limit(50).lean(),
      Attendance.find({ student: student._id }).sort({ date: -1 }).limit(60).lean(),
      Result.find({ student: student._id })
        .populate("exam", "title published")
        .populate("subject", "name code")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
    ]);
    res.json({ student, invoices, attendance, results });
  })
);

adminPeopleRouter.post(
  "/students",
  validateBody(studentSchema),
  asyncHandler(async (req, res) => {
    let student: any = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 4 && !student; attempt += 1) {
      try {
        student = await Student.create({ ...req.body, studentId: studentId() });
      } catch (error) {
        lastError = error;
      }
    }
    if (!student) throw lastError;
    await writeAudit(req, "student.create", "Student", String(student._id), {
      studentId: student.studentId
    });
    res.status(201).json(student);
  })
);

adminPeopleRouter.put(
  "/students/:id",
  validateBody(studentSchema),
  asyncHandler(async (req, res) => {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!student) throw new ApiError(404, "Student not found.");
    await writeAudit(req, "student.update", "Student", String(student._id));
    res.json(student);
  })
);

adminPeopleRouter.delete(
  "/students/:id",
  asyncHandler(async (req, res) => {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "inactive" } },
      { new: true }
    );
    if (!student) throw new ApiError(404, "Student not found.");
    await writeAudit(req, "student.archive", "Student", String(student._id));
    res.json({ message: "Student archived (marked inactive) to preserve academic and financial history.", student });
  })
);

adminPeopleRouter.post(
  "/students/:id/account",
  validateBody(createPortalAccountSchema),
  asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) throw new ApiError(404, "Student not found.");
    if (student.user) throw new ApiError(409, "This student already has a portal account.");
    const user = await createPortalUser(
      req.body.email,
      req.body.password,
      req.body.name || student.name,
      "student"
    );
    student.user = user._id;
    await student.save();
    await writeAudit(req, "student.account_create", "Student", String(student._id), {
      userId: String(user._id)
    });
    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role } });
  })
);

adminPeopleRouter.post(
  "/students/:id/guardian-account",
  validateBody(createPortalAccountSchema),
  asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) throw new ApiError(404, "Student not found.");
    const user = await createPortalUser(
      req.body.email,
      req.body.password,
      req.body.name || student.guardian?.name || "Guardian",
      "guardian"
    );
    let guardian = await Guardian.findOne({ user: user._id });
    if (!guardian) {
      guardian = await Guardian.create({
        name: user.name,
        email: user.email,
        phone: user.phone || student.guardian?.phone || "",
        user: user._id,
        children: [student._id]
      });
    } else if (!guardian.children.some((child: any) => String(child) === String(student._id))) {
      guardian.children.push(student._id);
      await guardian.save();
    }
    if (!student.guardianUsers.some((id: any) => String(id) === String(user._id))) {
      student.guardianUsers.push(user._id);
      await student.save();
    }
    await writeAudit(req, "guardian.account_create", "Student", String(student._id), {
      userId: String(user._id)
    });
    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role } });
  })
);

adminPeopleRouter.get(
  "/guardians",
  asyncHandler(async (_req, res) => {
    const items = await Guardian.find({})
      .populate("user", "name email isActive")
      .populate("children", "studentId name status")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  })
);

adminPeopleRouter.post(
  "/faculty/:id/account",
  validateBody(createPortalAccountSchema),
  asyncHandler(async (req, res) => {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) throw new ApiError(404, "Teacher not found.");
    if (teacher.user) throw new ApiError(409, "This teacher already has a portal account.");
    const user = await createPortalUser(
      req.body.email,
      req.body.password,
      req.body.name || teacher.name,
      "teacher"
    );
    teacher.user = user._id;
    await teacher.save();
    await writeAudit(req, "teacher.account_create", "Teacher", String(teacher._id), {
      userId: String(user._id)
    });
    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role } });
  })
);

