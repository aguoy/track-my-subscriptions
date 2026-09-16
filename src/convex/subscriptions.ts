import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { CATEGORIES, CURRENCIES } from "./schema";
import { query, mutation } from "./_generated/server";

// ---------- helpers ----------

export const todayStr = () => new Date().toISOString().slice(0, 10);

const monthKey = (ts: number) => new Date(ts).toISOString().slice(0, 7);

/** Advance a yyyy-mm-dd date by n calendar months, clamping to the last day. */
function addMonths(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

const categoryArg = v.union(...CATEGORIES.map((c) => v.literal(c)));
const currencyArg = v.union(...CURRENCIES.map((c) => v.literal(c)));
const cycleArg = v.union(v.literal("monthly"), v.literal("annual"));
const valueArg = v.union(
  v.literal("High"),
  v.literal("Medium"),
  v.literal("Low"),
);
const usageArg = v.union(
  v.literal("Daily"),
  v.literal("Weekly"),
  v.literal("Monthly"),
  v.literal("Rarely"),
  v.literal("Never"),
);

async function requireUserId(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not authenticated");
  return userId;
}

/** Pull the user's settings row (creating a default one if needed). */
async function getSettings(ctx: any, userId: any) {
  let settings = await ctx.db
    .query("userSettings")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
  if (!settings) {
    const id = await ctx.db.insert("userSettings", {
      userId,
      baseCurrency: "NZD",
      rates: {},
      seeded: false,
    });
    settings = await ctx.db.get(id);
  }
  return settings;
}

async function ensureSeeded(ctx: any, userId: any) {
  const settings = await getSettings(ctx, userId);
  if (!settings?.seeded) {
    await seedForUser(ctx, userId);
    await ctx.db.patch(settings._id, { seeded: true });
  }
}

/** Shift a yyyy-mm-dd so it lands `offsetDays` from today (keeps the demo current). */
const dayOffset = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

const SEED: Array<Record<string, any>> = [
  {
    name: "Claude Pro",
    category: "AI services",
    cycle: "monthly",
    billingCycle: "monthly",
    price: 20,
    currency: "USD",
    nextBillingDate: dayOffset(8),
    paymentMethod: "Visa •• 4417",
    startDate: "2025-03-14",
    autoRenew: true,
    notes: "Main AI assistant for work and side projects.",
    reviewUsageFrequency: "Daily",
    reviewPersonalValue: "High",
    reviewLastUsedDate: dayOffset(-1),
    reviewAlternative: "ChatGPT Plus",
  },
  {
    name: "ChatGPT Plus",
    category: "AI services",
    cycle: "monthly",
    billingCycle: "monthly",
    price: 20,
    currency: "USD",
    nextBillingDate: "2026-10-02",
    paymentMethod: "Visa •• 4417",
    startDate: "2024-11-02",
    autoRenew: true,
    notes: "Barely opened since Claude Pro. Possible duplicate.",
    reviewUsageFrequency: "Rarely",
    reviewPersonalValue: "Low",
    reviewLastUsedDate: dayOffset(-97),
    reviewAlternative: "Claude Pro",
  },
  {
    name: "Perplexity Pro",
    category: "AI services",
    cycle: "annual",
    billingCycle: "annual",
    price: 200,
    currency: "USD",
    nextBillingDate: dayOffset(63),
    paymentMethod: "Visa •• 4417",
    startDate: "2025-11-18",
    autoRenew: true,
    notes: "Search-style answers. Annual plan was half price.",
    reviewUsageFrequency: "Weekly",
    reviewPersonalValue: "Medium",
    reviewLastUsedDate: dayOffset(-18),
  },
  {
    name: "Google One 2TB",
    category: "Cloud storage",
    cycle: "monthly",
    billingCycle: "monthly",
    price: 13.99,
    currency: "NZD",
    nextBillingDate: dayOffset(3),
    paymentMethod: "Google Pay",
    startDate: "2023-06-01",
    autoRenew: true,
    notes: "Photos backup plus Drive for the whole family.",
    reviewUsageFrequency: "Daily",
    reviewPersonalValue: "High",
    reviewLastUsedDate: dayOffset(-1),
  },
  {
    name: "Dropbox Plus",
    category: "Cloud storage",
    cycle: "monthly",
    billingCycle: "monthly",
    price: 11.99,
    currency: "USD",
    nextBillingDate: dayOffset(11),
    paymentMethod: "Visa •• 4417",
    startDate: "2022-08-27",
    autoRenew: true,
    notes: "Was for client handoffs — everything lives in Drive now.",
    reviewUsageFrequency: "Never",
    reviewPersonalValue: "Low",
    reviewLastUsedDate: dayOffset(-198),
    reviewAlternative: "Google One 2TB",
  },
  {
    name: "One NZ Mobile",
    category: "Mobile phone",
    cycle: "monthly",
    billingCycle: "monthly",
    price: 58.9,
    currency: "NZD",
    nextBillingDate: dayOffset(5),
    paymentMethod: "Direct debit",
    startDate: "2021-02-21",
    autoRenew: true,
    notes: "Endless data plan, phone paid off last year.",
    reviewUsageFrequency: "Daily",
    reviewPersonalValue: "High",
    reviewLastUsedDate: dayOffset(-1),
  },
  {
    name: "Netflix",
    category: "Streaming",
    cycle: "monthly",
    billingCycle: "monthly",
    price: 24.99,
    currency: "NZD",
    nextBillingDate: dayOffset(7),
    paymentMethod: "Visa •• 4417",
    startDate: "2019-07-23",
    autoRenew: true,
    notes: "Standard plan, watching on the living room TV.",
    reviewUsageFrequency: "Weekly",
    reviewPersonalValue: "Medium",
    reviewLastUsedDate: dayOffset(-7),
  },
  {
    name: "Spotify Premium",
    category: "Streaming",
    cycle: "monthly",
    billingCycle: "monthly",
    price: 17.99,
    currency: "NZD",
    nextBillingDate: dayOffset(19),
    paymentMethod: "Google Pay",
    startDate: "2020-10-05",
    autoRenew: true,
    notes: "Everyday listening, mostly on the commute.",
    reviewUsageFrequency: "Daily",
    reviewPersonalValue: "High",
    reviewLastUsedDate: dayOffset(-1),
  },
  {
    name: "Disney+",
    category: "Streaming",
    cycle: "annual",
    billingCycle: "annual",
    price: 129.99,
    currency: "NZD",
    nextBillingDate: dayOffset(44),
    paymentMethod: "Visa •• 4417",
    startDate: "2024-10-30",
    autoRenew: true,
    notes: "Kids' shows. Renewal lands right before the holidays.",
    reviewUsageFrequency: "Monthly",
    reviewPersonalValue: "Medium",
    reviewLastUsedDate: dayOffset(-66),
  },
];

async function seedForUser(ctx: any, userId: any) {
  for (const s of SEED) {
    await ctx.db.insert("subscriptions", { userId, ...s });
  }
}

// ---------- queries ----------

export const list = query({
  args: { includeCancelled: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await ensureSeeded(ctx, userId);
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    return args.includeCancelled
      ? subs
      : subs.filter((s: any) => s.cancelledAt === undefined);
  },
});

export const get = query({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const sub = await ctx.db.get(args.id);
    if (!sub || sub.userId !== userId) return null;
    return sub;
  },
});

/** Cancellation history, newest first. */
export const history = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    return rows
      .filter((s: any) => s.cancelledAt !== undefined)
      .sort((a: any, b: any) => (b.cancelledAt ?? 0) - (a.cancelledAt ?? 0));
  },
});

export const settings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await getSettings(ctx, userId);
  },
});

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    await ensureSeeded(ctx, userId);
    const settingsRow = await getSettings(ctx, userId);
    const base = settingsRow?.baseCurrency ?? "NZD";
    const rates: Record<string, number> = settingsRow?.rates ?? {};

    const rows = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const toMonthly = (s: any) => {
      const rate = s.customRate && s.customRate > 0 ? s.customRate : rates[s.currency] ?? 1;
      const monthly = s.cycle === "monthly" ? s.price : s.price / 12;
      return monthly * rate;
    };

    const active = rows.filter((s: any) => s.cancelledAt === undefined);
    const today = todayStr();

    const monthlyTotal = active.reduce((a: number, s: any) => a + toMonthly(s), 0);
    const annualTotal = monthlyTotal * 12;

    const inDays = (s: any, n: number) => {
      if (!s.nextBillingDate) return false;
      const diff =
        (new Date(s.nextBillingDate + "T00:00:00Z").getTime() -
          new Date(today + "T00:00:00Z").getTime()) /
        86400000;
      return diff >= 0 && diff <= n;
    };

    const byCategory: Record<string, number> = {};
    for (const s of active) {
      byCategory[s.category] = (byCategory[s.category] ?? 0) + toMonthly(s);
    }

    const usageLogs = await ctx.db
      .query("usageLog")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const lastUsedLog: Record<string, string> = {};
    for (const l of usageLogs) {
      const cur = lastUsedLog[l.subscriptionId];
      if (!cur || l.usedOn > cur) lastUsedLog[l.subscriptionId] = l.usedOn;
    }

    const effectiveLastUsed = (s: any) =>
      lastUsedLog[s._id] ?? s.reviewLastUsedDate ?? null;

    const daysSince = (d: string | null) =>
      d
        ? Math.floor(
            (new Date(today + "T00:00:00Z").getTime() -
              new Date(d + "T00:00:00Z").getTime()) /
              86400000,
          )
        : null;

    // Review flags
    const flags = active
      .map((s: any) => {
        const monthly = toMonthly(s);
        const usage = s.reviewUsageFrequency ?? null;
        const value = s.reviewPersonalValue ?? null;
        const daysIdle = daysSince(effectiveLastUsed(s));
        const reasons: string[] = [];

        if (monthly > 15 && (usage === "Rarely" || usage === "Never")) {
          reasons.push("Costly but rarely used");
        }
        if (usage === "Never" && (daysIdle === null || daysIdle > 60)) {
          reasons.push("No recorded use");
        }
        if (daysIdle !== null && daysIdle > 60) {
          reasons.push(`Unused for ${daysIdle} days`);
        }

        const duplicateOf = active.find(
          (o: any) =>
            o._id !== s._id &&
            o.category === s.category &&
            o.reviewAlternative === s.name,
        );
        if (duplicateOf) reasons.push(`Duplicates ${duplicateOf.name}`);
        if (s.reviewAlternative && s.reviewPersonalValue === "Low") {
          reasons.push(`Alternative: ${s.reviewAlternative}`);
        }

        return { id: s._id, name: s.name, category: s.category, monthly, reasons };
      })
      .filter((f: any) => f.reasons.length > 0);

    const upcoming7 = active.filter((s: any) => inDays(s, 7));
    const upcoming30 = active.filter((s: any) => inDays(s, 30));
    const upcoming30Total = upcoming30.reduce((a: number, s: any) => {
      const price = s.cycle === "monthly" ? s.price : s.price / 12;
      return a + price * (s.customRate && s.customRate > 0 ? s.customRate : rates[s.currency] ?? 1);
    }, 0);

    const top = [...active]
      .sort((a: any, b: any) => toMonthly(b) - toMonthly(a))
      .slice(0, 5)
      .map((s: any) => ({
        id: s._id,
        name: s.name,
        category: s.category,
        monthly: toMonthly(s),
        annual: toMonthly(s) * 12,
        cycle: s.cycle,
        price: s.price,
        currency: s.currency,
      }));

    // Yearly comparison: spend recognised in each calendar year
    const yearsSet = new Set<string>();
    for (const s of rows) {
      const startY = Number(s.startDate.slice(0, 4));
      const endY = s.cancelledAt
        ? new Date(s.cancelledAt).getUTCFullYear()
        : new Date().getUTCFullYear();
      for (let y = startY; y <= Math.min(endY, new Date().getUTCFullYear()); y++) {
        yearsSet.add(String(y));
      }
    }
    const years = [...yearsSet].filter((y) => y !== "1970").sort();

    const yearSpend = years.map((year) => {
      let total = 0;
      for (const s of rows) {
        const rate =
          s.customRate && s.customRate > 0 ? s.customRate : rates[s.currency] ?? 1;
        const monthlyCost =
          (s.cycle === "monthly" ? s.price : s.price / 12) * rate;
        const startY = Number(s.startDate.slice(0, 4));
        const endY = s.cancelledAt
          ? new Date(s.cancelledAt).getUTCFullYear()
          : new Date().getUTCFullYear();
        const months =
          12 * (Math.min(Number(year), endY) - Math.max(startY, Number(year))) +
          Math.min(12, endY === Number(year) ? new Date(s.cancelledAt ?? Date.now()).getUTCMonth() + 1 : 12) -
          Math.max(0, startY === Number(year) ? new Date(s.startDate + "T00:00:00Z").getUTCMonth() : 0);
        total += Math.max(0, Math.min(12, months)) * monthlyCost;
      }
      return { year, total };
    });

    return {
      baseCurrency: base,
      rates,
      monthlyTotal,
      annualTotal,
      activeCount: active.length,
      cancelledCount: rows.length - active.length,
      upcoming7: upcoming7.map((s: any) => ({
        id: s._id,
        name: s.name,
        nextBillingDate: s.nextBillingDate,
        price: s.price,
        currency: s.currency,
        cycle: s.cycle,
      })),
      upcoming30: upcoming30.map((s: any) => ({
        id: s._id,
        name: s.nextBillingDate ? s.name : s.name,
        nextBillingDate: s.nextBillingDate,
        price: s.price,
        currency: s.currency,
        cycle: s.cycle,
      })),
      upcoming30Total,
      top,
      byCategory: Object.entries(byCategory)
        .map(([category, monthly]) => ({
          category,
          monthly,
          annual: monthly * 12,
        }))
        .sort((a, b) => b.monthly - a.monthly),
      flags,
      yearSpend,
    };
  },
});

// ---------- mutations ----------

export const create = mutation({
  args: {
    name: v.string(),
    category: categoryArg,
    cycle: cycleArg,
    billingCycle: cycleArg,
    price: v.number(),
    currency: currencyArg,
    customRate: v.optional(v.number()),
    nextBillingDate: v.string(),
    paymentMethod: v.optional(v.string()),
    startDate: v.string(),
    autoRenew: v.boolean(),
    notes: v.optional(v.string()),
    reviewUsageFrequency: v.optional(usageArg),
    reviewPersonalValue: v.optional(valueArg),
    reviewLastUsedDate: v.optional(v.string()),
    reviewAlternative: v.optional(v.string()),
    reviewCancellationNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await ensureSeeded(ctx, userId);
    return await ctx.db.insert("subscriptions", { userId, ...args });
  },
});

export const update = mutation({
  args: {
    id: v.id("subscriptions"),
    name: v.string(),
    category: categoryArg,
    cycle: cycleArg,
    billingCycle: cycleArg,
    price: v.number(),
    currency: currencyArg,
    customRate: v.optional(v.number()),
    nextBillingDate: v.string(),
    paymentMethod: v.optional(v.string()),
    startDate: v.string(),
    autoRenew: v.boolean(),
    notes: v.optional(v.string()),
    reviewUsageFrequency: v.optional(usageArg),
    reviewPersonalValue: v.optional(valueArg),
    reviewLastUsedDate: v.optional(v.string()),
    reviewAlternative: v.optional(v.string()),
    reviewCancellationNotes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await requireUserId(ctx);
    const sub = await ctx.db.get(id);
    if (!sub || sub.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, patch);
  },
});

export const cancel = mutation({
  args: { id: v.id("subscriptions"), reason: v.optional(v.string()) },
  handler: async (ctx, { id, reason }) => {
    const userId = await requireUserId(ctx);
    const sub = await ctx.db.get(id);
    if (!sub || sub.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { cancelledAt: Date.now(), cancelledReason: reason });
  },
});

export const restore = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const sub = await ctx.db.get(id);
    if (!sub || sub.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, {
      cancelledAt: undefined,
      cancelledReason: undefined,
      nextBillingDate: (() => {
        let d = sub.nextBillingDate;
        const today = new Date().toISOString().slice(0, 10);
        while (d <= today) {
          d = addMonths(d, sub.billingCycle === "monthly" ? 1 : 12);
        }
        return d;
      })(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const sub = await ctx.db.get(id);
    if (!sub || sub.userId !== userId) throw new Error("Not found");
    const logs = await ctx.db
      .query("usageLog")
      .withIndex("by_subscription", (q: any) => q.eq("subscriptionId", id))
      .collect();
    for (const l of logs) await ctx.db.delete(l._id);
    await ctx.db.delete(id);
  },
});

export const markUsed = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const sub = await ctx.db.get(id);
    if (!sub || sub.userId !== userId) throw new Error("Not found");
    const today = todayStr();
    await ctx.db.patch(id, { lastUsedAt: Date.now() });
    await ctx.db.insert("usageLog", {
      userId,
      subscriptionId: id,
      usedOn: today,
    });
  },
});

export const setBaseCurrency = mutation({
  args: { currency: currencyArg },
  handler: async (ctx, { currency }) => {
    const userId = await requireUserId(ctx);
    const settings = await getSettings(ctx, userId);
    await ctx.db.patch(settings._id, { baseCurrency: currency });
  },
});

export const setRates = mutation({
  args: {
    NZD: v.optional(v.number()),
    USD: v.optional(v.number()),
    AUD: v.optional(v.number()),
    CNY: v.optional(v.number()),
    EUR: v.optional(v.number()),
  },
  handler: async (ctx, rates) => {
    const userId = await requireUserId(ctx);
    const settings = await getSettings(ctx, userId);
    const cleaned = Object.fromEntries(
      Object.entries(rates).filter(([, r]) => typeof r === "number" && r > 0),
    );
    await ctx.db.patch(settings._id, { rates: cleaned });
  },
});

export const resetDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    for (const s of rows) {
      const logs = await ctx.db
        .query("usageLog")
        .withIndex("by_subscription", (q: any) =>
          q.eq("subscriptionId", s._id),
        )
        .collect();
      for (const l of logs) await ctx.db.delete(l._id);
      await ctx.db.delete(s._id);
    }
    const settings = await getSettings(ctx, userId);
    await seedForUser(ctx, userId);
    await ctx.db.patch(settings._id, { seeded: true });
  },
});
