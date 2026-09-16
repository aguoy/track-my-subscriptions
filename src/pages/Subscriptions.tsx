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
  formatDate,
  formatMoney,
  monthlyEquivalent,
  type RateTable,
  type Subscription,
} from "@/lib/subs";
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

const SORTS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name A–Z" },
  { key: "price-desc", label: "Most expensive first" },
  { key: "price-asc", label: "Least expensive first" },
  { key: "next", label: "Next billing date" },
];

export default function Subscriptions() {
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
            <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} shown · all amounts in {base}
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
            Add
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
                placeholder="Search by name, payment method, or notes…"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Sort subscriptions"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 rounded-md border border-input bg-card px-2.5 text-sm text-foreground outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {["All", ...CATEGORIES].map((c) => (
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
                {c}
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
                Cancelled ({cancelledCount})
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card className="card-quiet">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm font-medium">No subscriptions found</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {query || category !== "All"
                  ? "Try a different search or category."
                  : "Add your first subscription to start tracking your recurring spend."}
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
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/subscriptions/${s._id}`}
                            className="truncate text-sm font-semibold hover:text-primary"
                          >
                            {s.name}
                          </Link>
                          {s.cancelledAt && <Badge variant="outline">Cancelled</Badge>}
                          {!s.autoRenew && !s.cancelledAt && (
                            <Badge variant="secondary">No auto-renew</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {formatMoney(s.price, s.currency)} per {s.cycle === "monthly" ? "month" : "year"}
                          {" · "}
                          {s.cancelledAt
                            ? `Cancelled ${formatDate(new Date(s.cancelledAt).toISOString().slice(0, 10))}`
                            : due === 0
                              ? "Renews today"
                              : due === 1
                                ? "Renews tomorrow"
                                : due > 1
                                  ? `Renews ${formatDate(s.nextBillingDate)}`
                                  : "Renewal date passed"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatMoney(m, base)}
                        </p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
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
                            Edit
                          </DropdownMenuItem>
                          {!s.cancelledAt && (
                            <DropdownMenuItem
                              onClick={() =>
                                markUsed({ id: s._id }).then(() =>
                                  toast.success(`Marked ${s.name} as used today`),
                                )
                              }
                            >
                              <Archive className="size-4" />
                              Mark as used today
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {s.cancelledAt ? (
                            <DropdownMenuItem
                              onClick={() =>
                                restoreSub({ id: s._id }).then(() =>
                                  toast.success(`${s.name} restored`),
                                )
                              }
                            >
                              <ArchiveRestore className="size-4" />
                              Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                cancelSub({ id: s._id }).then(() =>
                                  toast.success(`${s.name} moved to cancellation history`),
                                )
                              }
                            >
                              <Archive className="size-4" />
                              Cancel
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
