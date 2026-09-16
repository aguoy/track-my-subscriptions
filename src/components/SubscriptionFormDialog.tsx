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
import {
  CATEGORIES,
  CURRENCIES,
  monthlyEquivalent,
  todayStr,
  type RateTable,
} from "@/lib/subs";
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
    const monthly =
      form.cycle === "monthly" ? price : price / 12;
    const rate =
      form.currency === baseCurrency
        ? 1
        : custom ?? rates?.[form.currency] ?? 1;
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
        toast.success("Subscription updated");
      } else {
        await create(payload);
        toast.success(`${payload.name} added`);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit subscription" : "Add subscription"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Update the details, billing, or review notes for this service."
              : "Track a recurring service so nothing sneaks up on you."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* --- Details --- */}
          <div className="grid gap-2">
            <Label htmlFor="sub-name">Service name</Label>
            <Input
              id="sub-name"
              placeholder="e.g. Netflix"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => set("category", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sub-price">Price</Label>
              <Input
                id="sub-price"
                inputMode="decimal"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => set("currency", v)}
              >
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
              <Label>Price is per</Label>
              <Select
                value={form.cycle}
                onValueChange={(v) => set("cycle", v as "monthly" | "annual")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Month</SelectItem>
                  <SelectItem value="annual">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Bills every</Label>
              <Select
                value={form.billingCycle}
                onValueChange={(v) =>
                  set("billingCycle", v as "monthly" | "annual")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Month</SelectItem>
                  <SelectItem value="annual">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sub-start">Start date</Label>
              <Input
                id="sub-start"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-next">Next billing date</Label>
              <Input
                id="sub-next"
                type="date"
                value={form.nextBillingDate}
                onChange={(e) => set("nextBillingDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sub-payment">Payment method</Label>
            <Input
              id="sub-payment"
              placeholder="e.g. Visa •• 4417"
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
            <Label htmlFor="sub-autorenew" className="cursor-pointer">
              Auto renewal
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
                Exchange rate <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="sub-rate"
                inputMode="decimal"
                placeholder={`1 ${form.currency} = ? ${baseCurrency}`}
                value={form.customRate}
                onChange={(e) => set("customRate", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use your default rate of{" "}
                {rates?.[form.currency] ?? "—"} {baseCurrency} per{" "}
                {form.currency}.
              </p>
            </div>
          )}

          {preview && (
            <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
              ≈ <span className="font-semibold">{preview.monthly.toFixed(2)}</span>{" "}
              {baseCurrency}/month ·{" "}
              <span className="font-semibold">{preview.annual.toFixed(2)}</span>{" "}
              {baseCurrency}/year
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="sub-notes">Notes</Label>
            <Textarea
              id="sub-notes"
              placeholder="Anything worth remembering about this one."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
            />
          </div>

          <Separator />

          {/* --- Should I keep this? --- */}
          <div>
            <p className="text-sm font-semibold">Should I keep this?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Optional — helps spot the ones that have quietly outstayed their
              welcome.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>How often used</Label>
              <Select
                value={form.reviewUsageFrequency || undefined}
                onValueChange={(v) => set("reviewUsageFrequency", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  {["Daily", "Weekly", "Monthly", "Rarely", "Never"].map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Personal value</Label>
              <Select
                value={form.reviewPersonalValue || undefined}
                onValueChange={(v) => set("reviewPersonalValue", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  {["High", "Medium", "Low"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sub-lastused">Last used date</Label>
            <Input
              id="sub-lastused"
              type="date"
              value={form.reviewLastUsedDate}
              onChange={(e) => set("reviewLastUsedDate", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sub-alt">Alternative available</Label>
            <Input
              id="sub-alt"
              placeholder="e.g. Google One covers this"
              value={form.reviewAlternative}
              onChange={(e) => set("reviewAlternative", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sub-cancel-notes">Cancellation notes</Label>
            <Textarea
              id="sub-cancel-notes"
              placeholder="What would make you cancel, or what you'd need to check first."
              value={form.reviewCancellationNotes}
              onChange={(e) => set("reviewCancellationNotes", e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {initial ? "Save changes" : "Add subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
