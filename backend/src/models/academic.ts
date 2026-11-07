import mongoose, { Schema, model } from "mongoose";

export const admissionStatuses = [
  "submitted",
  "under_review",
  "additional_information_required",
  "approved",
  "rejected"
] as const;

export const attendanceStatuses = ["present", "absent", "late", "leave"] as const;

const admissionDocumentSchema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 }
  },
  { _id: false }
);

const admissionSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    pinHash: { type: String, required: true, select: false },
    studentName: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    guardianName: { type: String, required: true, trim: true },
    relationship: { type: String, default: "" },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: "" },
    address: { type: String, required: true },
    previousEducation: { type: String, default: "" },
    program: { type: Schema.Types.ObjectId, ref: "Program", default: null },
    session: { type: Schema.Types.ObjectId, ref: "AcademicSession", default: null },
    additionalFields: { type: Schema.Types.Mixed, default: {} },
    documents: [admissionDocumentSchema],
    status: { type: String, enum: admissionStatuses, default: "submitted", index: true },
    reviewNotes: { type: String, default: "" },
    statusHistory: [
      {
        status: { type: String, enum: admissionStatuses, required: true },
        note: { type: String, default: "" },
        by: { type: Schema.Types.ObjectId, ref: "User", default: null },
        at: { type: Date, default: Date.now }
      }
    ],
    linkedStudent: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    demo: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const attendanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    class: { type: Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: { type: String, enum: attendanceStatuses, required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    corrections: [
      {
        previousStatus: String,
        newStatus: String,
        reason: String,
        by: { type: Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);
attendanceSchema.index({ student: 1, class: 1, date: 1 }, { unique: true });

const examSubjectSchema = new Schema(
  {
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    maxMarks: { type: Number, required: true, min: 1 },
    passMarks: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const examSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", default: null, index: true },
    class: { type: Schema.Types.ObjectId, ref: "SchoolClass", default: null, index: true },
    session: { type: Schema.Types.ObjectId, ref: "AcademicSession", default: null, index: true },
    startDate: { type: Date, required: true },
    subjects: [examSubjectSchema],
    published: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    demo: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const resultSchema = new Schema(
  {
    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    obtainedMarks: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    grade: { type: String, default: "" },
    enteredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    history: [
      {
        previousMarks: Number,
        newMarks: Number,
        by: { type: Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);
resultSchema.index({ exam: 1, student: 1, subject: 1 }, { unique: true });

export const Admission = (mongoose.models.Admission || model("Admission", admissionSchema)) as mongoose.Model<Record<string, any>>;
export const Attendance = (mongoose.models.Attendance || model("Attendance", attendanceSchema)) as mongoose.Model<Record<string, any>>;
export const Exam = (mongoose.models.Exam || model("Exam", examSchema)) as mongoose.Model<Record<string, any>>;
export const Result = (mongoose.models.Result || model("Result", resultSchema)) as mongoose.Model<Record<string, any>>;
