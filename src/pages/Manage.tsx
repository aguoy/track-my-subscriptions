import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { CURRENCIES, monthlyEquivalent, type RateTable } from "@/lib/subs";
import { LanguageToggle, useI18n } from "@/lib/i18n";
import { useMutation, useQuery } from "convex/react";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Manage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, formatDate, formatMoney } = useI18n();
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
      toast.success(t("manage.ratesSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("manage.rateError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="grid gap-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("manage.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("manage.subtitle")}</p>
          </div>
          <LanguageToggle className="md:hidden" />
        </header>

        {/* Exchange rates */}
        <Card className="card-quiet">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("manage.ratesTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("manage.ratesBody", base)}</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CURRENCIES.filter((c) => c !== base).map((c) => (
                <div key={c} className="grid gap-1.5">
                  <Label htmlFor={`rate-${c}`} className="text-xs">
                    {t("manage.perUnit", c)}
                  </Label>
                  <Input
                    id={`rate-${c}`}
                    inputMode="decimal"
                    placeholder={base}
                    value={draft[c] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [c]: e.target.value }))}
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
                {t("manage.saveRates")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation history */}
        <Card className="card-quiet">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("manage.historyTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("manage.historyBody")}</p>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("manage.historyEmpty")}</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {history.map((s) => (
                  <li
                    key={s._id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "common.cancelledOn",
                          formatDate(new Date(s.cancelledAt!).toISOString().slice(0, 10)),
                        )}
                        {s.cancelledReason ? ` · ${s.cancelledReason}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {t("common.wasPerMonth", formatMoney(monthlyEquivalent(s, rates, base), base))}
                      </span>
                      <Badge variant="outline">{t(`cat.${s.category}`)}</Badge>
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
            <CardTitle className="text-base">{t("manage.account")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {user?.name || user?.email || t("manage.signedIn")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email ?? t("manage.anonymous")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    resetDemo().then(() => toast.success(t("manage.sampleRestored")))
                  }
                >
                  {t("manage.restoreSample")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut().then(() => navigate("/"))}
                >
                  {t("nav.signOut")}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("manage.sampleNote")}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
