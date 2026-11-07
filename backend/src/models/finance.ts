import mongoose, { Schema, model } from "mongoose";

export const invoiceStatuses = ["unpaid", "partial", "paid", "overdue"] as const;

const feeStructureSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", default: null, index: true },
    session: { type: Schema.Types.ObjectId, ref: "AcademicSession", default: null, index: true },
    items: [
      {
        title: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        dueDate: { type: Date, default: null }
      }
    ],
    active: { type: Boolean, default: true },
    demo: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const invoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    session: { type: Schema.Types.ObjectId, ref: "AcademicSession", default: null, index: true },
    items: [
      {
        title: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 }
      }
    ],
    discount: { type: Number, default: 0, min: 0 },
    fine: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paid: { type: Number, default: 0, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    status: { type: String, enum: invoiceStatuses, default: "unpaid", index: true },
    dueDate: { type: Date, required: true, index: true },
    notes: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    demo: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const paymentSchema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["cash", "bank_transfer"], required: true },
    reference: { type: String, default: "" },
    paidAt: { type: Date, default: Date.now, index: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isReversal: { type: Boolean, default: false },
    reversalOf: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

export const FeeStructure = (mongoose.models.FeeStructure || model("FeeStructure", feeStructureSchema)) as mongoose.Model<Record<string, any>>;
export const Invoice = (mongoose.models.Invoice || model("Invoice", invoiceSchema)) as mongoose.Model<Record<string, any>>;
export const Payment = (mongoose.models.Payment || model("Payment", paymentSchema)) as mongoose.Model<Record<string, any>>;
