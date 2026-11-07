import mongoose, { Schema, model } from "mongoose";
import { localized } from "./core.js";

const programSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: localized,
    summary: localized,
    description: localized,
    duration: { type: String, default: "" },
    ageGroup: { type: String, default: "" },
    monthlyFeeNote: { type: String, default: "" },
    image: { type: String, default: "" },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const academicSessionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

const schoolClassSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    section: { type: String, default: "", trim: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    session: { type: Schema.Types.ObjectId, ref: "AcademicSession", required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", default: null, index: true },
    capacity: { type: Number, default: 30, min: 1 }
  },
  { timestamps: true }
);
schoolClassSchema.index({ program: 1, session: 1, name: 1, section: 1 }, { unique: true });

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", default: null, index: true },
    classes: [{ type: Schema.Types.ObjectId, ref: "SchoolClass" }],
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const teacherSchema = new Schema(
  {
    teacherId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, sparse: true, index: true },
    qualifications: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, lowercase: true, trim: true, default: "" },
    bio: localized,
    programs: [{ type: Schema.Types.ObjectId, ref: "Program" }],
    classes: [{ type: Schema.Types.ObjectId, ref: "SchoolClass" }],
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    published: { type: Boolean, default: false, index: true },
    demo: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const studentSchema = new Schema(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    dob: { type: Date, default: null },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    address: { type: String, default: "" },
    previousEducation: { type: String, default: "" },
    guardian: {
      name: { type: String, default: "" },
      relationship: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, lowercase: true, default: "" }
    },
    guardianUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, sparse: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", default: null, index: true },
    class: { type: Schema.Types.ObjectId, ref: "SchoolClass", default: null, index: true },
    session: { type: Schema.Types.ObjectId, ref: "AcademicSession", default: null, index: true },
    admission: { type: Schema.Types.ObjectId, ref: "Admission", default: null },
    status: {
      type: String,
      enum: ["active", "inactive", "transferred", "graduated"],
      default: "active",
      index: true
    },
    demo: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const guardianSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    email: { type: String, lowercase: true, trim: true, default: "" },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, sparse: true, index: true },
    children: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    demo: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Program = (mongoose.models.Program || model("Program", programSchema)) as mongoose.Model<Record<string, any>>;
export const AcademicSession = (mongoose.models.AcademicSession || model("AcademicSession", academicSessionSchema)) as mongoose.Model<Record<string, any>>;
export const SchoolClass = (mongoose.models.SchoolClass || model("SchoolClass", schoolClassSchema)) as mongoose.Model<Record<string, any>>;
export const Subject = (mongoose.models.Subject || model("Subject", subjectSchema)) as mongoose.Model<Record<string, any>>;
export const Teacher = (mongoose.models.Teacher || model("Teacher", teacherSchema)) as mongoose.Model<Record<string, any>>;
export const Student = (mongoose.models.Student || model("Student", studentSchema)) as mongoose.Model<Record<string, any>>;
export const Guardian = (mongoose.models.Guardian || model("Guardian", guardianSchema)) as mongoose.Model<Record<string, any>>;
