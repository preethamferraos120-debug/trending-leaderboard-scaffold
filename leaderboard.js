// leaderboard.js — a trending leaderboard backed by a Redis sorted set + a hash per post.
//
// Storage shape:
//   trending:posts        (sorted set)  member = postId, score = engagement  -> the ranking
//   post:<id>:meta        (hash)        title, author                        -> the metadata
//
// Redis client is shared with the seed and test scripts.

import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Record one unit of engagement for a post using one atomic Redis command.
 * @param {string} postId e.g. "post:104"
 * @returns {Promise<string>} the post's new score
 */
export async function upvote(postId) {
  return redis.zincrby("trending:posts", 1, postId);
}

/**
 * Fetch the top N posts, ranked high -> low, with their metadata.
 * All metadata lookups are issued through one pipeline.
 * @param {number} n how many posts to return
 * @returns {Promise<Array<{ id: string, score: number, title?: string, author?: string }>>}
 */
export async function getTop(n) {
  if (!Number.isInteger(n) || n <= 0) return [];

  const flat = await redis.zrevrange("trending:posts", 0, n - 1, "WITHSCORES");
  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < flat.length; i += 2) {
    rows.push({ id: flat[i], score: Number(flat[i + 1]) });
    pipeline.hgetall(flat[i] + ":meta");
  }

  if (rows.length === 0) return [];

  const results = await pipeline.exec();
  return rows.map((row, k) => ({ ...row, ...(results[k][1] ?? {}) }));
}

export { redis };
