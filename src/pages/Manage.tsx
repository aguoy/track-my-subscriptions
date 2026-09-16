import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  CURRENCIES,
  daysSince,
  formatDate,
  formatMoney,
  monthlyEquivalent,
  type RateTable,
} from "@/lib/subs";
import { useMutation, useQuery } from "convex/react";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Manage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const subs = useQuery(api.subscriptions.list, { includeCancelled: true });
  const settings = useQuery(api.subscriptions.settings);
  const setRates = useMutation(api.subscriptions.setRates);
  const resetDemo = useMutation(api.subscriptions.resetDemo);

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const base = settings?.baseCurrency ?? "NZD";
  const rates = (settings?.rates ?? {}) as RateTable;

  useEffect(() => {
    if (settings) {
      setDraft(
        Object.fromEntries(
          CURRENCIES.filter((c) => c !== base).map((c) => [
            c,
            rates[c] !== undefined ? String(rates[c]) : "",
          ]),
        ),
      );
    }
  }, [settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const history = (subs ?? [])
    .filter((s) => s.cancelledAt)
    .sort((a, b) => (b.cancelledAt ?? 0) - (a.cancelledAt ?? 0));

  if (settings === undefined || subs === undefined) {
    return (
      <AppShell>
        <div className="grid gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  const saveRates = async () => {
    setSaving(true);
    try {
      const parsed: Record<string, number> = {};
      for (const [code, raw] of Object.entries(draft)) {
        const n = Number(raw);
        if (raw.trim() !== "" && Number.isFinite(n) && n > 0) parsed[code] = n;
      }
      await setRates(parsed as never);
      toast.success("Exchange rates saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save rates");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="grid gap-5">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Manage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Exchange rates, cancellation history, and account settings.
          </p>
        </header>

        {/* Exchange rates */}
        <Card className="card-quiet">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Default exchange rates</CardTitle>
            <p className="text-sm text-muted-foreground">
              How much 1 unit of each currency is worth in your home currency
              ({base}). You can also set a rate on an individual subscription.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CURRENCIES.filter((c) => c !== base).map((c) => (
                <div key={c} className="grid gap-1.5">
                  <Label htmlFor={`rate-${c}`} className="text-xs">
                    1 {c} =
                  </Label>
                  <Input
                    id={`rate-${c}`}
                    inputMode="decimal"
                    placeholder={`${base}`}
                    value={draft[c] ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [c]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div>
              <Button onClick={saveRates} disabled={saving} className="gap-1.5">
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Save rates
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation history */}
        <Card className="card-quiet">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cancellation history</CardTitle>
            <p className="text-sm text-muted-foreground">
              Cancelled subscriptions are never deleted — they're kept here with
              their full record.
            </p>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing cancelled yet. When you cancel a subscription it will
                appear here.
              </p>
            ) : (
              <ul className="divide-y divide-border/70">
                {history.map((s) => (
                  <li key={s._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Cancelled{" "}
                        {formatDate(
                          new Date(s.cancelledAt!).toISOString().slice(0, 10),
                        )}
                        {s.cancelledReason ? ` · ${s.cancelledReason}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums text-muted-foreground">
                        was {formatMoney(monthlyEquivalent(s, rates, base), base)}/mo
                      </span>
                      <Badge variant="outline">{s.category}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="card-quiet">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {user?.name || user?.email || "Signed in"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email ?? "Anonymous guest session"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    resetDemo().then(() => toast.success("Sample data restored"))
                  }
                >
                  Restore sample data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut().then(() => navigate("/"))}
                >
                  Sign out
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Restoring sample data replaces your current list with the starter
              AI, cloud storage, mobile, and streaming examples.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
