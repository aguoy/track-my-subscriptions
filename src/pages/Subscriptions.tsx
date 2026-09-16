import { AppShell } from "@/components/AppShell";
import SubscriptionFormDialog from "@/components/SubscriptionFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
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
import { useMutation, useQuery } from "convex/react";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SortKey = "name" | "price-desc" | "price-asc" | "next";

const SORT_KEYS: { key: SortKey; labelKey: string }[] = [
  { key: "name", labelKey: "subs.sortName" },
  { key: "price-desc", labelKey: "subs.sortPriceDesc" },
  { key: "price-asc", labelKey: "subs.sortPriceAsc" },
  { key: "next", labelKey: "subs.sortNext" },
];

export default function Subscriptions() {
  const { t, formatDate, formatMoney } = useI18n();
  const subs = useQuery(api.subscriptions.list, { includeCancelled: true });
  const settings = useQuery(api.subscriptions.settings);
  const cancelSub = useMutation(api.subscriptions.cancel);
  const restoreSub = useMutation(api.subscriptions.restore);
  const markUsed = useMutation(api.subscriptions.markUsed);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [showCancelled, setShowCancelled] = useState(false);
  const [sort, setSort] = useState<SortKey>("price-desc");
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const base = settings?.baseCurrency ?? "NZD";
  const rates = (settings?.rates ?? {}) as RateTable;

  const filtered = useMemo(() => {
    let rows = subs ?? [];
    if (!showCancelled) rows = rows.filter((s) => !s.cancelledAt);
    if (category !== "All") rows = rows.filter((s) => s.category === category);
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.paymentMethod?.toLowerCase().includes(q) ||
          s.notes?.toLowerCase().includes(q),
      );
    }
    const monthly = (s: Subscription) => monthlyEquivalent(s, rates, base);
    return [...rows].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-desc":
          return monthly(b) - monthly(a);
        case "price-asc":
          return monthly(a) - monthly(b);
        case "next":
          return a.nextBillingDate.localeCompare(b.nextBillingDate);
      }
    });
  }, [subs, query, category, showCancelled, sort, rates, base]);

  const cancelledCount = (subs ?? []).filter((s) => s.cancelledAt).length;

  if (subs === undefined || settings === undefined) {
    return (
      <AppShell>
        <div className="grid gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("subs.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("subs.shown", filtered.length)} · {t("dash.allAmountsIn", base)}
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            {t("common.add")}
          </Button>
        </header>

        {/* Search + filters */}
        <div className="grid gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("subs.searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label={t("common.sort")}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 rounded-md border border-input bg-card px-2.5 text-sm text-foreground outline-none"
              >
                {SORT_KEYS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {t(s.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategory("All")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                category === "All"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {t("common.all")}
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  category === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`cat.${c}`)}
              </button>
            ))}
            {cancelledCount > 0 && (
              <button
                onClick={() => setShowCancelled((v) => !v)}
                className={cn(
                  "ml-auto rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  showCancelled
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {t("subs.cancelledWithCount", cancelledCount)}
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card className="card-quiet">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm font-medium">{t("subs.noneFound")}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {query || category !== "All"
                  ? t("subs.tryDifferent")
                  : t("subs.addFirst")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3">
            {filtered.map((s) => {
              const m = monthlyEquivalent(s, rates, base);
              const due = daysUntil(s.nextBillingDate);
              return (
                <li key={s._id}>
                  <Card
                    className={cn(
                      "card-quiet py-0 transition-opacity",
                      s.cancelledAt && "opacity-60",
                    )}
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg text-lg",
                          CATEGORY_TINTS[s.category],
                        )}
                      >
                        {CATEGORY_ICONS[s.category]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link
                            to={`/subscriptions/${s._id}`}
                            className="truncate text-sm font-semibold hover:text-primary"
                          >
                            {s.name}
                          </Link>
                          {s.cancelledAt && (
                            <Badge variant="outline">{t("common.cancelled")}</Badge>
                          )}
                          {!s.autoRenew && !s.cancelledAt && (
                            <Badge variant="secondary">{t("subs.noAutoRenew")}</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {formatMoney(s.price, s.currency)}
                          {" / "}
                          {t(s.cycle === "monthly" ? "common.month" : "common.year")}
                          {" · "}
                          {s.cancelledAt
                            ? t(
                                "common.cancelledOn",
                                formatDate(
                                  new Date(s.cancelledAt).toISOString().slice(0, 10),
                                ),
                              )
                            : due === 0
                              ? t("common.renewsToday")
                              : due === 1
                                ? t("common.renewsTomorrow")
                                : due > 1
                                  ? t("common.renewsOn", formatDate(s.nextBillingDate))
                                  : t("common.renewalPassed")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatMoney(m, base)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("common.perMonthShort")}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">{t("subs.actions")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(s);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          {!s.cancelledAt && (
                            <DropdownMenuItem
                              onClick={() =>
                                markUsed({ id: s._id }).then(() =>
                                  toast.success(t("subs.markedUsed", s.name)),
                                )
                              }
                            >
                              <Archive className="size-4" />
                              {t("subs.markUsed")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {s.cancelledAt ? (
                            <DropdownMenuItem
                              onClick={() =>
                                restoreSub({ id: s._id }).then(() =>
                                  toast.success(t("subs.restored", s.name)),
                                )
                              }
                            >
                              <ArchiveRestore className="size-4" />
                              {t("subs.restore")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                cancelSub({ id: s._id }).then(() =>
                                  toast.success(t("subs.movedToHistory", s.name)),
                                )
                              }
                            >
                              <Archive className="size-4" />
                              {t("common.cancel")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <SubscriptionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        rates={rates}
        baseCurrency={base}
      />
    </AppShell>
  );
}
