import { CircleModel } from "./circle.model.js";
import type { CircleSeed, SeedResult } from "./circle.types.js";

export async function ensureCircleIndexes(): Promise<void> {
  await CircleModel.createIndexes();
}

export async function upsertCircleSeeds(
  seeds: readonly CircleSeed[],
): Promise<SeedResult> {
  if (seeds.length === 0) {
    return { created: 0, existing: 0 };
  }
  const operations = seeds.map((seed) => ({
    updateOne: {
      filter: { slug: seed.slug },
      update: {
        $setOnInsert: {
          name: seed.name,
          category: seed.category,
          description: seed.description,
          memberCount: 0,
        },
      },
      upsert: true,
    },
  }));
  const result = await CircleModel.bulkWrite(operations, { ordered: false });
  return {
    created: result.upsertedCount,
    existing: seeds.length - result.upsertedCount,
  };
}
