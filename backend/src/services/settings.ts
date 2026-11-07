import { env } from "../config/env.js";
import { SiteSetting } from "../models/index.js";

export function defaultSettings() {
  return {
    key: "main",
    siteName: "Madrasa Miftah ul Uloom",
    logoUrl: "",
    brandSubtitle: {
      en: "Knowledge · Character · Service",
      ur: "علم • کردار • خدمت",
      ar: "علم • خلق • خدمة"
    },
    heroTitle: {
      en: "Knowledge that shapes character, service that serves the community",
      ur: "وہ علم جو کردار سنوارے، وہ خدمت جو معاشرے کے کام آئے",
      ar: "علم يبني الشخصية وخدمة تنفع المجتمع"
    },
    heroSubtitle: {
      en: "A centre of Islamic learning offering structured programmes in Qur'an, Arabic and the Islamic sciences, with a commitment to scholarship, character and service.",
      ur: "اسلامی تعلیم کا ایک مرکز جو قرآن، عربی اور اسلامی علوم کے منظم پروگرام پیش کرتا ہے، علمی روایت، کردار اور خدمت کے عزم کے ساتھ۔",
      ar: "مركز للتعليم الإسلامي يقدم برامج منظمة في القرآن والعربية والعلوم الإسلامية، مع الالتزام بالعلم والأخلاق والخدمة."
    },
    heroNote: {
      en: "Faith • Knowledge • Character • Service",
      ur: "ایمان • علم • کردار • خدمت",
      ar: "إيمان • علم • خلق • خدمة"
    },
    heroImage: "",
    tagline: {
      en: "Knowledge, character and service",
      ur: "علم، کردار اور خدمت",
      ar: "العلم والأخلاق والخدمة"
    },
    aboutShort: {
      en: "An institution dedicated to authentic Islamic learning and the formation of upright character.",
      ur: "مستند اسلامی تعلیم اور سیرت کی تعمیر کے لیے وقف ایک ادارہ۔",
      ar: "مؤسسة مخصصة للتعليم الإسلامي الأصيل وبناء الشخصية القويمة."
    },
    announcementBar: {
      en: "Update this announcement in the admin dashboard.",
      ur: "یہ اعلان ایڈمن ڈیش بورڈ سے تبدیل کریں۔",
      ar: "قم بتحديث هذا الإعلان من لوحة الإدارة."
    },
    contactPhone: "",
    contactPhoneAlt: "",
    contactEmail: "",
    address: {
      en: "Campus address will be published by the administration.",
      ur: "کیمپس کا پتہ انتظامیہ شائع کرے گی۔",
      ar: "سيتم نشر عنوان الحرم من قبل الإدارة."
    },
    officeHours: {
      en: "Office hours will be published by the administration.",
      ur: "دفتری اوقات انتظامیہ شائع کرے گی۔",
      ar: "سيتم نشر ساعات المكتب من قبل الإدارة."
    },
    admissionEmail: "",
    admissionsOpen: true,
    socials: { facebook: "", instagram: "", youtube: "", whatsapp: "https://wa.me/923343595001" },
    shippingFee: env.DEFAULT_SHIPPING_FEE,
    freeShippingAbove: env.DEFAULT_FREE_SHIPPING_ABOVE,
    codEnabled: true,
    bankTransferEnabled: false,
    bankDetails: { en: "", ur: "", ar: "" },
    shippingPolicy: {
      en: "Shipping charges are calculated at checkout. Delivery timings depend on the destination and courier.",
      ur: "ڈیلیوری چارجز چیک آؤٹ پر شامل ہوں گے۔ مدت منزل اور کورئیر پر منحصر ہے۔",
      ar: "تُحسب رسوم التوصيل عند الدفع. تعتمد المدة على الوجهة وشركة الشحن."
    },
    paymentPolicy: {
      en: "Available payment methods are shown at checkout. No online payment is processed on this website.",
      ur: "دستیاب طریقہ ہائے ادائیگی چیک آؤٹ پر دکھائے جائیں گے۔ اس ویب سائٹ پر آن لائن ادائیگی نہیں ہوتی۔",
      ar: "تظهر طرق الدفع المتاحة عند الدفع. لا تتم أي مدفوعات إلكترونية على هذا الموقع."
    },
    cancellationPolicy: {
      en: "Contact the administration to request cancellation. Orders already dispatched may require a return request.",
      ur: "منسوخی کے لیے انتظامیہ سے رابطہ کریں۔ روانہ شدہ آرڈر کے لیے واپسی کی درخواست درکار ہو سکتی ہے۔",
      ar: "اتصل بالإدارة لطلب الإلغاء. قد تتطلب الطلبات المشحونة طلب إرجاع."
    },
    returnPolicy: {
      en: "Return eligibility depends on the condition of the item. Contact the administration for review.",
      ur: "واپسی کی اہلیت کتاب کی حالت پر منحصر ہے۔ جائزے کے لیے انتظامیہ سے رابطہ کریں۔",
      ar: "تخضع أهلية الإرجاع لحالة الكتاب. اتصل بالإدارة للمراجعة."
    },
    mapEmbedUrl: "",
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function getSettings() {
  const settings = await SiteSetting.findOne({ key: "main" }).lean();
  if (!settings) return defaultSettings();
  return { ...defaultSettings(), ...settings };
}
