import { describe, expect, it } from "vitest";
import {
  CIRCLE_CATEGORIES,
  CIRCLE_DESCRIPTION_MAX,
  CIRCLE_NAME_MAX,
  CIRCLE_SLUG_MAX,
  CIRCLE_SLUG_PATTERN,
} from "./circle.types.js";
import { CIRCLE_SEEDS } from "./circleSeeds.js";

describe("circle seeds", () => {
  it("gives every circle a unique slug", () => {
    const slugs = CIRCLE_SEEDS.map((seed) => seed.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every circle a unique name", () => {
    const names = CIRCLE_SEEDS.map((seed) => seed.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("writes every slug as lowercase words joined by hyphens", () => {
    for (const seed of CIRCLE_SEEDS) {
      expect(seed.slug).toMatch(CIRCLE_SLUG_PATTERN);
      expect(seed.slug.length).toBeLessThanOrEqual(CIRCLE_SLUG_MAX);
    }
  });

  it("keeps names and descriptions within the model limits", () => {
    for (const seed of CIRCLE_SEEDS) {
      expect(seed.name.trim().length).toBeGreaterThan(0);
      expect(seed.name.length).toBeLessThanOrEqual(CIRCLE_NAME_MAX);
      expect(seed.description.length).toBeLessThanOrEqual(
        CIRCLE_DESCRIPTION_MAX,
      );
    }
  });

  it("has at least one circle in every category", () => {
    for (const category of CIRCLE_CATEGORIES) {
      const count = CIRCLE_SEEDS.filter(
        (seed) => seed.category === category,
      ).length;
      expect(count).toBeGreaterThan(0);
    }
  });
});
