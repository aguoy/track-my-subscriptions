import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Subscription } from "@/lib/subs";
import { CATEGORIES, CURRENCIES, todayStr, type RateTable } from "@/lib/subs";
import { useI18n } from "@/lib/i18n";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type FormState = {
  name: string;
  category: string;
  cycle: "monthly" | "annual";
  billingCycle: "monthly" | "annual";
  price: string;
  currency: string;
  customRate: string;
  nextBillingDate: string;
  paymentMethod: string;
  startDate: string;
  autoRenew: boolean;
  notes: string;
  reviewUsageFrequency: string;
  reviewPersonalValue: string;
  reviewLastUsedDate: string;
  reviewAlternative: string;
  reviewCancellationNotes: string;
};

function addMonths(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

function blankForm(): FormState {
  const today = todayStr();
  return {
    name: "",
    category: "Other",
    cycle: "monthly",
    billingCycle: "monthly",
    price: "",
    currency: "NZD",
    customRate: "",
    nextBillingDate: addMonths(today, 1),
    paymentMethod: "",
    startDate: today,
    autoRenew: true,
    notes: "",
    reviewUsageFrequency: "",
    reviewPersonalValue: "",
    reviewLastUsedDate: "",
    reviewAlternative: "",
    reviewCancellationNotes: "",
  };
}

function fromSubscription(s: Subscription): FormState {
  return {
    name: s.name,
    category: s.category,
    cycle: s.cycle,
    billingCycle: s.billingCycle,
    price: String(s.price),
    currency: s.currency,
    customRate: s.customRate ? String(s.customRate) : "",
    nextBillingDate: s.nextBillingDate,
    paymentMethod: s.paymentMethod ?? "",
    startDate: s.startDate,
    autoRenew: s.autoRenew,
    notes: s.notes ?? "",
    reviewUsageFrequency: s.reviewUsageFrequency ?? "",
    reviewPersonalValue: s.reviewPersonalValue ?? "",
    reviewLastUsedDate: s.reviewLastUsedDate ?? "",
    reviewAlternative: s.reviewAlternative ?? "",
    reviewCancellationNotes: s.reviewCancellationNotes ?? "",
  };
}

const orUndefined = (v: string) => (v.trim() === "" ? undefined : v.trim());

export default function SubscriptionFormDialog({
  open,
  onOpenChange,
  initial,
  rates,
  baseCurrency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Subscription | null;
  rates: RateTable | undefined;
  baseCurrency: string;
}) {
  const { t, formatNumber } = useI18n();
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ? fromSubscription(initial) : blankForm());
  }, [open, initial]);

  const create = useMutation(api.subscriptions.create);
  const update = useMutation(api.subscriptions.update);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const preview = useMemo(() => {
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) return null;
    const custom = form.customRate ? Number(form.customRate) : undefined;
    const monthly = form.cycle === "monthly" ? price : price / 12;
    const rate =
      form.currency === baseCurrency ? 1 : custom ?? rates?.[form.currency] ?? 1;
    return { monthly: monthly * rate, annual: monthly * rate * 12 };
  }, [form.price, form.cycle, form.currency, form.customRate, rates, baseCurrency]);

  const canSave =
    form.name.trim() !== "" &&
    Number(form.price) > 0 &&
    form.nextBillingDate !== "" &&
    form.startDate !== "";

  const handleSubmit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category as never,
      cycle: form.cycle,
      billingCycle: form.billingCycle,
      price: Number(form.price),
      currency: form.currency as never,
      customRate: form.customRate ? Number(form.customRate) : undefined,
      nextBillingDate: form.nextBillingDate,
      paymentMethod: orUndefined(form.paymentMethod),
      startDate: form.startDate,
      autoRenew: form.autoRenew,
      notes: orUndefined(form.notes),
      reviewUsageFrequency: orUndefined(form.reviewUsageFrequency) as never,
      reviewPersonalValue: orUndefined(form.reviewPersonalValue) as never,
      reviewLastUsedDate: orUndefined(form.reviewLastUsedDate),
      reviewAlternative: orUndefined(form.reviewAlternative),
      reviewCancellationNotes: orUndefined(form.reviewCancellationNotes),
    };
    try {
      if (initial) {
        await update({ id: initial._id, ...payload });
        toast.success(t("form.updated"));
      } else {
        await create(payload);
        toast.success(t("form.added", payload.name));
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("form.somethingWrong"));
    } finally {
      setSaving(false);
    }
  };

  const defaultRate = rates?.[form.currency];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? t("form.editTitle") : t("form.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {initial ? t("form.editDesc") : t("form.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* --- Details --- */}
          <div className="grid gap-2">
            <Label htmlFor="sub-name">{t("form.serviceName")}</Label>
            <Input
              id="sub-name"
              placeholder={t("form.namePlaceholder")}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("form.category")}</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`cat.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sub-price">{t("form.price")}</Label>
              <Input
                id="sub-price"
                inputMode="decimal"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("form.currency")}</Label>
              <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("form.priceIsPer")}</Label>
              <Select
                value={form.cycle}
                onValueChange={(v) => set("cycle", v as "monthly" | "annual")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t("cycle.monthly")}</SelectItem>
                  <SelectItem value="annual">{t("cycle.annual")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("form.billsEvery")}</Label>
              <Select
                value={form.billingCycle}
                onValueChange={(v) => set("billingCycle", v as "monthly" | "annual")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t("cycle.monthly")}</SelectItem>
                  <SelectItem value="annual">{t("cycle.annual")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sub-start">{t("form.startDate")}</Label>
              <Input
                id="sub-start"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-next">{t("form.nextBillingDate")}</Label>
              <Input
                id="sub-next"
                type="date"
                value={form.nextBillingDate}
                onChange={(e) => set("nextBillingDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sub-payment">{t("form.paymentMethod")}</Label>
            <Input
              id="sub-payment"
              placeholder={t("form.paymentPlaceholder")}
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
            <Label htmlFor="sub-autorenew" className="cursor-pointer">
              {t("form.autoRenewal")}
            </Label>
            <Switch
              id="sub-autorenew"
              checked={form.autoRenew}
              onCheckedChange={(v) => set("autoRenew", v)}
            />
          </div>

          {form.currency !== baseCurrency && (
            <div className="grid gap-2">
              <Label htmlFor="sub-rate">
                {t("form.exchangeRate")}{" "}
                <span className="text-muted-foreground">({t("common.optional")})</span>
              </Label>
              <Input
                id="sub-rate"
                inputMode="decimal"
                placeholder={t("form.ratePlaceholder", form.currency)}
                value={form.customRate}
                onChange={(e) => set("customRate", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {typeof defaultRate === "number" && defaultRate > 0
                  ? t("form.rateHelp", baseCurrency, form.currency, formatNumber(defaultRate))
                  : t("form.rateHelpNoDefault", baseCurrency, form.currency)}
              </p>
            </div>
          )}

          {preview && (
            <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
              {t("form.previewMonthly", formatNumber(preview.monthly, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}{" "}
              ·{" "}
              {t("form.previewAnnual", formatNumber(preview.annual, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}{" "}
              {baseCurrency}
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="sub-notes">{t("form.notes")}</Label>
            <Textarea
              id="sub-notes"
              placeholder={t("form.notesPlaceholder")}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
            />
          </div>

          <Separator />

          {/* --- Should I keep this? --- */}
          <div>
            <p className="text-sm font-semibold">{t("form.reviewTitle")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("form.reviewDesc")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("form.howOftenUsed")}</Label>
              <Select
                value={form.reviewUsageFrequency || undefined}
                onValueChange={(v) => set("reviewUsageFrequency", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("common.notSet")} />
                </SelectTrigger>
                <SelectContent>
                  {["Daily", "Weekly", "Monthly", "Rarely", "Never"].map((u) => (
                    <SelectItem key={u} value={u}>
                      {t(`usage.${u}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("form.personalValue")}</Label>
              <Select
                value={form.reviewPersonalValue || undefined}
                onValueChange={(v) => set("reviewPersonalValue", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("common.notSet")} />
                </SelectTrigger>
                <SelectContent>
                  {["High", "Medium", "Low"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`value.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sub-lastused">{t("form.lastUsedDate")}</Label>
            <Input
              id="sub-lastused"
              type="date"
              value={form.reviewLastUsedDate}
              onChange={(e) => set("reviewLastUsedDate", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sub-alt">{t("form.alternative")}</Label>
            <Input
              id="sub-alt"
              placeholder={t("form.alternativePlaceholder")}
              value={form.reviewAlternative}
              onChange={(e) => set("reviewAlternative", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sub-cancel-notes">{t("form.cancellationNotes")}</Label>
            <Textarea
              id="sub-cancel-notes"
              placeholder={t("form.cancellationNotesPlaceholder")}
              value={form.reviewCancellationNotes}
              onChange={(e) => set("reviewCancellationNotes", e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {initial ? t("form.saveChanges") : t("form.addSubscription")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
