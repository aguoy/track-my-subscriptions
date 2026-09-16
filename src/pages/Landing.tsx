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
import logo from "@/assets/logo.svg";

const FEATURES = [
  {
    icon: Wallet,
    title: "One honest monthly number",
    body: "Every subscription converts to a monthly and yearly figure in your home currency, so the real total is never a mystery.",
  },
  {
    icon: BellRing,
    title: "Renewals, before they happen",
    body: "See exactly what renews in the next 7 and 30 days. No more surprise charges quietly leaving your account.",
  },
  {
    icon: Scale,
    title: "Should I keep this?",
    body: "Record how often you actually use each service. Expensive-but-rarely-used and 60-day-idle subscriptions get flagged for a closer look.",
  },
  {
    icon: LineChart,
    title: "Yearly comparison",
    body: "Watch your recurring spend trend over the years and see whether it's creeping up — or finally heading down.",
  },
  {
    icon: Search,
    title: "Everything in one catalog",
    body: "Search, filter by category, and open any subscription to see its full history, notes, and review details.",
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-4.5" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Track My Subscriptions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get started
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
            For anyone tired of mystery renewals
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Know exactly what your subscriptions cost you
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
            Track every recurring service in one place — monthly totals, yearly
            totals, upcoming renewals, and a quiet nudge when something stops
            earning its keep.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              Start tracking free
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-accent sm:w-auto"
            >
              See how it works
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free · No card required · Works great on your phone
          </p>
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
                  Monthly
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">$286.84</p>
              </div>
              <div className="rounded-xl bg-accent p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Yearly
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">$3,442.08</p>
              </div>
              <div className="rounded-xl bg-accent p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Due in 7 days
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
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3.5 py-2.5 text-sm"
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.cat}</span>
                  <span className="tabular-nums text-muted-foreground">{r.amt}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-muted/40 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need, nothing you don't
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
            Built around a simple idea: a small, honest picture of your recurring
            spending, and the tools to keep it that way.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <div className="card-quiet h-full rounded-xl border border-border/70 bg-card p-5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4.5" />
                  </span>
                  <h3 className="mt-3.5 text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {body}
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
            Ready to see the whole picture?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            Set up takes a couple of minutes, and sample data is ready the
            moment you sign in.
          </p>
          <Link
            to="/auth"
            className="mt-7 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create your account
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="size-4" />
            <span>Track My Subscriptions</span>
          </div>
          <span>A simple, private record of what you pay for.</span>
        </div>
      </footer>
    </div>
  );
}
