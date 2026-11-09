import { InviteCodeModel } from "../models/inviteCode.model.js";

export interface NewInviteCode {
    code: string;
    maxUses: number;
    expiresAt: Date | null;
}

export async function claimInviteCode(
    code: string,
    now: Date,
): Promise<boolean> {
    const result = await InviteCodeModel. updateOne(
        {
            code,
            $expr: { $lt: ["$useCount", "$maxUses"] },
            $or: [{ expiresAt: null}, { expiresAt: {$gt: now} }],
        },
        { $inc: {useCount: 1} },
    ).exec();
    return result.modifiedCount === 1;
}

export async function releaseInviteCode(code: string): Promise<void> {
    await InviteCodeModel.updateOne(
        { code, useCount: { $gt: 0} },
        {$inc: { useCount: -1} },
    ).exec();
}

export async function createInviteCode(input: NewInviteCode): Promise<void> {
    await InviteCodeModel.create(input);
}