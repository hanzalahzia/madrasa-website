import type { UserRole } from "../models/core.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        name: string;
        email: string;
      };
    }
  }
}

export {};
