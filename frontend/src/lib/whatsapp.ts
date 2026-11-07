export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923343595001";

export function whatsappUrl(text?: string): string {
  const number = WHATSAPP_NUMBER.replace(/\D/g, "") || "923343595001";
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
