import { Schema, model } from "mongoose";
import {
  CIRCLE_CATEGORIES,
  CIRCLE_DESCRIPTION_MAX,
  CIRCLE_NAME_MAX,
  CIRCLE_SLUG_MAX,
  CIRCLE_SLUG_PATTERN,
  type CircleCategory,
} from "./circle.types.js";

export interface CircleRecord {
  name: string;
  slug: string;
  category: CircleCategory;
  description: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const circleSchema = new Schema<CircleRecord>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: CIRCLE_NAME_MAX,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: CIRCLE_SLUG_MAX,
      match: CIRCLE_SLUG_PATTERN,
    },
    category: {
      type: String,
      required: true,
      enum: [...CIRCLE_CATEGORIES],
    },
    description: {
      type: String,
      default: "",
      maxlength: CIRCLE_DESCRIPTION_MAX,
    },
    memberCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

circleSchema.index({ name: "text", description: "text" });

export const CircleModel = model<CircleRecord>("Circle", circleSchema);
