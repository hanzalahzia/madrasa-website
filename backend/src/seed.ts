import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";
import {
  AcademicSession,
  Admission,
  Announcement,
  Attendance,
  AuditLog,
  Book,
  BookCategory,
  ContactMessage,
  Event,
  Exam,
  Faq,
  FeeStructure,
  GalleryItem,
  Guardian,
  InventoryMovement,
  Invoice,
  Order,
  PageContent,
  Payment,
  Program,
  Result,
  SchoolClass,
  SiteSetting,
  Student,
  Subject,
  Teacher,
  User
} from "./models/index.js";
import { hashPassword } from "./utils/auth.js";
import {
  admissionReference,
  gradeFor,
  invoiceNumber,
  orderNumber,
  randomToken,
  receiptNumber,
  sha256,
  studentId as newStudentId,
  teacherId as newTeacherId,
  trackingPin
} from "./utils/ids.js";

function randomPassword(): string {
  return `Mmu1-${crypto.randomBytes(18).toString("base64url")}`;
}

function day(value: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function monthStart(offset = 0): Date {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function localized(en: string, ur = "", ar = "") {
  return { en, ur: ur || en, ar: ar || en };
}

async function seed() {
  await connectDB();

  if (await User.exists({})) {
    console.log("Seed skipped: at least one user already exists. Use the admin dashboard to add records.");
    await disconnectDB();
    return;
  }

  const credentials: string[] = [];
  const adminEmail = env.SEED_ADMIN_EMAIL.toLowerCase();
  const generatedAdminPassword = !env.SEED_ADMIN_PASSWORD;
  const adminPassword = env.SEED_ADMIN_PASSWORD || randomPassword();

  const now = new Date();
  const year = now.getFullYear();
  const sessionName = `${year}–${year + 1}`;

  await User.create({
    name: env.SEED_ADMIN_NAME,
    email: adminEmail,
    passwordHash: await hashPassword(adminPassword),
    role: "super_admin"
  });
  credentials.push(`Administrator: ${adminEmail}`);
  if (generatedAdminPassword) credentials.push(`Administrator password: ${adminPassword}`);
  else credentials.push("Administrator password: supplied through SEED_ADMIN_PASSWORD.");

  const defaults = {
    siteName: "Madrasa Miftah ul Uloom",
    logoUrl: "",
    brandSubtitle: localized(
      "Knowledge · Character · Service",
      "علم • کردار • خدمت",
      "علم • خلق • خدمة"
    ),
    heroTitle: localized(
      "Knowledge that shapes character, service that serves the community",
      "وہ علم جو کردار سنوارے، وہ خدمت جو معاشرے کے کام آئے",
      "علم يبني الشخصية وخدمة تنفع المجتمع"
    ),
    heroSubtitle: localized(
      "A centre of Islamic learning offering structured programmes in Qur'an, Arabic and the Islamic sciences, with a commitment to scholarship, character and service.",
      "اسلامی تعلیم کا ایک مرکز جو قرآن، عربی اور اسلامی علوم کے منظم پروگرام پیش کرتا ہے، علمی روایت، کردار اور خدمت کے عزم کے ساتھ۔",
      "مركز للتعليم الإسلامي يقدم برامج منظمة في القرآن والعربية والعلوم الإسلامية، مع الالتزام بالعلم والأخلاق والخدمة."
    ),
    heroNote: localized(
      "Faith • Knowledge • Character • Service",
      "ایمان • علم • کردار • خدمت",
      "إيمان • علم • خلق • خدمة"
    ),
    heroImage: "",
    tagline: localized(
      "Knowledge, character and service",
      "علم، کردار اور خدمت",
      "العلم والأخلاق والخدمة"
    ),
    aboutShort: localized(
      "An institution dedicated to authentic Islamic learning, careful scholarship and the formation of upright character.",
      "مستند اسلامی تعلیم، محتاط علمی روایت اور سیرت کی تعمیر کے لیے وقف ادارہ۔",
      "مؤسسة مكرسة للتعليم الإسلامي الأصيل والبحث الدقيق وبناء الشخصية القويمة."
    ),
    announcementBar: localized(
      "Admissions information is available on the admissions page. Please contact the administration to confirm current dates.",
      "داخلے کی معلومات داخلہ صفحے پر دستیاب ہیں۔ موجودہ تاریخوں کی تصدیق کے لیے انتظامیہ سے رابطہ کریں۔",
      "معلومات القبول متاحة في صفحة القبول. يرجى التواصل مع الإدارة لتأكيد المواعيد الحالية."
    ),
    contactPhone: "+92 300 0000000",
    contactPhoneAlt: "",
    contactEmail: "info@madrasamiftahululoom.example",
    address: localized(
      "Campus address placeholder — update in Admin → Settings",
      "کیمپس کا پتہ عارضی ہے — ایڈمن ← سیٹنگز میں تبدیل کریں",
      "عنوان الحرم مؤقت — قم بتحديثه من الإدارة ← الإعدادات"
    ),
    officeHours: localized(
      "Office hours placeholder — update in Admin → Settings",
      "دفتری اوقات عارضی ہیں — ایڈمن ← سیٹنگز میں تبدیل کریں",
      "ساعات المكتب مؤقتة — قم بتحديثها من الإدارة ← الإعدادات"
    ),
    admissionEmail: "admissions@madrasamiftahululoom.example",
    admissionsOpen: true,
    shippingFee: env.DEFAULT_SHIPPING_FEE,
    freeShippingAbove: env.DEFAULT_FREE_SHIPPING_ABOVE,
    codEnabled: true,
    bankTransferEnabled: false,
    bankDetails: localized(
      "Bank transfer details will be published once enabled by the administration.",
      "بینک ٹرانسفر کی تفصیلات انتظامیہ کے فعال کرنے پر شائع ہوں گی۔",
      "ستُنشر تفاصيل التحويل البنكي بعد تفعيلها من الإدارة."
    ),
    shippingPolicy: localized(
      "Shipping charges are shown at checkout. Delivery timing depends on the destination and courier availability.",
      "ڈیلیوری چارجز چیک آؤٹ پر دکھائے جاتے ہیں۔ مدت منزل اور کورئیر کی دستیابی پر منحصر ہے۔",
      "تظهر رسوم الشحن عند الدفع. تعتمد مدة التوصيل على الوجهة وتوفر شركة الشحن."
    ),
    paymentPolicy: localized(
      "Available payment methods are shown at checkout. This website does not process online card payments.",
      "دستیاب طریقہ ہائے ادائیگی چیک آؤٹ پر دکھائے جاتے ہیں۔ یہ ویب سائٹ آن لائن کارڈ ادائیگی نہیں کرتی۔",
      "تظهر طرق الدفع المتاحة عند الدفع. لا يعالج هذا الموقع مدفوعات البطاقات الإلكترونية."
    ),
    cancellationPolicy: localized(
      "Contact the administration to request cancellation. Orders already dispatched may require a return request.",
      "منسوخی کے لیے انتظامیہ سے رابطہ کریں۔ روانہ شدہ آرڈر کے لیے واپسی کی درخواست درکار ہو سکتی ہے۔",
      "اتصل بالإدارة لطلب الإلغاء. قد تتطلب الطلبات المشحونة طلب إرجاع."
    ),
    returnPolicy: localized(
      "Return eligibility depends on the condition of the item after delivery. Contact the administration for review.",
      "واپسی کی اہلیت ڈیلیوری کے بعد کتاب کی حالت پر منحصر ہے۔ جائزے کے لیے انتظامیہ سے رابطہ کریں۔",
      "تخضع أهلية الإرجاع لحالة الكتاب بعد التسليم. اتصل بالإدارة للمراجعة."
    ),
    mapEmbedUrl: ""
  };
  await SiteSetting.create(defaults);

  const pageContent = [
    {
      key: "about",
      title: localized("About the Madrasa", "ادارے کا تعارف", "عن المؤسسة"),
      body: localized(
        "Madrasa Miftah ul Uloom is dedicated to combining authentic Islamic scholarship with thoughtful teaching and personal formation. The institution serves students and families through structured programmes in Qur'an, Arabic, and the Islamic sciences.\n\nThis website is the official content channel. Institutional details, dates, fees and contact information should be confirmed with the administration and updated in the admin dashboard.",
        "مدرسہ مفتاح العلوم مستند اسلامی علم کو بہترین تعلیم اور کردار کی تعمیر سے جوڑنے کے لیے کوشاں ہے۔ یہاں قرآن، عربی اور اسلامی علوم کے منظم پروگرام پیش کیے جاتے ہیں۔\n\nیہ ویب سائٹ ادارے کی معلومات کا ذریعہ ہے۔ تاریخوں، فیس اور رابطے کی تفصیلات کی تصدیق انتظامیہ سے کریں اور ایڈمن ڈیش بورڈ میں اپ ڈیٹ رکھیں۔",
        "تكرس مدرسة مفتاح العلوم جهودها للجمع بين العلم الإسلامي الأصيل والتعليم المتأني وبناء الشخصية. تخدم المؤسسة الطلاب والأسر من خلال برامج منظمة في القرآن والعربية والعلوم الإسلامية.\n\nهذا الموقع هو قناة المحتوى الرسمية. ينبغي تأكيد التفاصيل والمواعيد والرسوم ومعلومات الاتصال مع الإدارة وتحديثها في لوحة الإدارة."
      )
    },
    {
      key: "mission-vision",
      title: localized("Mission & Vision", "مشن وژن", "الرسالة والرؤية"),
      body: localized(
        "Mission: To provide structured, faithful and accessible Islamic education that helps students understand their religion with clarity, practise it with sincerity, and serve their communities with integrity.\n\nVision: To be a trusted centre of learning where scholarship, good character and service grow together, and where families can participate confidently in their children's education.\n\nThese statements are editable in the admin dashboard and should be reviewed and approved by the institution's leadership.",
        "مشن: ایسی منظم، مخلصانہ اور آسان اسلامی تعلیم فراہم کرنا جو طلبہ کو اپنے دین کو واضح طور پر سمجھنے، خلوص سے عمل کرنے اور دیانتداری سے خدمت کرنے میں مدد دے۔\n\nوژن: علم، اخلاق اور خدمت کا قابلِ اعتماد مرکز بننا، جہاں خاندان اپنے بچوں کی تعلیم میں اعتماد سے شریک ہو سکیں۔\n\nیہ بیانات ایڈمن ڈیش بورڈ میں تبدیل کیے جا سکتے ہیں اور ادارے کی قیادت سے منظور کرانا ضروری ہیں۔",
        "الرسالة: تقديم تعليم إسلامي منظم وأصيل وميسر يساعد الطلاب على فهم دينهم بوضوح والعمل به بإخلاص وخدمة مجتمعاتهم بأمانة.\n\nالرؤية: أن نكون مركزاً موثوقاً للتعلم تنمو فيه المعرفة والخلق والخدمة معاً، وتشارك فيه الأسر بثقة في تعليم أبنائها.\n\nيمكن تعديل هذه البيانات في لوحة الإدارة ويجب اعتمادها من قيادة المؤسسة."
      )
    },
    {
      key: "management",
      title: localized("Management Message", "انتظامیہ کا پیغام", "كلمة الإدارة"),
      body: localized(
        "A message from the management will be published here. The administration can add the principal's or director's verified message through the admin dashboard.\n\nUntil then, please use the contact page for official enquiries.",
        "یہاں انتظامیہ کا پیغام شائع ہوگا۔ انتظامیہ ایڈمن ڈیش بورڈ سے پرنسپل یا ڈائریکٹر کا تصدیق شدہ پیغام شامل کر سکتی ہے۔\n\nاس وقت تک سرکاری استفسارات کے لیے رابطہ صفحہ استعمال کریں۔",
        "ستُنشر هنا كلمة من الإدارة. يمكن للإدارة إضافة كلمة مدير المدرسة أو المدير التنفيذي الموثقة عبر لوحة الإدارة.\n\nحتى ذلك الحين، يرجى استخدام صفحة الاتصال للاستفسارات الرسمية."
      )
    },
    {
      key: "facilities",
      title: localized("Facilities", "سہولیات", "المرافق"),
      body: localized(
        "Details of classrooms, library, prayer areas and student facilities will be published here. Use the contact page to ask the administration about current facilities and campus visits.\n\nNo facility has been described here beyond what the administration chooses to publish.",
        "کلاس رومز، کتب خانے، نماز کی جگہوں اور طلبہ کی سہولیات کی تفصیلات یہاں شائع ہوں گی۔ موجودہ سہولیات اور کیمپس کے دورے کے بارے میں انتظامیہ سے رابطہ کریں۔\n\nانتظامیہ کی اشاعت کے علاوہ یہاں کوئی سہولت بیان نہیں کی گئی۔",
        "ستُنشر هنا تفاصيل الفصول الدراسية والمكتبة وأماكن الصلاة ومرافق الطلاب. استخدم صفحة الاتصال للسؤال عن المرافق الحالية وزيارة الحرم.\n\nلم يتم وصف أي مرفق هنا عدا ما تختار الإدارة نشره."
      )
    },
    {
      key: "privacy",
      title: localized("Privacy Policy", "پرائیویسی پالیسی", "سياسة الخصوصية"),
      body: localized(
        "This website collects information you provide through admissions, contact and bookstore forms, and information needed to operate secure accounts. Personal information is used to process applications, provide education and order services, maintain records, and respond to enquiries.\n\nPrivate admission documents are restricted to authorized staff. Passwords are stored using a salted password hash. Session cookies are HTTP-only and used for authentication. Data is retained according to the institution's academic, financial and legal needs; contact the administration to ask about access, correction or retention.\n\nThis is a configurable policy draft and must be reviewed by the institution before publication.",
        "یہ ویب سائٹ داخلہ، رابطہ اور کتابوں کی خریداری کے فارمز میں فراہم کردہ معلومات اور محفوظ اکاؤنٹس کے لیے ضروری معلومات جمع کرتی ہے۔ ذاتی معلومات درخواستوں کی کارروائی، تعلیمی و خریداری خدمات، ریکارڈ اور استفسارات کے جواب کے لیے استعمال ہوتی ہیں۔\n\nداخلے کی نجی دستاویزات صرف مجاز عملے کے لیے ہیں۔ پاس ورڈ محفوظ ہیش کے ذریعے رکھے جاتے ہیں۔ سیشن کوکیز صرف تصدیق کے لیے استعمال ہوتی ہیں۔ معلومات ادارے کی تعلیمی، مالی اور قانونی ضروریات کے مطابق محفوظ رہتی ہیں۔ رسائی یا اصلاح کے لیے انتظامیہ سے رابطہ کریں۔\n\nیہ ایک قابلِ ترمیم مسودہ پالیسی ہے اور اشاعت سے پہلے ادارے کا جائزہ ضروری ہے۔",
        "يجمع هذا الموقع المعلومات التي تقدمها عبر نماذج القبول والتواصل والمكتبة، والمعلومات اللازمة لتشغيل الحسابات الآمنة. تُستخدم المعلومات الشخصية لمعالجة الطلبات وتقديم خدمات التعليم والطلب وحفظ السجلات والرد على الاستفسارات.\n\nتقتصر مستندات القبول الخاصة على الموظفين المصرح لهم. تُحفظ كلمات المرور بتجزئة آمنة. تُستخدم ملفات تعريف الارتباط للجلسة للمصادقة فقط. تُحفظ البيانات وفق الاحتياجات الأكاديمية والمالية والقانونية للمؤسسة. تواصل مع الإدارة للاستفسار عن الوصول أو التصحيح.\n\nهذه مسودة سياسة قابلة للتعديل ويجب مراجعتها من المؤسسة قبل النشر."
      )
    },
    {
      key: "terms",
      title: localized("Terms of Use", "شرائط استعمال", "شروط الاستخدام"),
      body: localized(
        "By using this website, you agree to provide accurate information and to use the site lawfully. Admission submission does not guarantee enrolment. Book orders are subject to availability, confirmation, and the shipping, payment, cancellation and return policies published by the administration.\n\nAccounts are personal. Do not share passwords or attempt to access records that do not belong to you. The institution may update content, correct errors and suspend accounts that misuse the service.\n\nThis is a configurable terms draft and must be reviewed by the institution before publication.",
        "اس ویب سائٹ کے استعمال سے آپ درست معلومات فراہم کرنے اور قانونی طور پر استعمال کرنے پر متفق ہیں۔ داخلہ درخواست کا مطلب داخلہ کی ضمانت نہیں۔ کتابوں کے آرڈر دستیابی، تصدیق اور انتظامیہ کی شائع کردہ شپنگ، ادائیگی، منسوخی اور واپسی پالیسیوں کے تابع ہیں۔\n\nاکاؤنٹس ذاتی ہیں۔ پاس ورڈ شیئر نہ کریں اور غیر متعلقہ ریکارڈ تک رسائی کی کوشش نہ کریں۔ ادارہ مواد میں تبدیلی، غلطیاں درست کرنے اور ناجائز استعمال پر اکاؤنٹ معطل کرنے کا حق رکھتا ہے۔\n\nیہ ایک قابلِ ترمیم مسودہ ہے اور اشاعت سے پہلے ادارے کا جائزہ ضروری ہے۔",
        "باستخدامك هذا الموقع، توافق على تقديم معلومات دقيقة واستخدام الموقع بشكل قانوني. لا يضمن تقديم طلب القبول التسجيل. تخضع طلبات الكتب للتوفر والتأكيد وسياسات الشحن والدفع والإلغاء والإرجاع المنشورة من الإدارة.\n\nالحسابات شخصية. لا تشارك كلمات المرور ولا تحاول الوصول إلى سجلات لا تخصك. يحق للمؤسسة تحديث المحتوى وتصحيح الأخطاء وتعليق الحسابات المسيئة.\n\nهذه مسودة شروط قابلة للتعديل ويجب مراجعتها من المؤسسة قبل النشر."
      )
    }
  ];
  await PageContent.insertMany(pageContent);

  let admin: any = await User.findOne({ email: adminEmail });
  const demo: Record<string, string> = {};

  if (env.seedDemo) {
    const teacherUserPassword = randomPassword();
    const teacherUser = await User.create({
      name: "Demo Teacher Account",
      email: "teacher.demo@example.com",
      passwordHash: await hashPassword(teacherUserPassword),
      role: "teacher"
    });
    demo["Teacher portal"] = `teacher.demo@example.com / ${teacherUserPassword}`;

    const studentUserPassword = randomPassword();
    const studentUser = await User.create({
      name: "Demo Student Account",
      email: "student.demo@example.com",
      passwordHash: await hashPassword(studentUserPassword),
      role: "student"
    });
    demo["Student portal"] = `student.demo@example.com / ${studentUserPassword}`;

    const guardianUserPassword = randomPassword();
    const guardianUser = await User.create({
      name: "Demo Guardian Account",
      email: "guardian.demo@example.com",
      passwordHash: await hashPassword(guardianUserPassword),
      role: "guardian"
    });
    demo["Guardian portal"] = `guardian.demo@example.com / ${guardianUserPassword}`;

    const customerPassword = randomPassword();
    const customerUser = await User.create({
      name: "Demo Customer Account",
      email: "customer.demo@example.com",
      passwordHash: await hashPassword(customerPassword),
      role: "customer"
    });
    demo["Customer account"] = `customer.demo@example.com / ${customerPassword}`;

    const programsData = [
      {
        slug: "hifz-ul-quran",
        title: localized("Hifz-ul-Qur'an", "حفظ القرآن", "حفظ القرآن الكريم"),
        summary: localized(
          "A structured memorisation programme with careful revision and Tajweed guidance.",
          "منظم حفظ پروگرام، دہرائی اور تجوید کی رہنمائی کے ساتھ۔",
          "برنامج حفظ منظم مع مراجعة دقيقة وتوجيه في التجويد."
        ),
        description: localized(
          "The Hifz programme supports students in memorising the Qur'an with correct recitation, consistent revision and personal follow-up. Placement and daily targets are set after assessment by the teaching staff.",
          "حفظ پروگرام طلبہ کو صحیح تلاوت، مستقل دہرائی اور ذاتی نگرانی کے ساتھ قرآن یاد کرنے میں مدد دیتا ہے۔ داخلے کے بعد اساتذہ جائزے کے مطابق روزانہ ہدف مقرر کرتے ہیں۔",
          "يدعم برنامج الحفظ الطلاب في حفظ القرآن بتلاوة صحيحة ومراجعة منتظمة ومتابعة شخصية. تُحدد المستويات والأهداف اليومية بعد تقييم هيئة التدريس."
        ),
        duration: "Programme duration varies by student",
        ageGroup: "Placement after assessment",
        monthlyFeeNote: "Fee information is confirmed by the administration.",
        published: true,
        order: 1
      },
      {
        slug: "nazira-tajweed",
        title: localized("Nazira & Tajweed", "ناظرہ و تجوید", "الناظرة والتجويد"),
        summary: localized(
          "Foundational Qur'an reading with emphasis on accurate pronunciation and fluency.",
          "درست تلفظ اور روانی پر زور کے ساتھ بنیادی قرآن خوانی۔",
          "قراءة القرآن الأساسية مع التركيز على النطق الصحيح والطلاقة."
        ),
        description: localized(
          "This programme develops fluent and accurate Qur'an reading. Students study the rules of Tajweed and apply them under teacher supervision, with regular assessment and revision.",
          "یہ پروگرام روانی اور درستگی کے ساتھ قرآن پڑھنے کی مہارت پیدا کرتا ہے۔ طلبہ تجوید کے قواعد سیکھتے اور اساتذہ کی نگرانی میں ان پر عمل کرتے ہیں۔",
          "يطور هذا البرنامج قراءة القرآن بطلاقة ودقة. يدرس الطلاب أحكام التجويد ويطبقونها بإشراف المعلم مع تقييم ومراجعة منتظمة."
        ),
        duration: "Structured term-based programme",
        ageGroup: "Placement after assessment",
        monthlyFeeNote: "Fee information is confirmed by the administration.",
        published: true,
        order: 2
      },
      {
        slug: "alim-course",
        title: localized("Alim Course", "عالم کورس", "دورة العالم"),
        summary: localized(
          "A progressive programme in the Islamic sciences for committed students.",
          "اسلامی علوم میں سنجیدہ طلبہ کے لیے بتدریج پروگرام۔",
          "برنامج تدريجي في العلوم الإسلامية للطلاب الجادين."
        ),
        description: localized(
          "The Alim Course introduces students to the Islamic sciences, including Arabic, Fiqh, Hadith, Tafsir and history. Progression depends on assessment and the academic calendar set by the institution.",
          "عالم کورس عربی، فقہ، حدیث، تفسیر اور تاریخ سمیت اسلامی علوم سے روشناس کراتا ہے۔ ترقی کا انحصار جائزے اور ادارے کے تعلیمی کیلنڈر پر ہے۔",
          "تعرّف دورة العالم الطلاب على العلوم الإسلامية بما فيها العربية والفقه والحديث والتفسير والتاريخ. يعتمد التقدم على التقييم والتقويم الأكاديمي للمؤسسة."
        ),
        duration: "Multi-year programme",
        ageGroup: "Placement after assessment",
        monthlyFeeNote: "Fee information is confirmed by the administration.",
        published: true,
        order: 3
      },
      {
        slug: "arabic-language",
        title: localized("Arabic Language", "عربی زبان", "اللغة العربية"),
        summary: localized(
          "Arabic reading, writing and grammar for understanding Qur'anic and classical texts.",
          "قرآنی اور کلاسیکی متون کو سمجھنے کے لیے عربی پڑھائی، لکھائی اور گرامر۔",
          "القراءة والكتابة والنحو العربي لفهم النصوص القرآنية والكلاسيكية."
        ),
        description: localized(
          "A focused Arabic programme covering reading, writing, grammar and comprehension. Students practise vocabulary and sentence construction with teacher guidance.",
          "عربی پروگرام پڑھائی، لکھائی، گرامر اور فہم پر مرکوز ہے۔ طلبہ اساتذہ کی رہنمائی میں الفاظ اور جملوں کی مشق کرتے ہیں۔",
          "برنامج عربي متخصص يشمل القراءة والكتابة والنحو والفهم. يتدرب الطلاب على المفردات وتركيب الجمل بإشراف المعلم."
        ),
        duration: "Term-based programme",
        ageGroup: "Placement after assessment",
        monthlyFeeNote: "Fee information is confirmed by the administration.",
        published: true,
        order: 4
      },
      {
        slug: "islamic-studies-youth",
        title: localized("Islamic Studies for Youth", "نوجوانوں کے لیے اسلامی علوم", "العلوم الإسلامية للشباب"),
        summary: localized(
          "Essential knowledge and character-building for young learners.",
          "نوجوان طلبہ کے لیے بنیادی علم اور کردار سازی۔",
          "معرفة أساسية وبناء شخصية للمتعلمين الشباب."
        ),
        description: localized(
          "A supportive programme introducing young learners to the essentials of faith, worship and good character in an age-appropriate way.",
          "یہ پروگرام نوجوان طلبہ کو ایمان، عبادت اور اخلاق کی بنیادی باتوں سے عمر کے مطابق روشناس کراتا ہے۔",
          "برنامج داعم يعرّف المتعلمين الشباب بأساسيات الإيمان والعبادة والأخلاق بما يناسب أعمارهم."
        ),
        duration: "Term-based programme",
        ageGroup: "Youth",
        monthlyFeeNote: "Fee information is confirmed by the administration.",
        published: true,
        order: 5
      }
    ];
    const programs = await Program.insertMany(programsData);
    const programBySlug = new Map(programs.map((program) => [program.slug, program]));

    const session = await AcademicSession.create({
      name: sessionName,
      startDate: new Date(`${year}-08-01T00:00:00.000Z`),
      endDate: new Date(`${year + 1}-05-31T00:00:00.000Z`),
      isActive: true
    });
    const previousSession = await AcademicSession.create({
      name: `${year - 1}–${year}`,
      startDate: new Date(`${year - 1}-08-01T00:00:00.000Z`),
      endDate: new Date(`${year}-05-31T00:00:00.000Z`),
      isActive: false
    });

    const teachers = await Teacher.insertMany([
      {
        teacherId: newTeacherId(),
        name: "Demo Teacher One",
        user: teacherUser._id,
        qualifications: "Demo qualification — replace with verified details",
        email: "teacher.demo@example.com",
        phone: "+92 300 0000000",
        bio: localized(
          "Sample faculty profile for testing. Replace with a verified profile before publishing.",
          "جانچ کے لیے نمونہ پروفائل۔ اشاعت سے پہلے تصدیق شدہ پروفائل درج کریں۔",
          "ملف تجريبي للاختبار. استبدله بملف موثق قبل النشر."
        ),
        programs: [programBySlug.get("hifz-ul-quran")!._id, programBySlug.get("nazira-tajweed")!._id],
        published: false,
        demo: true
      },
      {
        teacherId: newTeacherId(),
        name: "Demo Teacher Two",
        qualifications: "Demo qualification — replace with verified details",
        bio: localized("Sample faculty profile for testing.", "جانچ کے لیے نمونہ پروفائل۔", "ملف تجريبي."),
        programs: [programBySlug.get("arabic-language")!._id],
        published: false,
        demo: true
      },
      {
        teacherId: newTeacherId(),
        name: "Demo Teacher Three",
        qualifications: "Demo qualification — replace with verified details",
        bio: localized("Sample faculty profile for testing.", "جانچ کے لیے نمونہ پروفائل۔", "ملف تجريبي."),
        programs: [programBySlug.get("alim-course")!._id],
        published: false,
        demo: true
      }
    ]);

    const subjects = await Subject.insertMany([
      { name: "Qur'an", code: "QRN-101", program: programBySlug.get("hifz-ul-quran")!._id },
      { name: "Tajweed", code: "TJW-101", program: programBySlug.get("hifz-ul-quran")!._id },
      { name: "Arabic Grammar", code: "ARB-101", program: programBySlug.get("alim-course")!._id },
      { name: "Fiqh", code: "FQH-101", program: programBySlug.get("alim-course")!._id },
      { name: "Hadith", code: "HDT-101", program: programBySlug.get("alim-course")!._id },
      { name: "Islamic History", code: "HST-101", program: programBySlug.get("alim-course")!._id }
    ]);

    const hifzClass = await SchoolClass.create({
      name: "Hifz Level 1",
      section: "A",
      program: programBySlug.get("hifz-ul-quran")!._id,
      session: session._id,
      teacher: teachers[0]._id,
      capacity: 30
    });
    const naziraClass = await SchoolClass.create({
      name: "Nazira Level 1",
      section: "A",
      program: programBySlug.get("nazira-tajweed")!._id,
      session: session._id,
      teacher: teachers[0]._id,
      capacity: 30
    });
    const alimClass = await SchoolClass.create({
      name: "Alim Year 1",
      section: "A",
      program: programBySlug.get("alim-course")!._id,
      session: session._id,
      teacher: teachers[2]._id,
      capacity: 30
    });
    teachers[0].classes = [hifzClass._id, naziraClass._id];
    teachers[0].subjects = [subjects[0]._id, subjects[1]._id];
    teachers[2].classes = [alimClass._id];
    teachers[2].subjects = [subjects[2]._id, subjects[3]._id, subjects[4]._id, subjects[5]._id];
    await teachers[0].save();
    await teachers[2].save();
    subjects[0].classes = [hifzClass._id];
    subjects[1].classes = [hifzClass._id, naziraClass._id];
    subjects[2].classes = [alimClass._id];
    subjects[3].classes = [alimClass._id];
    subjects[4].classes = [alimClass._id];
    subjects[5].classes = [alimClass._id];
    await Promise.all(subjects.map((subject) => subject.save()));

    const studentNames = [
      "Demo Student Ayesha",
      "Demo Student Bilal",
      "Demo Student Hamza",
      "Demo Student Khadija",
      "Demo Student Yusuf",
      "Demo Student Maryam"
    ];
    const students = [];
    for (let index = 0; index < studentNames.length; index += 1) {
      const classDoc = index < 3 ? hifzClass : index < 5 ? naziraClass : alimClass;
      const programDoc = index < 3
        ? programBySlug.get("hifz-ul-quran")
        : index < 5
          ? programBySlug.get("nazira-tajweed")
          : programBySlug.get("alim-course");
      students.push(
        await Student.create({
          studentId: newStudentId(),
          name: studentNames[index],
          dob: new Date(`${year - 10 - index}-01-15T00:00:00.000Z`),
          gender: index % 2 === 0 ? "female" : "male",
          address: "Demo address — replace with verified details",
          previousEducation: "Demo previous education",
          guardian: {
            name: "Demo Guardian One",
            relationship: "Parent",
            phone: "+92 300 0000000",
            email: "guardian.demo@example.com"
          },
          guardianUsers: index < 2 ? [guardianUser._id] : [],
          user: index === 0 ? studentUser._id : null,
          program: programDoc!._id,
          class: classDoc._id,
          session: session._id,
          status: "active",
          demo: true
        })
      );
    }

    const guardian = await Guardian.create({
      name: "Demo Guardian One",
      phone: "+92 300 0000000",
      email: "guardian.demo@example.com",
      user: guardianUser._id,
      children: [students[0]._id, students[1]._id],
      demo: true
    });
    void guardian;

    const attendanceStatuses = ["present", "present", "present", "late", "present", "absent", "leave"];
    let dayOffset = 0;
    let recordedDays = 0;
    while (recordedDays < 8) {
      const date = day(-dayOffset);
      dayOffset += 1;
      if (date.getDay() === 0) continue;
      recordedDays += 1;
      for (const student of students) {
        const status =
          attendanceStatuses[(recordedDays + students.indexOf(student)) % attendanceStatuses.length];
        await Attendance.create({
          student: student._id,
          class: student.class,
          date,
          status,
          markedBy: teacherUser._id
        });
      }
    }

    const examPublished = await Exam.create({
      title: "First Term Examination",
      program: programBySlug.get("hifz-ul-quran")!._id,
      class: hifzClass._id,
      session: session._id,
      startDate: day(-14),
      subjects: [
        { subject: subjects[0]._id, maxMarks: 100, passMarks: 40 },
        { subject: subjects[1]._id, maxMarks: 100, passMarks: 40 },
        { subject: subjects[2]._id, maxMarks: 100, passMarks: 40 }
      ],
      published: true,
      demo: true
    });
    const examDraft = await Exam.create({
      title: "Nazira Term Assessment (Draft)",
      program: programBySlug.get("nazira-tajweed")!._id,
      class: naziraClass._id,
      session: session._id,
      startDate: day(-7),
      subjects: [{ subject: subjects[1]._id, maxMarks: 100, passMarks: 40 }],
      published: false,
      demo: true
    });

    const markSets = [
      [92, 88, 90],
      [78, 82, 74],
      [55, 61, 48]
    ];
    for (let index = 0; index < 3; index += 1) {
      const marks = markSets[index];
      for (let subjectIndex = 0; subjectIndex < 3; subjectIndex += 1) {
        const maxMarks = 100;
        await Result.create({
          exam: examPublished._id,
          student: students[index]._id,
          subject: examPublished.subjects[subjectIndex].subject,
          obtainedMarks: marks[subjectIndex],
          maxMarks,
          grade: gradeFor((marks[subjectIndex] / maxMarks) * 100),
          enteredBy: teacherUser._id
        });
      }
    }
    for (let index = 0; index < 2; index += 1) {
      const marks = markSets[index];
      await Result.create({
        exam: examDraft._id,
        student: students[3 + index]._id,
        subject: subjects[1]._id,
        obtainedMarks: marks[index] - 5,
        maxMarks: 100,
        grade: gradeFor(((marks[index] - 5) / 100) * 100),
        enteredBy: teacherUser._id
      });
    }

    const feeStructure = await FeeStructure.create({
      name: "Monthly Programme Fee",
      program: programBySlug.get("hifz-ul-quran")!._id,
      session: session._id,
      items: [
        { title: "Monthly tuition", amount: 1500, dueDate: day(-10) },
        { title: "Books and materials", amount: 500, dueDate: day(-10) }
      ],
      active: true,
      demo: true
    });

    const invoiceFor = async (student: any, paidAmount: number, label: string) => {
      const items = [
        { title: "Monthly tuition", amount: 1500 },
        { title: "Books and materials", amount: 500 }
      ];
      const total = 2000;
      const balance = total - paidAmount;
      const invoice = await Invoice.create({
        invoiceNumber: invoiceNumber(),
        student: student._id,
        session: session._id,
        items,
        discount: 0,
        fine: 0,
        total,
        paid: paidAmount,
        balance,
        status: balance <= 0 ? "paid" : paidAmount > 0 ? "partial" : "overdue",
        dueDate: day(-10),
        notes: `Demo invoice (${label})`,
        demo: true
      });
      if (paidAmount > 0) {
        await Payment.create({
          receiptNumber: receiptNumber(),
          invoice: invoice._id,
          student: student._id,
          amount: paidAmount,
          method: "cash",
          note: "Demo payment",
          recordedBy: teacherUser._id
        });
      }
      return invoice;
    };
    await invoiceFor(students[0], 2000, "paid");
    await invoiceFor(students[1], 1000, "partial");
    await invoiceFor(students[2], 0, "overdue");
    void feeStructure;

    const admissionSeeds = [
      {
        studentName: "Demo Applicant One",
        status: "submitted",
        note: "Demo application — no document uploaded.",
        dob: new Date(`${year - 12}-03-10T00:00:00.000Z`)
      },
      {
        studentName: "Demo Applicant Two",
        status: "under_review",
        note: "Demo application under review.",
        dob: new Date(`${year - 9}-07-22T00:00:00.000Z`)
      },
      {
        studentName: "Demo Applicant Three",
        status: "additional_information_required",
        note: "Demo application awaiting further information.",
        dob: new Date(`${year - 14}-11-02T00:00:00.000Z`)
      }
    ];
    for (const [index, entry] of admissionSeeds.entries()) {
      const pin = trackingPin();
      const admission = await Admission.create({
        reference: admissionReference(),
        pinHash: sha256(pin),
        studentName: entry.studentName,
        dob: entry.dob,
        gender: "male",
        guardianName: `Demo Guardian ${index + 1}`,
        relationship: "Parent",
        phone: "+92 300 0000000",
        email: `guardian${index + 1}@example.com`,
        address: "Demo address — replace with verified details",
        previousEducation: "Demo previous education",
        program: programBySlug.get("hifz-ul-quran")!._id,
        session: session._id,
        status: entry.status as any,
        statusHistory: [{ status: entry.status as any, note: entry.note, at: day(-index - 1) }],
        demo: true
      });
      demo[`Admission tracking (${entry.studentName})`] = `${admission.reference} / PIN ${pin}`;
    }

    const categories = await BookCategory.insertMany([
      { name: localized("Qur'an & Tafsir", "قرآن و تفسیر", "القرآن والتفسير"), slug: "quran-tafsir", order: 1 },
      { name: localized("Hadith", "حدیث", "الحديث"), slug: "hadith", order: 2 },
      { name: localized("Fiqh", "فقہ", "الفقه"), slug: "fiqh", order: 3 },
      { name: localized("Seerah", "سیرت", "السيرة"), slug: "seerah", order: 4 },
      { name: localized("Arabic Language", "عربی زبان", "اللغة العربية"), slug: "arabic-language", order: 5 },
      { name: localized("Children", "بچوں کی کتابیں", "كتب الأطفال"), slug: "children", order: 6 }
    ]);
    const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

    const booksData = [
      {
        slug: "noble-quran-english",
        title: localized("The Noble Qur'an (English)", "قرآن مجید (انگریزی ترجمہ)", "القرآن الكريم (بالإنجليزية)"),
        author: "Translation of meanings",
        translator: "Abdullah Yusuf Ali",
        description: localized(
          "An English translation of the meanings of the Qur'an for study and reflection. Sample catalogue entry; confirm edition and publisher before fulfilment.",
          "مطالعے کے لیے قرآن مجید کے معانی کا انگریزی ترجمہ۔ نمونہ کیٹلاگ اندراج؛ فراہمی سے پہلے ایڈیشن اور ناشر کی تصدیق کریں۔",
          "ترجمة إنجليزية لمعاني القرآن للدراسة والتدبر. مدخل تجريبي؛ تحقق من الطبعة والناشر قبل التسليم."
        ),
        category: categoryBySlug.get("quran-tafsir")!._id,
        language: "en",
        price: 2200,
        salePrice: 1950,
        sku: "QRN-EN-001",
        isbn: "978-0000000001",
        publisher: "Sample publisher",
        publicationYear: "Sample edition",
        pages: 800,
        stock: 14,
        lowStockThreshold: 4,
        published: true,
        featured: true
      },
      {
        slug: "riyad-us-salihin",
        title: localized("Riyad us-Salihin", "ریاض الصالحین", "رياض الصالحين"),
        author: "Imam Yahya an-Nawawi",
        description: localized(
          "A well-known collection of hadith on worship, character and daily conduct. Sample catalogue entry; confirm edition before ordering.",
          "عبادت، اخلاق اور روزمرہ زندگی کی احادیث کا مشہور مجموعہ۔ نمونہ اندراج؛ آرڈر سے پہلے ایڈیشن کی تصدیق کریں۔",
          "مجموعة حديثية مشهورة في العبادات والأخلاق والسلوك اليومي. مدخل تجريبي؛ تحقق من الطبعة قبل الطلب."
        ),
        category: categoryBySlug.get("hadith")!._id,
        language: "ur",
        price: 1800,
        sku: "HDT-UR-001",
        publisher: "Sample publisher",
        pages: 640,
        stock: 9,
        lowStockThreshold: 3,
        published: true,
        featured: true
      },
      {
        slug: "tirmidhi-selected-hadith",
        title: localized("Selected Hadith for Daily Life", "روزمرہ زندگی کی احادیث", "أحاديث مختارة للحياة اليومية"),
        author: "Sample compilation",
        description: localized(
          "A sample selection of hadith covering manners, family life and worship. Replace this sample catalogue data with verified publication details.",
          "آداب، خاندانی زندگی اور عبادت سے متعلق احادیث کا نمونہ انتخاب۔ اس نمونہ ڈیٹا کو تصدیق شدہ تفصیلات سے بدلیں۔",
          "اختيار تجريبي لأحاديث في الآداب والحياة الأسرية والعبادة. استبدل بيانات هذا المدخل بتفاصيل نشر موثقة."
        ),
        category: categoryBySlug.get("hadith")!._id,
        language: "en",
        price: 1250,
        salePrice: 999,
        sku: "HDT-EN-002",
        stock: 3,
        lowStockThreshold: 5,
        published: true
      },
      {
        slug: "tafsir-ibn-kathir-volume-1",
        title: localized("Tafsir Ibn Kathir — Volume 1", "تفسیر ابن کثیر — جلد اول", "تفسير ابن كثير — الجزء الأول"),
        author: "Hafiz Ibn Kathir",
        description: localized(
          "Volume one of a widely used tafsir. Sample catalogue entry; confirm edition, language and publisher before ordering.",
          "مشہور تفسیر کی پہلی جلد۔ نمونہ اندراج؛ آرڈر سے پہلے ایڈیشن، زبان اور ناشر کی تصدیق کریں۔",
          "الجزء الأول من تفسير واسع الانتشار. مدخل تجريبي؛ تحقق من الطبعة واللغة والناشر قبل الطلب."
        ),
        category: categoryBySlug.get("quran-tafsir")!._id,
        language: "en",
        price: 3500,
        sku: "QRN-EN-002",
        stock: 7,
        lowStockThreshold: 3,
        published: true,
        featured: true
      },
      {
        slug: "the-sealed-nectar",
        title: localized("The Sealed Nectar", "الرحيق المختوم", "الرحيق المختوم"),
        author: "Safi-ur-Rahman al-Mubarakpuri",
        description: localized(
          "A widely read biography of the Prophet Muhammad ﷺ. Sample catalogue entry; confirm edition before ordering.",
          "نبی کریم ﷺ کی سیرت پر مشہور کتاب۔ نمونہ اندراج؛ آرڈر سے پہلے ایڈیشن کی تصدیق کریں۔",
          "سيرة مشهورة للنبي محمد ﷺ. مدخل تجريبي؛ تحقق من الطبعة قبل الطلب."
        ),
        category: categoryBySlug.get("seerah")!._id,
        language: "en",
        price: 1600,
        salePrice: 1450,
        sku: "SIR-EN-001",
        stock: 12,
        lowStockThreshold: 4,
        published: true
      },
      {
        slug: "fiqh-al-sunnah",
        title: localized("Fiqh us-Sunnah", "فقہ السنہ", "فقه السنة"),
        author: "Sayyid Sabiq",
        description: localized(
          "A classic reference on practical fiqh. Sample catalogue entry; confirm edition and translation before ordering.",
          "عملی فقہ کی کلاسیکی حوالہ کتاب۔ نمونہ اندراج؛ آرڈر سے پہلے ایڈیشن اور ترجمے کی تصدیق کریں۔",
          "مرجع كلاسيكي في الفقه العملي. مدخل تجريبي؛ تحقق من الطبعة والترجمة قبل الطلب."
        ),
        category: categoryBySlug.get("fiqh")!._id,
        language: "ur",
        price: 2400,
        sku: "FQH-UR-001",
        stock: 0,
        lowStockThreshold: 3,
        published: true
      },
      {
        slug: "arabic-grammar-primer",
        title: localized("Arabic Grammar Primer", "عربی گرامر کا بنیادی نصاب", "مقدمة في النحو العربي"),
        author: "Sample curriculum material",
        description: localized(
          "A sample primer for Arabic grammar students. This is demonstration catalogue content, not a published institutional textbook.",
          "عربی گرامر کے طلبہ کے لیے نمونہ نصاب۔ یہ مظاہرے کا کیٹلاگ مواد ہے، ادارے کی شائع شدہ کتاب نہیں۔",
          "مقدمة تجريبية لطلاب النحو العربي. هذا محتوى كتالوج توضيحي وليس كتاباً مؤسسياً منشوراً."
        ),
        category: categoryBySlug.get("arabic-language")!._id,
        language: "ur",
        price: 900,
        sku: "ARB-UR-001",
        stock: 20,
        lowStockThreshold: 5,
        published: true
      },
      {
        slug: "stories-of-the-prophets",
        title: localized("Stories of the Prophets", "قصص الأنبیاء", "قصص الأنبياء"),
        author: "Hafiz Ibn Kathir",
        description: localized(
          "A collection of prophetic stories for general readers. Sample catalogue entry; confirm edition before ordering.",
          "عام قارئین کے لیے انبیاء کی قصص کا مجموعہ۔ نمونہ اندراج؛ آرڈر سے پہلے ایڈیشن کی تصدیق کریں۔",
          "مجموعة من قصص الأنبياء للقارئ العام. مدخل تجريبي؛ تحقق من الطبعة قبل الطلب."
        ),
        category: categoryBySlug.get("children")!._id,
        language: "en",
        price: 1200,
        salePrice: 1100,
        sku: "CHD-EN-001",
        stock: 16,
        lowStockThreshold: 4,
        published: true
      },
      {
        slug: "forty-hadith-for-children",
        title: localized("Forty Hadith for Children", "بچوں کے لیے چالیس احادیث", "أربعون حديثاً للأطفال"),
        author: "Sample compilation",
        description: localized(
          "A sample children's hadith collection with short lessons. Replace this demo entry with a verified edition.",
          "مختصر سبق کے ساتھ بچوں کی احادیث کا نمونہ مجموعہ۔ اس نمونے کو تصدیق شدہ ایڈیشن سے بدلیں۔",
          "مجموعة تجريبية لأطفال مع دروس قصيرة. استبدل هذا المدخل بطبعة موثقة."
        ),
        category: categoryBySlug.get("children")!._id,
        language: "ar",
        price: 750,
        sku: "CHD-AR-001",
        stock: 25,
        lowStockThreshold: 5,
        published: true
      },
      {
        slug: "sample-unreleased-book",
        title: localized("Unreleased Sample Book", "غیر شائع نمونہ کتاب", "كتاب تجريبي غير منشور"),
        author: "Demo author",
        description: localized(
          "This book is intentionally unpublished so administrators can verify that draft titles do not appear in the public store.",
          "یہ کتاب جان بوجھ کر غیر شائع ہے تاکہ تصدیق ہو سکے کہ مسودہ کتب عوامی اسٹور میں ظاہر نہیں ہوتیں۔",
          "هذا الكتاب غير منشور عمداً ليتحقق المسؤولون من عدم ظهور المسودات في المتجر العام."
        ),
        category: categoryBySlug.get("hadith")!._id,
        language: "en",
        price: 500,
        sku: "DEMO-UNPUBLISHED-1",
        stock: 5,
        lowStockThreshold: 3,
        published: false
      }
    ];
    const books = await Book.insertMany(
      booksData.map((book) => ({
        ...book,
        createdBy: admin._id
      }))
    );
    for (const book of books) {
      if (book.stock > 0) {
        await InventoryMovement.create({
          book: book._id,
          delta: book.stock,
          reason: "seed_initial_stock",
          stockAfter: book.stock
        });
      }
    }

    const orderBookOne = books[0];
    const orderBookTwo = books[4];
    const orderQtyOne = 1;
    const orderQtyTwo = 2;
    const unitOne = orderBookOne.salePrice ?? orderBookOne.price;
    const unitTwo = orderBookTwo.salePrice ?? orderBookTwo.price;
    const subtotal = unitOne * orderQtyOne + unitTwo * orderQtyTwo;
    const shipping = subtotal >= env.DEFAULT_FREE_SHIPPING_ABOVE ? 0 : env.DEFAULT_SHIPPING_FEE;
    const demoOrder = await Order.create({
      orderNumber: orderNumber(),
      accessTokenHash: sha256(randomToken(32)),
      user: customerUser._id,
      customerName: "Demo Customer Account",
      phone: "+92 300 0000000",
      email: "customer.demo@example.com",
      address: "Demo delivery address — replace",
      city: "Demo city",
      notes: "Seeded demonstration order.",
      items: [
        {
          book: orderBookOne._id,
          title: orderBookOne.title.en,
          sku: orderBookOne.sku,
          unitPrice: unitOne,
          quantity: orderQtyOne
        },
        {
          book: orderBookTwo._id,
          title: orderBookTwo.title.en,
          sku: orderBookTwo.sku,
          unitPrice: unitTwo,
          quantity: orderQtyTwo
        }
      ],
      subtotal,
      shipping,
      total: subtotal + shipping,
      paymentMethod: "cod",
      paymentStatus: "cash_on_delivery",
      fulfilmentStatus: "pending",
      statusHistory: [
        { fulfilmentStatus: "pending", paymentStatus: "cash_on_delivery", note: "Seeded demo order." }
      ],
      demo: true
    });
    await Book.updateOne({ _id: orderBookOne._id }, { $inc: { stock: -orderQtyOne } });
    await Book.updateOne({ _id: orderBookTwo._id }, { $inc: { stock: -orderQtyTwo } });
    await InventoryMovement.create([
      {
        book: orderBookOne._id,
        delta: -orderQtyOne,
        reason: "order_placed",
        order: demoOrder._id,
        stockAfter: Math.max(0, orderBookOne.stock - orderQtyOne)
      },
      {
        book: orderBookTwo._id,
        delta: -orderQtyTwo,
        reason: "order_placed",
        order: demoOrder._id,
        stockAfter: Math.max(0, orderBookTwo.stock - orderQtyTwo)
      }
    ]);

    const announcements = [
      {
        title: localized(
          "Admissions information now available",
          "داخلے کی معلومات دستیاب ہیں",
          "معلومات القبول متاحة الآن"
        ),
        body: localized(
          "Families may review the admissions information and submit an application online. Please contact the administration to confirm current dates, requirements and fees.",
          "خاندان داخلے کی معلومات دیکھ سکتے اور آن لائن درخواست جمع کرا سکتے ہیں۔ موجودہ تاریخوں، تقاضوں اور فیس کی تصدیق انتظامیہ سے کریں۔",
          "يمكن للأسر مراجعة معلومات القبول وتقديم الطلب إلكترونياً. يرجى التواصل مع الإدارة لتأكيد المواعيد والمتطلبات والرسوم الحالية."
        ),
        category: "admissions",
        published: true,
        publishDate: day(-2),
        pinned: true,
        audience: ["public"]
      },
      {
        title: localized("Parent-teacher meeting", "اساتذہ اور والدین کا اجلاس", "اجتماع أولياء الأمور والمعلمين"),
        body: localized(
          "A parent-teacher meeting is being planned. Confirm the date and timing with the administration before making travel arrangements.",
          "اساتذہ اور والدین کا اجلاس منصوبہ بندی میں ہے۔ سفر کا انتظام کرنے سے پہلے تاریخ اور وقت کی تصدیق انتظامیہ سے کریں۔",
          "يجري التخطيط لاجتماع أولياء الأمور والمعلمين. أكد التاريخ والوقت مع الإدارة قبل ترتيب السفر."
        ),
        category: "notice",
        published: true,
        publishDate: day(-5),
        pinned: false,
        audience: ["public", "guardians"]
      },
      {
        title: localized("Library reading week", "کتب خانہ مطالعہ ہفتہ", "أسبوع القراءة في المكتبة"),
        body: localized(
          "Students are encouraged to use the library and reading resources. Details of the schedule will be shared by teachers.",
          "طلبہ کو کتب خانے اور مطالعے کے ذرائع استعمال کرنے کی ترغیب دی جاتی ہے۔ شیڈول کی تفصیلات اساتذہ بتائیں گے۔",
          "يُشجّع الطلاب على استخدام المكتبة وموارد القراءة. سيشارك المعلمون تفاصيل الجدول."
        ),
        category: "academic",
        published: true,
        publishDate: day(-8),
        audience: ["public", "students", "guardians"]
      },
      {
        title: localized("Student portal available", "طلبہ پورٹل دستیاب ہے", "بوابة الطالب متاحة"),
        body: localized(
          "Students with activated accounts can view attendance, published results and fee records. Contact the administration if you need account help.",
          "فعال اکاؤنٹ رکھنے والے طلبہ حاضری، شائع شدہ نتائج اور فیس ریکارڈ دیکھ سکتے ہیں۔ اکاؤنٹ میں مدد کے لیے انتظامیہ سے رابطہ کریں۔",
          "يمكن للطلاب ذوي الحسابات المفعلة عرض الحضور والنتائج المنشورة وسجلات الرسوم. تواصل مع الإدارة للمساعدة."
        ),
        category: "portal",
        published: true,
        publishDate: day(-12),
        audience: ["students", "guardians"]
      },
      {
        title: localized("Faculty note", "اساتذہ کے لیے نوٹس", "ملاحظة لهيئة التدريس"),
        body: localized(
          "Teachers can use the teacher portal to record attendance and enter marks for assigned classes. Contact the administration for access issues.",
          "اساتذہ اساتذہ پورٹل سے اپنی مقررہ کلاسوں کی حاضری اور نمبر درج کر سکتے ہیں۔ رسائی کے مسائل کے لیے انتظامیہ سے رابطہ کریں۔",
          "يمكن للمعلمين استخدام بوابة المعلم لتسجيل الحضور وإدخال الدرجات للفصول المخصصة. تواصل مع الإدارة لمشاكل الوصول."
        ),
        category: "portal",
        published: true,
        publishDate: day(-15),
        audience: ["teachers"]
      }
    ];
    await Announcement.insertMany(announcements);

    await Event.insertMany([
      {
        slug: "sample-quran-recitation-gathering",
        title: localized("Qur'an Recitation Gathering", "قرآن تلاوت محفل", "ملتقى تلاوة القرآن"),
        description: localized(
          "A sample event entry for the website. Confirm the date, venue, programme and participation details with the administration before attending.",
          "ویب سائٹ کے لیے نمونہ تقریب۔ شرکت سے پہلے تاریخ، مقام، پروگرام اور شرکت کی تفصیلات انتظامیہ سے تصدیق کریں۔",
          "مدخل فعال تجريبي. أكد التاريخ والمكان والبرنامج وتفاصيل المشاركة مع الإدارة قبل الحضور."
        ),
        startDate: day(21),
        endDate: day(21),
        location: localized(
          "Main campus — venue to be confirmed",
          "مرکزی کیمپس — مقام کی تصدیق ہونا باقی ہے",
          "الحرم الرئيسي — المكان قيد التأكيد"
        ),
        published: true,
        featured: true
      },
      {
        slug: "sample-parent-orientation",
        title: localized("Parent Orientation Session", "والدین کے لیے تعارفی نشست", "جلسة تعريفية لأولياء الأمور"),
        description: localized(
          "A sample orientation listing. The administration should confirm the schedule and whether the session will be in person or online.",
          "تعارفی نشست کا نمونہ اندراج۔ انتظامیہ شیڈول اور نشست کی نوعیت کی تصدیق کرے۔",
          "مدخل تجريبي. يجب على الإدارة تأكيد الجدول وما إذا كانت الجلسة حضورية أو عن بعد."
        ),
        startDate: day(38),
        location: localized(
          "Venue to be confirmed",
          "مقام کی تصدیق ہونا باقی ہے",
          "المكان قيد التأكيد"
        ),
        published: true
      }
    ]);

    await GalleryItem.insertMany([
      {
        title: localized("Sample gallery image", "نمونہ تصویر", "صورة تجريبية"),
        alt: localized(
          "Sample gallery placeholder — replace with a real campus photo",
          "نمونہ گیلری پلیس ہولڈر — اصل تصویر سے بدلیں",
          "صورة معرض تجريبية — استبدلها بصورة حقيقية"
        ),
        image: "/branding/gallery-placeholder.svg",
        category: "campus",
        order: 1,
        published: true
      },
      {
        title: localized("Sample learning space", "نمونہ تعلیمی جگہ", "مساحة تعلم تجريبية"),
        alt: localized(
          "Sample gallery placeholder — replace with a real learning space photo",
          "نمونہ گیلری پلیس ہولڈر — اصل تصویر سے بدلیں",
          "صورة معرض تجريبية — استبدلها بصورة حقيقية"
        ),
        image: "/branding/gallery-placeholder.svg",
        category: "learning",
        order: 2,
        published: true
      },
      {
        title: localized("Sample library image", "نمونہ کتب خانہ تصویر", "صورة مكتبة تجريبية"),
        alt: localized(
          "Sample gallery placeholder — replace with a real library photo",
          "نمونہ گیلری پلیس ہولڈر — اصل تصویر سے بدلیں",
          "صورة معرض تجريبية — استبدلها بصورة حقيقية"
        ),
        image: "/branding/gallery-placeholder.svg",
        category: "library",
        order: 3,
        published: true
      }
    ]);

    await Faq.insertMany([
      {
        question: localized("How do I apply for admission?", "داخلے کے لیے کیسے درخواست دیں؟", "كيف أتقدم للقبول؟"),
        answer: localized(
          "Use the admissions page to review the information and submit the online application. After submitting, keep the reference and tracking PIN to check the status.",
          "داخلہ صفحے پر معلومات دیکھ کر آن لائن درخواست جمع کرائیں۔ جمع کرانے کے بعد حوالہ نمبر اور ٹریکنگ پن سنبھال کر رکھیں۔",
          "استخدم صفحة القبول لمراجعة المعلومات وتقديم الطلب الإلكتروني. بعد التقديم احفظ رقم المرجع ورمز التتبع للتحقق من الحالة."
        ),
        category: "admissions",
        order: 1
      },
      {
        question: localized("Is the admission application a confirmation of enrolment?", "کیا داخلہ درخواست داخلے کی تصدیق ہے؟", "هل طلب القبول يؤكد التسجيل؟"),
        answer: localized(
          "No. An application must be reviewed by the administration. Enrolment is confirmed only after approval and communication from the institution.",
          "نہیں۔ درخواست کا انتظامیہ جائزہ لے گی۔ داخلہ صرف منظوری اور ادارے کی اطلاع کے بعد تصدیق ہوتا ہے۔",
          "لا. يجب مراجعة الطلب من الإدارة. لا يتم تأكيد التسجيل إلا بعد الموافقة والتواصل من المؤسسة."
        ),
        category: "admissions",
        order: 2
      },
      {
        question: localized("How can I track my application?", "میں درخواست کی صورتِ حال کیسے دیکھوں؟", "كيف أتابع طلبي؟"),
        answer: localized(
          "Open the admissions tracking page and enter both the application reference and the six-digit tracking PIN shown after submission.",
          "داخلہ ٹریکنگ صفحہ کھولیں اور درخواست کا حوالہ نمبر اور جمع کرانے کے بعد دیا گیا چھ ہندسوں کا پن درج کریں۔",
          "افتح صفحة تتبع القبول وأدخل رقم المرجع ورمز التتبع المكون من ستة أرقام الذي ظهر بعد التقديم."
        ),
        category: "admissions",
        order: 3
      },
      {
        question: localized("What payment methods are available for books?", "کتابوں کی ادائیگی کے کون سے طریقے ہیں؟", "ما طرق الدفع المتاحة للكتب؟"),
        answer: localized(
          "The checkout page shows the methods enabled by the administration. Currently available methods may include cash on delivery and, when enabled, manual bank transfer. No card payment is processed on this site.",
          "چیک آؤٹ صفحہ انتظامیہ کے فعال کردہ طریقے دکھاتا ہے۔ دستیاب طریقوں میں کیش آن ڈیلیوری اور فعال ہونے پر بینک ٹرانسفر شامل ہو سکتا ہے۔ اس سائٹ پر کارڈ ادائیگی نہیں ہوتی۔",
          "تعرض صفحة الدفع الطرق التي فعلتها الإدارة. قد تشمل الطرق المتاحة الدفع عند الاستلام والتحويل البنكي اليدوي عند تفعيله. لا تتم مدفوعات البطاقات على هذا الموقع."
        ),
        category: "books",
        order: 4
      },
      {
        question: localized("How do I access a student or guardian account?", "طلبہ یا والدین کا اکاؤنٹ کیسے حاصل کریں؟", "كيف أحصل على حساب طالب أو ولي أمر؟"),
        answer: localized(
          "Accounts are linked by the administration after verification. Contact the office if you need an account created or linked to a student record.",
          "تصدیق کے بعد انتظامیہ اکاؤنٹ لنک کرتی ہے۔ اکاؤنٹ بنوانے یا طالب علم کے ریکارڈ سے لنک کرانے کے لیے دفتر سے رابطہ کریں۔",
          "تربط الإدارة الحسابات بعد التحقق. تواصل مع المكتب لإنشاء حساب أو ربطه بسجل طالب."
        ),
        category: "accounts",
        order: 5
      }
    ]);

    await ContactMessage.create({
      name: "Demo Visitor",
      email: "visitor@example.com",
      phone: "+92 300 0000000",
      subject: "Sample enquiry",
      message: "This is a demonstration contact message so the admin inbox has sample data.",
      status: "new"
    });

    await AuditLog.create({
      actor: admin._id,
      actorEmail: adminEmail,
      action: "seed.demo_data",
      entity: "System",
      entityId: "seed",
      meta: { note: "Development demo data created." }
    });

    void previousSession;
    void admissionSeeds;
    void demoOrder;
    credentials.push("");
    credentials.push("Demo portal accounts:");
    for (const [label, value] of Object.entries(demo)) {
      credentials.push(`${label}: ${value}`);
    }
    credentials.push("");
    credentials.push("All seeded institutional content, faculty/finance records and catalogue entries are samples and must be reviewed before launch.");
  }

  const credentialsPath = path.resolve(process.cwd(), ".seed-credentials.txt");
  fs.writeFileSync(credentialsPath, credentials.join("\n"), { encoding: "utf8", mode: 0o600 });
  console.log("Seed complete.");
  console.log(`One-time credentials were written to ${credentialsPath}. Delete the file after saving the credentials securely.`);
  if (!env.seedDemo) console.log("SEED_DEMO was disabled; only the administrator, settings and core pages were created.");

  await disconnectDB();
}

seed().catch(async (error) => {
  console.error("Seed failed", error instanceof Error ? error.stack : error);
  await disconnectDB();
  process.exit(1);
});
