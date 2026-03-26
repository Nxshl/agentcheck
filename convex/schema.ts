import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  records: defineTable({
    campaign: v.string(),
    agent: v.string(),
    number: v.string(),
    posthog: v.string(),
    isRejected: v.boolean(),
    isIgnored: v.boolean(),
    batchId: v.optional(v.id("batches")), // null for manual entries
    createdAt: v.number(),
  })
    .index("by_agent", ["agent"])
    .index("by_batch", ["batchId"]),

  batches: defineTable({
    filename: v.string(),
    rowCount: v.number(),
    importedAt: v.number(),
  }),
});
