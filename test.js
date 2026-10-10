// test.js — proves the leaderboard works.
// Run with: npm test (run npm run seed first)
//
// The test upvotes a seeded post 50 times and verifies it appears in the top 10.

import { upvote, getTop, redis } from "./leaderboard.js";

async function run() {
  const target = "post:50";

  try {
    // Upvote the target 50 times.
    for (let i = 0; i < 50; i++) {
      await upvote(target);
    }

    const top = await getTop(10);
    console.log("Top 10:");
    top.forEach((p, i) =>
      console.log(`  #${i + 1}  ${p.id}  score=${p.score}  ${p.title} (${p.author})`)
    );

    const madeIt = top.some((p) => p.id === target);
    console.log(
      madeIt
        ? `\nPASS ✅  ${target} reached the top 10`
        : `\nFAIL ❌  ${target} is NOT in the top 10`
    );
    process.exitCode = madeIt ? 0 : 1;
  } catch (error) {
    console.error("Leaderboard test failed:", error);
    process.exitCode = 1;
  } finally {
    redis.disconnect();
  }
}

run();
