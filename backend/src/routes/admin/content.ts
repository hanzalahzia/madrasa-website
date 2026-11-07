import { Router } from "express";
import {
  Announcement,
  BookCategory,
  ContactMessage,
  Event,
  Faq,
  GalleryItem,
  PageContent,
  Program,
  SiteSetting,
  Teacher
} from "../../models/index.js";
import { crudRouter } from "../../services/crud.js";
import { getSettings } from "../../services/settings.js";
import { ApiError, asyncHandler, validateBody } from "../../utils/http.js";
import { teacherId } from "../../utils/ids.js";
import {
  announcementSchema,
  bookCategorySchema,
  eventSchema,
  faqSchema,
  gallerySchema,
  messageStatusSchema,
  pageContentSchema,
  programSchema,
  settingsSchema,
  teacherSchema
} from "../../utils/schemas.js";
import { writeAudit } from "../../utils/audit.js";

export const adminContentRouter = Router();

adminContentRouter.use(
  "/programs",
  crudRouter({
    model: Program,
    entityName: "Program",
    schema: programSchema,
    sort: { order: 1, createdAt: -1 },
    searchFields: ["slug", "title.en", "title.ur", "title.ar"],
    beforeDelete: async (_req, doc) => {
      const { Student, Admission } = await import("../../models/index.js");
      const used = (await Student.exists({ program: doc._id })) || (await Admission.exists({ program: doc._id }));
      if (used) throw new ApiError(409, "This program is linked to records. Unpublish it instead of deleting.");
    }
  })
);

adminContentRouter.use(
  "/faculty",
  crudRouter({
    model: Teacher,
    entityName: "Faculty profile",
    schema: teacherSchema,
    sort: { name: 1 },
    searchFields: ["name", "email", "qualifications"],
    beforeCreate: () => ({ teacherId: teacherId() }),
    beforeDelete: async (_req, doc) => {
      const { SchoolClass } = await import("../../models/index.js");
      if (await SchoolClass.exists({ teacher: doc._id })) {
        throw new ApiError(409, "This teacher is assigned to a class. Reassign the class first.");
      }
    }
  })
);

adminContentRouter.use(
  "/announcements",
  crudRouter({
    model: Announcement,
    entityName: "Announcement",
    schema: announcementSchema,
    sort: { pinned: -1, publishDate: -1 },
    searchFields: ["title.en", "title.ur", "title.ar", "body.en", "body.ur", "body.ar"]
  })
);

adminContentRouter.use(
  "/events",
  crudRouter({
    model: Event,
    entityName: "Event",
    schema: eventSchema,
    sort: { startDate: -1 },
    searchFields: ["slug", "title.en", "title.ur", "title.ar"]
  })
);

adminContentRouter.use(
  "/gallery",
  crudRouter({
    model: GalleryItem,
    entityName: "Gallery item",
    schema: gallerySchema,
    sort: { order: 1, createdAt: -1 },
    searchFields: ["title.en", "title.ur", "title.ar", "category"]
  })
);

adminContentRouter.use(
  "/faqs",
  crudRouter({
    model: Faq,
    entityName: "FAQ",
    schema: faqSchema,
    sort: { order: 1, createdAt: 1 },
    searchFields: ["question.en", "question.ur", "question.ar", "answer.en"]
  })
);

adminContentRouter.use(
  "/pages",
  crudRouter({
    model: PageContent,
    entityName: "Page",
    schema: pageContentSchema,
    sort: { key: 1 },
    searchFields: ["key", "title.en", "title.ur", "title.ar"],
    beforeCreate: (req) => ({ updatedBy: req.user?.id || null }),
    beforeUpdate: (req) => ({ updatedBy: req.user?.id || null })
  })
);

adminContentRouter.use(
  "/book-categories",
  crudRouter({
    model: BookCategory,
    entityName: "Book category",
    schema: bookCategorySchema,
    sort: { order: 1, createdAt: -1 },
    searchFields: ["slug", "name.en", "name.ur", "name.ar"],
    beforeDelete: async (_req, doc) => {
      const { Book } = await import("../../models/index.js");
      if (await Book.exists({ category: doc._id })) {
        throw new ApiError(409, "This category contains books. Move or archive them first.");
      }
    }
  })
);

adminContentRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    res.json(await getSettings());
  })
);

adminContentRouter.put(
  "/settings",
  validateBody(settingsSchema),
  asyncHandler(async (req, res) => {
    const settings = await SiteSetting.findOneAndUpdate(
      { key: "main" },
      { $set: { ...req.body, key: "main", updatedBy: req.user!.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await writeAudit(req, "settings.update", "SiteSetting", "main");
    res.json(settings);
  })
);

adminContentRouter.get(
  "/messages",
  asyncHandler(async (req, res) => {
    const status = String(req.query.status || "");
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const items = await ContactMessage.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ items });
  })
);

adminContentRouter.patch(
  "/messages/:id",
  validateBody(messageStatusSchema),
  asyncHandler(async (req, res) => {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true }
    );
    if (!message) throw new ApiError(404, "Message not found.");
    await writeAudit(req, "message.status", "ContactMessage", String(message._id), {
      status: req.body.status
    });
    res.json(message);
  })
);
