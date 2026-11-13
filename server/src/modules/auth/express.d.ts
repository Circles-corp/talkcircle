import type { PublicUser } from "../users/index.js";

declare global {
  namespace Express {
    interface Locals {
      authUser?: PublicUser;
    }
  }
}

export {};
