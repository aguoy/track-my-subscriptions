import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import {
  formatMoney,
  monthlyEquivalent,
  type RateTable,
  type Subscription,
} from "@/lib/subs";
import { useQuery } from "convex/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Months a sub contributed spend within a calendar year, clamped to 0..12. */
function monthsActiveIn(s: Subscription, year: number): number {
  const start = Math.max(
    new Date(`${s.startDate.slice(0, 4)}-01-01T00:00:00Z`).getTime(),
    Date.UTC(year, 0, 1),
  );
  const end = Math.min(
    s.cancelledAt ? new Date(s.cancelledAt).getTime() : Date.now(),
    Date.UTC(year, 11, 31, 23, 59, 59),
  );
  if (end < start) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const months =
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    (endDate.getUTCMonth() - startDate.getUTCMonth()) +
    1;
  return Math.max(0, Math.min(12, months));
}

export default function YearComparison() {
  const subs = useQuery(api.subscriptions.list, { includeCancelled: true });
  const settings = useQuery(api.subscriptions.settings);

  const base = settings?.baseCurrency ?? "NZD";
  const rates = (settings?.rates ?? {}) as RateTable;

  const years = useMemo(() => {
    const rows = subs ?? [];
    const thisYear = new Date().getUTCFullYear();
    const map = new Map<number, number>();
    for (const s of rows) {
      const monthly = monthlyEquivalent(s, rates, base);
      const startY = Number(s.startDate.slice(0, 4));
      const endY = s.cancelledAt
        ? new Date(s.cancelledAt).getUTCFullYear()
        : thisYear;
      for (let y = startY; y <= Math.min(endY, thisYear); y++) {
        map.set(y, (map.get(y) ?? 0) + monthsActiveIn(s, y) * monthly);
      }
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, total]) => {
        const prev = map.get(year - 1);
        return { year: String(year), total, growth: prev ? total / prev - 1 : null };
      });
  }, [subs, rates, base]);

  if (subs === undefined || settings === undefined) {
    return (
      <AppShell>
        <div className="grid gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  const activeYears = years.filter((y) => y.total > 0);
  const max = Math.max(...activeYears.map((y) => y.total), 1);
  const last = activeYears[activeYears.length - 1];
  const prev = activeYears[activeYears.length - 2];

  return (
    <AppShell>
      <div className="grid gap-5">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Yearly comparison</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How your recurring spend has moved over time, in {base}.
          </p>
        </header>

        {activeYears.length === 0 ? (
          <Card className="card-quiet">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Add subscriptions to see your yearly totals here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {last && prev && (
              <Card className="card-quiet">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {last.year} vs {prev.year}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                      {formatMoney(last.total, base)}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        vs {formatMoney(prev.total, base)}
                      </span>
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium",
                      last.total <= prev.total
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                    )}
                  >
                    {last.total <= prev.total ? (
                      <TrendingDown className="size-4" />
                    ) : (
                      <TrendingUp className="size-4" />
                    )}
                    {last.total === prev.total
                      ? "No change"
                      : `${last.total > prev.total ? "+" : ""}${(
                          (last.total / prev.total - 1) * 100
                        ).toFixed(1)}% vs last year`}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="card-quiet">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Spend by year</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {activeYears.map((y) => (
                  <div key={y.year}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">
                        {y.year}
                        {y.growth !== null && (
                          <span
                            className={cn(
                              "ml-2 text-xs font-medium",
                              y.growth > 0
                                ? "text-rose-600 dark:text-rose-400"
                                : y.growth < 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground",
                            )}
                          >
                            {y.growth > 0 ? "+" : ""}
                            {(y.growth * 100).toFixed(0)}% vs previous
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatMoney(y.total, base)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-8 overflow-hidden rounded-md bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-md transition-all",
                          y.year === last?.year ? "bg-primary" : "bg-primary/50",
                        )}
                        style={{ width: `${Math.max(2, (y.total / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
