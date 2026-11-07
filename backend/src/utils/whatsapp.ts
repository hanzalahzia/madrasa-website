import { env } from "../config/env.js";

export function whatsappNumber(): string {
  let digits = String(env.WHATSAPP_NUMBER || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = `92${digits.slice(1)}`;
  return digits || "923343595001";
}

export function whatsappLink(text?: string): string {
  const url = new URL(`https://wa.me/${whatsappNumber()}`);
  if (text) url.searchParams.set("text", text);
  return url.toString();
}
