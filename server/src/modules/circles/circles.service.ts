import { ensureCircleIndexes, upsertCircleSeeds } from "./circle.repository.js";
import type { SeedResult } from "./circle.types.js";
import { CIRCLE_SEEDS } from "./circleSeeds.js";

export async function seedCircles(): Promise<SeedResult> {
  await ensureCircleIndexes();
  return upsertCircleSeeds(CIRCLE_SEEDS);
}
