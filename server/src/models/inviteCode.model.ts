import { Schema, model, type Types } from "mongoose";

export interface InviteCodeRecord {
    code: string;
    createdBy: Types.ObjectId | null;
    maxUses: number;
    useCount: number;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const inviteCodeSchema = new Schema<InviteCodeRecord>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        maxUses: { type: Number, required: true, min: 1 },
        useCount: { type: Number, default: 0, min: 0 },
        expiresAt: { type: Date, default: null },
    },
    { timestamps: true },
);

export const InviteCodeModel = model<InviteCodeRecord>(
    "InviteCode",
    inviteCodeSchema,
);