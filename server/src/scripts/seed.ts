import { seedCircles } from "../modules/circles/index.js";
import { connectDB, disconnectDB } from "../shared/config/db.js";

async function main(): Promise<void> {
  await connectDB();
  try {
    const circles = await seedCircles();
    console.info(
      `Circles: ${String(circles.created)} created, ${String(circles.existing)} already there`,
    );
  } finally {
    await disconnectDB();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Seed failed: ${message}`);
  process.exitCode = 1;
});
