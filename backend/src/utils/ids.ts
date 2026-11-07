import crypto from "node:crypto";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function randomCode(length: number): string {
  let output = "";
  const bytes = crypto.randomBytes(length);
  for (let index = 0; index < length; index += 1) {
    output += alphabet[bytes[index] % alphabet.length];
  }
  return output;
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function datedCode(prefix: string, length = 6): string {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
  return `${prefix}-${stamp}-${randomCode(length)}`;
}

export function admissionReference(): string {
  return `MMU-ADM-${new Date().getUTCFullYear()}-${randomCode(6)}`;
}

export function orderNumber(): string {
  return datedCode("MMU-ORD", 6);
}

export function whatsappOrderNumber(): string {
  return datedCode("MMU-WA", 6);
}

export function invoiceNumber(): string {
  return datedCode("MMU-INV", 6);
}

export function receiptNumber(): string {
  return datedCode("MMU-RCPT", 6);
}

export function studentId(): string {
  return datedCode("MMU-STU", 5);
}

export function teacherId(): string {
  return datedCode("MMU-TCH", 5);
}

export function trackingPin(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function safeEqual(value: string, expected: string): boolean {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function gradeFor(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
}
