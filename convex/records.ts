import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ── Classification rules ─────────────────────────────────────────────────────
function deriveFlags(posthog: string) {
  const lower = posthog.toLowerCase();
  const isRejected =
    lower.includes("reject") || lower.includes("decline");
  const isIgnored =
    lower.includes("ignor") ||
    lower.includes("not answered") ||
    lower.includes("no answer") ||
    lower.includes("unanswered") ||
    lower.includes("not answer") ||
    lower.includes("busy");
  return { isRejected, isIgnored };
}

// ── Manual insert ─────────────────────────────────────────────────────────────
export const insertRecord = mutation({
  args: {
    campaign: v.string(),
    agent: v.string(),
    number: v.string(),
    posthog: v.string(),
  },
  handler: async (ctx, args) => {
    const { isRejected, isIgnored } = deriveFlags(args.posthog);
    await ctx.db.insert("records", {
      campaign: args.campaign,
      agent: args.agent,
      number: args.number,
      posthog: args.posthog,
      isRejected,
      isIgnored,
      createdAt: Date.now(),
    });
  },
});

// ── Step 1: Create a batch header (returns batchId) ──────────────────────────
export const createBatch = mutation({
  args: { filename: v.string(), rowCount: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("batches", {
      filename: args.filename,
      rowCount: args.rowCount,
      importedAt: Date.now(),
    });
  },
});

// ── Step 2: Insert a chunk of records under an existing batchId ──────────────
export const insertBatchChunk = mutation({
  args: {
    batchId: v.id("batches"),
    rows: v.array(
      v.object({
        campaign: v.string(),
        agent: v.string(),
        number: v.string(),
        posthog: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      const { isRejected, isIgnored } = deriveFlags(row.posthog);
      await ctx.db.insert("records", {
        campaign: row.campaign,
        agent: row.agent,
        number: row.number,
        posthog: row.posthog,
        isRejected,
        isIgnored,
        batchId: args.batchId,
        createdAt: Date.now(),
      });
    }
  },
});

// ── Delete a batch and all its records (paginated to handle large imports) ────
export const deleteBatch = mutation({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    // Delete all records linked to this batch
    const recs = await ctx.db
      .query("records")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .collect();
    for (const rec of recs) {
      await ctx.db.delete(rec._id);
    }
    // Delete the batch header
    await ctx.db.delete(args.batchId);
  },
});

// ── List all batches ──────────────────────────────────────────────────────────
export const getBatches = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("batches").order("desc").collect();
  },
});

// ── All records ───────────────────────────────────────────────────────────────
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("records").order("desc").collect();
  },
});

// ── Per-agent stats ───────────────────────────────────────────────────────────
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("records").collect();
    const agentMap: Record<
      string,
      { rejected: number; ignored: number; total: number }
    > = {};
    for (const rec of all) {
      if (!agentMap[rec.agent])
        agentMap[rec.agent] = { rejected: 0, ignored: 0, total: 0 };
      agentMap[rec.agent].total += 1;
      if (rec.isRejected) agentMap[rec.agent].rejected += 1;
      if (rec.isIgnored) agentMap[rec.agent].ignored += 1;
    }
    return Object.entries(agentMap)
      .map(([agent, stats]) => ({ agent, ...stats }))
      .sort((a, b) => b.rejected + b.ignored - (a.rejected + a.ignored));
  },
});

// ── Clear everything — runs in pages of 100 to avoid timeouts ────────────────
export const clearPage = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete up to 100 records per call
    const records = await ctx.db
      .query("records")
      .order("asc")
      .take(100);
    for (const rec of records) await ctx.db.delete(rec._id);

    // Only clear batches once all records are gone
    if (records.length === 0) {
      const batches = await ctx.db.query("batches").take(50);
      for (const b of batches) await ctx.db.delete(b._id);
      return { done: true };
    }
    return { done: false };
  },
});
