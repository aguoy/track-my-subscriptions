import type { Doc, Id } from "@/convex/_generated/dataModel";

// ---------- constants ----------

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
export type CurrencyCode = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NZD: "$",
  USD: "$",
  AUD: "$",
  CNY: "¥",
  EUR: "€",
};

export const CATEGORY_ICONS: Record<(typeof CATEGORIES)[number], string> = {
  "AI services": "🤖",
  "Cloud storage": "☁️",
  Streaming: "📺",
  "Mobile phone": "📱",
  Internet: "🌐",
  Software: "💻",
  Insurance: "🛡️",
  Membership: "🎟️",
  Banking: "🏦",
  News: "📰",
  Education: "🎓",
  Other: "📦",
};

export const CATEGORY_TINTS: Record<(typeof CATEGORIES)[number], string> = {
  "AI services": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "Cloud storage": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  Streaming: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "Mobile phone": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Internet: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  Software: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  Insurance: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Membership: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Banking: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  News: "bg-stone-500/10 text-stone-600 dark:text-stone-400",
  Education: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Other: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

export type Subscription = Doc<"subscriptions">;
export type Settings = Doc<"userSettings">;
export type NewSubscriptionInput = Omit<
  Subscription,
  "_id" | "_creationTime" | "userId" | "cancelledAt" | "cancelledReason" | "lastUsedAt"
> & { _id?: Id<"subscriptions"> };

// ---------- money math ----------

export type RateTable = Record<string, number>;

/** Units of base currency per 1 unit of `currency`. Falls back to 1. */
export function rateFor(
  currency: string,
  rates: RateTable | undefined,
  baseCurrency: string,
  customRate?: number,
): number {
  if (currency === baseCurrency) return 1;
  if (customRate && customRate > 0) return customRate;
  const r = rates?.[currency];
  return typeof r === "number" && r > 0 ? r : 1;
}

export function monthlyEquivalent(
  s: Pick<Subscription, "price" | "cycle" | "currency" | "customRate">,
  rates: RateTable | undefined,
  baseCurrency: string,
): number {
  const rate = rateFor(s.currency, rates, baseCurrency, s.customRate);
  const monthly = s.cycle === "monthly" ? s.price : s.price / 12;
  return monthly * rate;
}

export function annualEquivalent(
  s: Pick<Subscription, "price" | "cycle" | "currency" | "customRate">,
  rates: RateTable | undefined,
  baseCurrency: string,
): number {
  return monthlyEquivalent(s, rates, baseCurrency) * 12;
}

// ---------- formatting ----------

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  } catch {
    return `${CURRENCY_SYMBOLS[currency as CurrencyCode] ?? ""}${value.toFixed(2)}`;
  }
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function daysUntil(iso: string | undefined): number {
  if (!iso) return Infinity;
  const diff =
    new Date(`${iso}T00:00:00Z`).getTime() - new Date(`${todayStr()}T00:00:00Z`).getTime();
  return Math.round(diff / 86400000);
}

export function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  const diff =
    new Date(`${todayStr()}T00:00:00Z`).getTime() -
    new Date(`${iso}T00:00:00Z`).getTime();
  return Math.round(diff / 86400000);
}

/** Review flag reasons for the "Should I keep this?" panel. */
export function reviewFlags(
  s: Subscription,
  lastUsedLog?: string,
): string[] {
  const flags: string[] = [];
  const value = s.reviewPersonalValue;
  const usage = s.reviewUsageFrequency;
  const idle = daysSince(lastUsedLog ?? s.reviewLastUsedDate);

  if (usage === "Never") flags.push("No recorded use");
  if (idle !== null && idle > 60) flags.push(`Unused for ${idle} days`);
  if (
    (usage === "Rarely" || usage === "Never") &&
    value !== "High" &&
    s.reviewAlternative
  ) {
    flags.push(`Alternative available: ${s.reviewAlternative}`);
  }
  return flags;
}

export function duplicateFlag(
  s: Subscription,
  all: Subscription[],
): string | null {
  if (!s.reviewAlternative) return null;
  const match = all.find(
    (o) =>
      o._id !== s._id &&
      !o.cancelledAt &&
      o.name.toLowerCase() === s.reviewAlternative!.toLowerCase(),
  );
  return match ? `Overlaps with ${match.name}` : null;
}
