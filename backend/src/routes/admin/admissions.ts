import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { Admission, Student } from "../../models/index.js";
import { admissionDocs } from "../../middleware/uploads.js";
import { notifyAdmins } from "../../services/notify.js";
import { writeAudit } from "../../utils/audit.js";
import { ApiError, asyncHandler, parsePagination, paginationMeta, validateBody } from "../../utils/http.js";
import { studentId } from "../../utils/ids.js";
import { admissionUpdateSchema } from "../../utils/schemas.js";

export const adminAdmissionsRouter = Router();

async function createStudentFromAdmission(admission: any): Promise<any> {
  if (admission.linkedStudent) return { student: null, existing: admission.linkedStudent };
  let student: any = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4 && !student; attempt += 1) {
    try {
      student = await Student.create({
        studentId: studentId(),
        name: admission.studentName,
        dob: admission.dob,
        gender: admission.gender,
        address: admission.address,
        previousEducation: admission.previousEducation,
        guardian: {
          name: admission.guardianName,
          relationship: admission.relationship,
          phone: admission.phone,
          email: admission.email
        },
        program: admission.program,
        session: admission.session,
        admission: admission._id,
        status: "active"
      });
    } catch (error) {
      lastError = error;
    }
  }
  if (!student) throw lastError instanceof Error ? lastError : new Error("Student creation failed");
  admission.linkedStudent = student._id;
  return { student, existing: null };
}

adminAdmissionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    const status = String(req.query.status || "");
    const search = String(req.query.search || "").trim();
    if (status) filter.status = status;
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ reference: pattern }, { studentName: pattern }, { guardianName: pattern }, { phone: pattern }];
    }
    const [items, total] = await Promise.all([
      Admission.find(filter)
        .populate("program", "title slug")
        .populate("session", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Admission.countDocuments(filter)
    ]);
    res.json({ items, pagination: paginationMeta(total, page, limit) });
  })
);

adminAdmissionsRouter.get(
  "/:id([0-9a-fA-F]{24})",
  asyncHandler(async (req, res) => {
    const admission = await Admission.findById(req.params.id)
      .populate("program", "title slug")
      .populate("session", "name")
      .populate("linkedStudent", "studentId name status")
      .lean();
    if (!admission) throw new ApiError(404, "Admission not found.");
    res.json(admission);
  })
);

adminAdmissionsRouter.patch(
  "/:id/status",
  validateBody(admissionUpdateSchema),
  asyncHandler(async (req, res) => {
    const admission = await Admission.findById(req.params.id);
    if (!admission) throw new ApiError(404, "Admission not found.");
    if (admission.status === "approved" && req.body.status !== "approved") {
      throw new ApiError(409, "Approved admissions cannot be reopened from this screen.");
    }

    let student = null;
    if (req.body.status === "approved") {
      const result = await createStudentFromAdmission(admission);
      student = result.student;
    }

    admission.status = req.body.status;
    if (req.body.reviewNotes !== undefined) admission.reviewNotes = req.body.reviewNotes;
    admission.reviewedBy = req.user!.id;
    admission.statusHistory.push({
      status: req.body.status,
      note: req.body.note,
      by: req.user!.id,
      at: new Date()
    });
    await admission.save();

    await writeAudit(req, "admission.status", "Admission", String(admission._id), {
      status: req.body.status,
      studentId: student?.studentId
    });

    res.json({ admission, student });
  })
);

adminAdmissionsRouter.post(
  "/:id/approve",
  asyncHandler(async (req, res) => {
    const admission = await Admission.findById(req.params.id);
    if (!admission) throw new ApiError(404, "Admission not found.");
    if (admission.status === "rejected") throw new ApiError(409, "A rejected application cannot be approved directly.");

    const result = await createStudentFromAdmission(admission);
    admission.status = "approved";
    admission.reviewedBy = req.user!.id;
    admission.statusHistory.push({
      status: "approved",
      note: String(req.body.note || "Application approved and student record created."),
      by: req.user!.id,
      at: new Date()
    });
    await admission.save();
    await writeAudit(req, "admission.approve", "Admission", String(admission._id), {
      linkedStudent: String(admission.linkedStudent)
    });
    await notifyAdmins("Admission approved", `${admission.studentName} was approved.`);

    res.json({ admission, student: result.student, alreadyLinked: Boolean(result.existing) });
  })
);

adminAdmissionsRouter.get(
  "/:id/documents/:filename",
  asyncHandler(async (req, res) => {
    const admission = await Admission.findById(req.params.id).lean();
    if (!admission) throw new ApiError(404, "Admission not found.");
    const filename = path.basename(req.params.filename);
    const document = (admission.documents || []).find((entry: any) => entry.filename === filename);
    if (!document) throw new ApiError(404, "Document not found.");
    const filePath = path.join(admissionDocs, filename);
    if (!fs.existsSync(filePath)) throw new ApiError(404, "Document file is missing.");
    res.download(filePath, document.originalName || filename);
  })
);
