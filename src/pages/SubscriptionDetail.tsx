import { AppShell } from "@/components/AppShell";
import SubscriptionFormDialog from "@/components/SubscriptionFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import {
  CATEGORY_ICONS,
  CATEGORY_TINTS,
  daysSince,
  daysUntil,
  monthlyEquivalent,
  type RateTable,
} from "@/lib/subs";
import { useI18n } from "@/lib/i18n";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, CalendarClock, Check, Pencil, Undo2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

export default function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, formatDate, formatMoney } = useI18n();
  const sub = useQuery(api.subscriptions.get, { id: id as never });
  const settings = useQuery(api.subscriptions.settings);
  const markUsed = useMutation(api.subscriptions.markUsed);
  const cancelSub = useMutation(api.subscriptions.cancel);
  const restoreSub = useMutation(api.subscriptions.restore);

  const [editing, setEditing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const base = settings?.baseCurrency ?? "NZD";
  const rates = (settings?.rates ?? {}) as RateTable;

  if (sub === undefined || settings === undefined) {
    return (
      <AppShell>
        <div className="grid gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppShell>
    );
  }

  if (sub === null) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-lg font-semibold">{t("detail.notFound")}</p>
          <p className="text-sm text-muted-foreground">{t("detail.notFoundBody")}</p>
          <Button variant="outline" onClick={() => navigate("/subscriptions")}>
            {t("detail.backToSubs")}
          </Button>
        </div>
      </AppShell>
    );
  }

  const monthly = monthlyEquivalent(sub, rates, base);
  const due = daysUntil(sub.nextBillingDate);
  const lastUsedLog = sub.lastUsedAt
    ? new Date(sub.lastUsedAt).toISOString().slice(0, 10)
    : undefined;
  const lastUsed = lastUsedLog ?? sub.reviewLastUsedDate;
  const idle = daysSince(lastUsed);

  return (
    <AppShell>
      <div className="grid gap-5">
        <div>
          <Link
            to="/subscriptions"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("detail.backToAll")}
          </Link>
        </div>

        {/* Header card */}
        <Card className="card-quiet">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl",
                    CATEGORY_TINTS[sub.category],
                  )}
                >
                  {CATEGORY_ICONS[sub.category]}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">{sub.name}</h1>
                    {sub.cancelledAt ? (
                      <Badge variant="outline">{t("common.cancelled")}</Badge>
                    ) : sub.autoRenew ? (
                      <Badge variant="secondary">{t("detail.autoRenews")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("detail.manualRenewal")}</Badge>
                    )}
    </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`cat.${sub.category}`)}
                </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {formatMoney(monthly, base)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {t("common.perMonthShort")}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(monthly * 12, base)}
                  {t("common.perYear")} · {base}
                </p>
              </div>
            </div>

            {!sub.cancelledAt && (
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="size-3.5" />
                  {t("common.edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    markUsed({ id: sub._id }).then(() =>
                      toast.success(t("subs.markedUsed", sub.name)),
                    )
                  }
                >
                  <Check className="size-3.5" />
                  {t("detail.usedToday")}
                </Button>
                {sub.cancelledAt ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      restoreSub({ id: sub._id }).then(() =>
                        toast.success(t("subs.restored", sub.name)),
                      )
                    }
                  >
                    <Undo2 className="size-3.5" />
                    {t("subs.restore")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setCancelOpen(true)}
                  >
                    {t("detail.cancelSubscription")}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details card */}
        <Card className="card-quiet">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("detail.details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3">
            <Field label={t("detail.price")}>
              {formatMoney(sub.price, sub.currency)} /{" "}
              {t(sub.cycle === "monthly" ? "common.month" : "common.year")}
            </Field>
            <Field label={t("detail.billsEvery")}>
              {t(sub.billingCycle === "monthly" ? "cycle.monthly" : "cycle.annual")}
            </Field>
            <Field label={t("detail.nextBilling")}>
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <CalendarClock className="size-3.5 text-muted-foreground" />
                {formatDate(sub.nextBillingDate)}
                {!sub.cancelledAt && due >= 0 && (
                  <span className="text-muted-foreground">
                    ·{" "}
                    {due === 0
                      ? t("common.today")
                      : due === 1
                        ? t("common.tomorrow")
                        : t("common.inDays", due)}
                  </span>
                )}
              </span>
            </Field>
            <Field label={t("detail.paymentMethod")}>{sub.paymentMethod ?? "—"}</Field>
            <Field label={t("detail.startDate")}>{formatDate(sub.startDate)}</Field>
            <Field label={t("detail.autoRenewal")}>
              {sub.autoRenew ? t("detail.on") : t("detail.off")}
            </Field>
            {sub.customRate ? (
              <Field label={t("detail.rateOverride")}>
                {t("detail.perUnit", sub.currency)} {t("detail.usesRate", sub.customRate)}{" "}
                {base}
              </Field>
            ) : null}
            {sub.notes && (
              <div className="col-span-2 lg:col-span-3">
                <Field label={t("detail.notes")}>{sub.notes}</Field>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Should I keep this? */}
        <Card className="card-quiet">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("form.reviewTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
              <Field label={t("form.howOftenUsed")}>
                {sub.reviewUsageFrequency
                  ? t(`usage.${sub.reviewUsageFrequency}`)
                  : t("common.notSet")}
              </Field>
              <Field label={t("form.personalValue")}>
                {sub.reviewPersonalValue ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      sub.reviewPersonalValue === "High" &&
                        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                      sub.reviewPersonalValue === "Medium" &&
                        "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                      sub.reviewPersonalValue === "Low" &&
                        "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                    )}
                  >
                    {t(`value.${sub.reviewPersonalValue}`)}
                  </Badge>
                ) : (
                  t("common.notSet")
                )}
              </Field>
              <Field label={t("form.lastUsedDate")}>
                {lastUsed ? formatDate(lastUsed) : t("common.notSet")}
                {idle !== null && idle > 60 && (
                  <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
                    · {t("common.daysAgo", idle)}
                  </span>
                )}
              </Field>
              <Field label={t("form.alternative")}>
                {sub.reviewAlternative ?? t("common.noneNoted")}
              </Field>
            </div>
            {sub.reviewCancellationNotes && (
              <>
                <Separator />
                <Field label={t("form.cancellationNotes")}>
                  {sub.reviewCancellationNotes}
                </Field>
              </>
            )}
          </CardContent>
        </Card>

        {sub.cancelledAt && (
          <Card className="card-quiet border-dashed">
            <CardContent className="p-5 text-sm text-muted-foreground">
              {t(
                "detail.cancelledRecord",
                formatDate(new Date(sub.cancelledAt).toISOString().slice(0, 10)),
                sub.cancelledReason ?? "",
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <SubscriptionFormDialog
        open={editing}
        onOpenChange={setEditing}
        initial={sub}
        rates={rates}
        baseCurrency={base}
      />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("detail.cancelTitle", sub.name)}</DialogTitle>
            <DialogDescription>{t("detail.cancelBody")}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t("detail.cancelReasonPlaceholder")}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              {t("detail.keepIt")}
              </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancelSub({
                  id: sub._id,
                  reason: cancelReason.trim() || undefined,
                }).then(() => {
                  toast.success(t("subs.movedToHistory", sub.name));
                  setCancelOpen(false);
                  navigate("/subscriptions");
                })
              }
            >
              {t("detail.cancelSubscription")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
