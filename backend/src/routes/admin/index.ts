import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { adminContentRouter } from "./content.js";
import { adminPeopleRouter } from "./people.js";
import { adminAdmissionsRouter } from "./admissions.js";
import { adminAcademicsRouter } from "./academics.js";
import { adminFinanceRouter } from "./finance.js";
import { adminStoreRouter } from "./store.js";
import { adminSystemRouter } from "./system.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.use("/admissions", adminAdmissionsRouter);
adminRouter.use(adminAcademicsRouter);
adminRouter.use(adminFinanceRouter);
adminRouter.use(adminStoreRouter);
adminRouter.use(adminPeopleRouter);
adminRouter.use(adminContentRouter);
adminRouter.use(adminSystemRouter);
