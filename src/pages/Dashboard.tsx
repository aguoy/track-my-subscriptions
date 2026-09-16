import { AppShell } from "@/components/AppShell";
import SubscriptionFormDialog from "@/components/SubscriptionFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_TINTS,
  daysUntil,
  monthlyEquivalent,
  type RateTable,
  type Subscription,
} from "@/lib/subs";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "convex/react";
import { ArrowUpRight, Plus, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="card-quiet">
      <CardContent className="p-5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { isLoading } = useAuth();
  const { t, formatDate, formatMoney, formatNumber } = useI18n();
  const subs = useQuery(api.subscriptions.list, { includeCancelled: false });
  const settings = useQuery(api.subscriptions.settings);
  const [formOpen, setFormOpen] = useState(false);

  const base = settings?.baseCurrency ?? "NZD";
  const rates = (settings?.rates ?? {}) as RateTable;

  const active = useMemo(
    () => (subs ?? []).filter((s) => !s.cancelledAt),
    [subs],
  );

  const monthlyTotal = useMemo(
    () => active.reduce((a, s) => a + monthlyEquivalent(s, rates, base), 0),
    [active, rates, base],
  );

  const upcoming7 = useMemo(
    () =>
      active
        .filter((s) => {
          const d = daysUntil(s.nextBillingDate);
          return d >= 0 && d <= 7;
        })
        .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate)),
    [active],
  );

  const upcoming30 = useMemo(
    () =>
      active.filter((s) => {
        const d = daysUntil(s.nextBillingDate);
        return d >= 0 && d <= 30;
      }),
    [active],
  );

  const top = useMemo(
    () =>
      [...active]
        .sort(
          (a, b) => monthlyEquivalent(b, rates, base) - monthlyEquivalent(a, rates, base),
        )
        .slice(0, 5),
    [active, rates, base],
  );

  const byCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of active) {
      totals.set(
        s.category,
        (totals.get(s.category) ?? 0) + monthlyEquivalent(s, rates, base),
      );
    }
    return CATEGORIES.map((c) => ({ category: c, monthly: totals.get(c) ?? 0 }))
      .filter((c) => c.monthly > 0)
      .sort((a, b) => b.monthly - a.monthly);
  }, [active, rates, base]);

  const flagged = useMemo(
    () =>
      active
        .map((s) => {
          const reasons: { key: string; args?: unknown[] }[] = [];
          const monthly = monthlyEquivalent(s, rates, base);
          const usage = s.reviewUsageFrequency;
          const lastUsed = s.lastUsedAt
            ? new Date(s.lastUsedAt).toISOString().slice(0, 10)
            : s.reviewLastUsedDate;
          if (usage === "Never") reasons.push({ key: "dash.noRecordedUse" });
          if (monthly > 15 && (usage === "Rarely" || usage === "Never")) {
            reasons.push({ key: "dash.costlyRarelyUsed" });
          }
          if (lastUsed) {
            const daysIdle = Math.floor(
              (Date.now() - new Date(`${lastUsed}T00:00:00Z`).getTime()) / 86400000,
            );
            if (daysIdle > 60) reasons.push({ key: "dash.unusedFor", args: [daysIdle] });
          }
          if (s.reviewAlternative && s.reviewPersonalValue === "Low") {
            reasons.push({ key: "dash.alternative", args: [s.reviewAlternative] });
          }
          if (s.reviewAlternative) {
            const dup = active.find(
              (o) =>
                o._id !== s._id &&
                o.name.toLowerCase() === s.reviewAlternative!.toLowerCase(),
            );
            if (dup) reasons.push({ key: "dash.overlapsWith", args: [dup.name] });
          }
          return { sub: s, monthly, reasons };
        })
        .filter((f) => f.reasons.length > 0)
        .sort((a, b) => b.monthly - a.monthly),
    [active, rates, base],
  );

  const maxCat = byCategory[0]?.monthly ?? 1;
  const maxTop = top[0] ? monthlyEquivalent(top[0], rates, base) : 1;

  if (isLoading || subs === undefined || settings === undefined) {
    return (
      <AppShell>
        <div className="grid gap-4">
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("dash.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dash.activeCount", active.length)} · {t("dash.allAmountsIn", base)}
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-1.5">
            <Plus className="size-4" />
            {t("common.add")}
          </Button>
        </header>

        {/* Totals */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="card-quiet">
            <CardContent className="p-6">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("dash.monthlyRecurring")}
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
                {formatMoney(monthlyTotal, base)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("dash.aYear", formatMoney(monthlyTotal * 12, base))}
              </p>
            </CardContent>
          </Card>
          <Card className="card-quiet">
            <CardContent className="p-6">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("dash.annualRecurring")}
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
                {formatMoney(monthlyTotal * 12, base)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("dash.paymentsDue", upcoming30.length)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="card-quiet lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("dash.due7")}</CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming7.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("dash.quietWeek")}</p>
              ) : (
                <ul className="divide-y divide-border/70">
                  {upcoming7.map((s) => {
                    const d = daysUntil(s.nextBillingDate);
                    return (
                      <li key={s._id} className="flex items-center justify-between py-2.5">
                        <Link
                          to={`/subscriptions/${s._id}`}
                          className="flex items-center gap-2.5 text-sm font-medium hover:text-primary"
                        >
                          <span>{CATEGORY_ICONS[s.category]}</span>
                          {s.name}
                        </Link>
                        <div className="text-right">
                          <p className="text-sm font-medium tabular-nums">
                            {formatMoney(s.price, s.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {d === 0
                              ? t("common.today")
                              : d === 1
                                ? t("common.tomorrow")
                                : t("common.inDays", d)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Stat
              label={t("dash.due30")}
              value={formatNumber(upcoming30.length)}
              sub={t(
                "dash.chargesIn30",
                formatMoney(
                  upcoming30.reduce(
                    (a, s) =>
                      a +
                      (s.cycle === "monthly" ? s.price : s.price / 12) *
                        (s.currency === base
                          ? 1
                          : s.customRate && s.customRate > 0
                            ? s.customRate
                            : rates[s.currency] ?? 1),
                    0,
                  ),
                  base,
                ),
              )}
            />
            <Stat
              label={t("dash.largestMonthly")}
              value={
                top[0]
                  ? formatMoney(monthlyEquivalent(top[0], rates, base), base)
                  : "—"
              }
              sub={top[0]?.name ?? t("dash.noSubsYet")}
            />
          </div>
        </div>

        {/* Top spenders + categories */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="card-quiet">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("dash.mostExpensive")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3">
                {top.map((s: Subscription) => {
                  const m = monthlyEquivalent(s, rates, base);
                  return (
                    <li key={s._id}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <Link
                          to={`/subscriptions/${s._id}`}
                          className="truncate font-medium hover:text-primary"
                        >
                          {s.name}
                        </Link>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {formatMoney(m, base)}
                          {t("common.perMonthShort")}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${Math.max(4, (m / maxTop) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card className="card-quiet">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("dash.byCategory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3">
                {byCategory.map(({ category, monthly }) => (
                  <li key={category}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-md text-[13px]",
                            CATEGORY_TINTS[category],
                          )}
                        >
                          {CATEGORY_ICONS[category]}
                        </span>
                        {t(`cat.${category}`)}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatMoney(monthly, base)}
                        {t("common.perMonthShort")}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.max(4, (monthly / maxCat) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Should I keep this? */}
        <Card className="card-quiet">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TriangleAlert className="size-4 text-amber-500" />
              {t("dash.keepTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flagged.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dash.keepEmpty")}</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {flagged.map(({ sub, monthly, reasons }) => (
                  <li key={sub._id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/subscriptions/${sub._id}`}
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                      >
                        {sub.name}
                        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                      </Link>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {reasons.map((r) => (
                          <Badge
                            key={r.key + JSON.stringify(r.args ?? "")}
                            variant="secondary"
                            className="font-normal text-muted-foreground"
                          >
                            {t(r.key, ...(r.args ?? []))}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {formatMoney(monthly, base)}
                      {t("common.perMonthShort")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <SubscriptionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={null}
        rates={rates}
        baseCurrency={base}
      />
    </AppShell>
  );
}
