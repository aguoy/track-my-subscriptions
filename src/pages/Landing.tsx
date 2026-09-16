import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  LineChart,
  Scale,
  Search,
  Wallet,
} from "lucide-react";
import { Link } from "react-router";
import { LanguageToggle, useI18n } from "@/lib/i18n";

const FEATURES = [
  { icon: Wallet, titleKey: "landing.f1.title", bodyKey: "landing.f1.body" },
  { icon: BellRing, titleKey: "landing.f2.title", bodyKey: "landing.f2.body" },
  { icon: Scale, titleKey: "landing.f3.title", bodyKey: "landing.f3.body" },
  { icon: LineChart, titleKey: "landing.f4.title", bodyKey: "landing.f4.body" },
  { icon: Search, titleKey: "landing.f5.title", bodyKey: "landing.f5.body" },
];

export default function Landing() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-4.5" />
            </span>
            <span className="truncate text-[15px] font-semibold tracking-tight">
              {t("app.name")}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle />
            <Link
              to="/auth"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("auth.getStarted")}
            </Link>
            <Link
              to="/auth"
              className="hidden rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-block"
            >
              {t("landing.ctaStart")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            {t("landing.badge")}
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
            {t("landing.heroBody")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              {t("landing.ctaStart")}
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-accent sm:w-auto"
            >
              {t("landing.ctaHow")}
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("landing.noCard")}</p>
        </motion.div>

        {/* Preview card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-14 max-w-3xl"
        >
          <div className="card-quiet rounded-2xl border border-border/70 bg-card p-5 sm:p-7">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-accent p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t("landing.monthly")}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">$286.84</p>
              </div>
              <div className="rounded-xl bg-accent p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t("landing.yearly")}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">$3,442.08</p>
              </div>
              <div className="rounded-xl bg-accent p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t("landing.due7")}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">3</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {[
                { name: "One NZ Mobile", cat: "Mobile phone", amt: "$58.90/mo" },
                { name: "Netflix", cat: "Streaming", amt: "$24.99/mo" },
                { name: "Dropbox Plus", cat: "Cloud storage", amt: "$11.99/mo" },
              ].map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3.5 py-2.5 text-sm"
                >
                  <span className="truncate font-medium">{r.name}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {t(`cat.${r.cat}`)}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{r.amt}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-border/60 bg-muted/40 py-16 sm:py-20"
      >
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("landing.featuresTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
            {t("landing.featuresBody")}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, titleKey, bodyKey }, i) => (
              <motion.div
                key={titleKey}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <div className="card-quiet h-full rounded-xl border border-border/70 bg-card p-5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4.5" />
                  </span>
                  <h3 className="mt-3.5 text-sm font-semibold">{t(titleKey)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(bodyKey)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            {t("landing.ctaBody")}
          </p>
          <Link
            to="/auth"
            className="mt-7 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("landing.ctaButton")}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Wallet className="size-3.5" />
            <span>{t("app.name")}</span>
          </div>
          <span className="text-center sm:text-right">{t("landing.footerTag")}</span>
        </div>
      </footer>
    </div>
  );
}
