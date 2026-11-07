import { Notification, User } from "../models/index.js";

export async function notifyAdmins(title: string, body: string, link = ""): Promise<void> {
  try {
    const admins = await User.find({ role: "super_admin", isActive: true }).select("_id").lean();
    if (!admins.length) return;
    await Notification.insertMany(
      admins.map((admin) => ({
        user: admin._id,
        title,
        body,
        link
      }))
    );
  } catch (error) {
    console.error("Failed to create admin notifications", error instanceof Error ? error.message : error);
  }
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  link = ""
): Promise<void> {
  try {
    await Notification.create({ user: userId, title, body, link });
  } catch (error) {
    console.error("Failed to create notification", error instanceof Error ? error.message : error);
  }
}
