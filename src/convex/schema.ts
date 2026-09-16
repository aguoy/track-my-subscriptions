import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const CATEGORIES = [
  "AI services",
  "Cloud storage",
  "Streaming",
  "Mobile phone",
  "Internet",
  "Software",
  "Insurance",
  "Membership",
  "Banking",
  "News",
  "Education",
  "Other",
] as const;

export const CURRENCIES = ["NZD", "USD", "AUD", "CNY", "EUR"] as const;

const categoryValidator = v.union(
  ...CATEGORIES.map((c) => v.literal(c)),
);
const currencyValidator = v.union(
  ...CURRENCIES.map((c) => v.literal(c)),
);
const cycleValidator = v.union(v.literal("monthly"), v.literal("annual"));
const valueValidator = v.union(v.literal("High"), v.literal("Medium"), v.literal("Low"));
const usageValidator = v.union(
  v.literal("Daily"),
  v.literal("Weekly"),
  v.literal("Monthly"),
  v.literal("Rarely"),
  v.literal("Never"),
);

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // One row per signed-in user holding their home currency and manual
    // exchange rates (units of home currency per 1 unit of the foreign one).
    userSettings: defineTable({
      userId: v.id("users"),
      baseCurrency: v.optional(currencyValidator),
      // { USD: 1.6, EUR: 1.75, ... } relative to the base currency
      rates: v.optional(v.any()),
      seeded: v.optional(v.boolean()),
    }).index("by_user", ["userId"]),

    subscriptions: defineTable({
      userId: v.id("users"),
      name: v.string(),
      category: categoryValidator,
      cycle: cycleValidator, // the price is quoted per this cycle
      billingCycle: cycleValidator, // how often it actually bills
      price: v.number(),
      currency: currencyValidator,
      customRate: v.optional(v.number()), // optional override rate
      nextBillingDate: v.string(), // yyyy-mm-dd
      paymentMethod: v.optional(v.string()),
      startDate: v.string(), // yyyy-mm-dd
      autoRenew: v.boolean(),
      notes: v.optional(v.string()),
      cancelledAt: v.optional(v.number()), // set = cancellation history row
      cancelledReason: v.optional(v.string()),

      // "Should I keep this?" review
      reviewUsageFrequency: v.optional(usageValidator),
      reviewPersonalValue: v.optional(valueValidator),
      reviewLastUsedDate: v.optional(v.string()),
      reviewAlternative: v.optional(v.string()),
      reviewCancellationNotes: v.optional(v.string()),
      lastUsedAt: v.optional(v.number()), // set by "Mark as used today"
    })
      .index("by_user", ["userId"])
      .index("by_user_status", ["userId", "cancelledAt"]),

    // Keeps the "not used in 60 days" check honest without editing review data
    usageLog: defineTable({
      userId: v.id("users"),
      subscriptionId: v.id("subscriptions"),
      usedOn: v.string(), // yyyy-mm-dd
    })
      .index("by_user", ["userId"])
      .index("by_subscription", ["subscriptionId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
