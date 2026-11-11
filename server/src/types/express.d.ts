import type { PublicUser } from "./user.js";

declare global {
  namespace Express {
    interface Locals {
      authUser?: PublicUser;
    }
  }
}

export {};
