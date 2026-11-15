import { createInvite } from "../modules/invites/index.js";
import { connectDB, disconnectDB } from "../shared/config/db.js";
import { parseInviteOptions } from "./inviteOptions.js";

const DAY_MS = 24 * 60 * 60 * 1000;

async function main(): Promise<void> {
  const options = parseInviteOptions(process.argv.slice(2));
  const expiresAt =
    options.days === null ? null : new Date(Date.now() + options.days * DAY_MS);

  await connectDB();
  try {
    const code = await createInvite({ maxUses: options.maxUses, expiresAt });
    const expiry =
      expiresAt === null
        ? "never expires"
        : `expires ${expiresAt.toISOString()}`;
    console.info(
      `Invite code: ${code} (${String(options.maxUses)} use(s), ${expiry})`,
    );
  } finally {
    await disconnectDB();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unkown error";
  console.error(`Failed to create invite: ${message}`);
  process.exitCode = 1;
});
