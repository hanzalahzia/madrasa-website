import { Router } from "express";
import { Guardian, Student, Teacher, User } from "../models/index.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { loginLimiter, recoveryLimiter } from "../middleware/rateLimit.js";
import {
  clearSessionCookie,
  hashPassword,
  setSessionCookie,
  signSession,
  verifyPassword
} from "../utils/auth.js";
import { ApiError, asyncHandler, validateBody } from "../utils/http.js";
import { randomToken, sha256 } from "../utils/ids.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema
} from "../utils/schemas.js";
import { shapePublicUser } from "../utils/shapes.js";
import { writeAudit } from "../utils/audit.js";

export const authRouter = Router();

function sessionFor(user: any) {
  return signSession({
    sub: String(user._id),
    role: user.role,
    name: user.name,
    email: user.email
  });
}

async function profileFor(userId: string) {
  const [student, teacher, guardian] = await Promise.all([
    Student.findOne({ user: userId }).select("_id studentId").lean(),
    Teacher.findOne({ user: userId }).select("_id teacherId").lean(),
    Guardian.findOne({ user: userId }).select("_id").lean()
  ]);
  if (student) return { type: "student", id: String(student._id), reference: student.studentId };
  if (teacher) return { type: "teacher", id: String(teacher._id), reference: teacher.teacherId };
  if (guardian) return { type: "guardian", id: String(guardian._id), reference: "" };
  return null;
}

authRouter.post(
  "/register",
  recoveryLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const existing = await User.findOne({ email }).lean();
    if (existing) throw new ApiError(409, "An account with this email already exists.");

    const user = await User.create({
      name: req.body.name,
      email,
      phone: req.body.phone,
      passwordHash: await hashPassword(req.body.password),
      role: "customer"
    });

    setSessionCookie(res, sessionFor(user));
    res.status(201).json({ user: shapePublicUser(user), profile: null });
  })
);

authRouter.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !user.isActive) {
      throw new ApiError(401, "Email or password is incorrect.");
    }
    const valid = await verifyPassword(user.passwordHash, req.body.password);
    if (!valid) throw new ApiError(401, "Email or password is incorrect.");

    user.lastLoginAt = new Date();
    await user.save();

    setSessionCookie(res, sessionFor(user));
    req.user = { id: String(user._id), role: user.role, name: user.name, email: user.email };
    await writeAudit(req, "auth.login", "User", String(user._id));

    res.json({
      user: shapePublicUser(user),
      profile: await profileFor(String(user._id))
    });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    clearSessionCookie(res);
    res.json({ message: "Signed out." });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id).lean();
    if (!user) throw new ApiError(401, "Please sign in again.");
    res.json({ user: shapePublicUser(user), profile: await profileFor(String(user._id)) });
  })
);

authRouter.patch(
  "/profile",
  requireAuth,
  validateBody(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $set: { name: req.body.name, phone: req.body.phone } },
      { new: true }
    ).lean();
    if (!user) throw new ApiError(404, "Account not found.");
    res.json({ user: shapePublicUser(user) });
  })
);

authRouter.post(
  "/forgot-password",
  recoveryLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email, isActive: true });
    let devResetUrl: string | null = null;

    if (user) {
      const token = randomToken(32);
      user.resetTokenHash = sha256(token);
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
      if (!env.isProduction) devResetUrl = resetUrl;
      await writeAudit(
        { ...req, user: { id: String(user._id), role: user.role, name: user.name, email: user.email } } as any,
        "auth.password_reset_requested",
        "User",
        String(user._id)
      );
    }

    res.json({
      message: "If an active account exists for that email, recovery instructions have been prepared.",
      ...(devResetUrl ? { devResetUrl } : {})
    });
  })
);

authRouter.post(
  "/reset-password",
  recoveryLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      resetTokenHash: sha256(req.body.token),
      resetTokenExpires: { $gt: new Date() }
    }).select("+passwordHash +resetTokenHash +resetTokenExpires");

    if (!user) throw new ApiError(400, "This recovery link is invalid or has expired.");
    user.passwordHash = await hashPassword(req.body.password);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    user.passwordChangedAt = new Date();
    await user.save();

    clearSessionCookie(res);
    res.json({ message: "Password updated. Please sign in with the new password." });
  })
);

authRouter.post(
  "/change-password",
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id).select("+passwordHash");
    if (!user) throw new ApiError(404, "Account not found.");
    const valid = await verifyPassword(user.passwordHash, req.body.currentPassword);
    if (!valid) throw new ApiError(400, "Current password is incorrect.");
    user.passwordHash = await hashPassword(req.body.newPassword);
    user.passwordChangedAt = new Date();
    await user.save();
    await writeAudit(req, "auth.password_changed", "User", String(user._id));
    res.json({ message: "Password changed." });
  })
);
