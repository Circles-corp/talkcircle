import bcrypt from "bcrypt";
import { env } from "../../shared/config/env.js";

const BCRYPT_COST = env.NODE_ENV === "test" ? 4 : 12;
const TIMING_DUMMY_HASH = bcrypt.hashSync("circle-timing-dummy", BCRYPT_COST);

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  passwordHash: string | null,
): Promise<boolean> {
  if (passwordHash === null) {
    await bcrypt.compare(password, TIMING_DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(password, passwordHash);
}
