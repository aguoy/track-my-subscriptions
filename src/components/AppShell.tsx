import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { CURRENCIES } from "@/lib/subs";
import { LanguageToggle, useI18n } from "@/lib/i18n";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  CreditCard,
  LayoutDashboard,
  ListTodo,
  Settings,
  Signpost,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/subscriptions", key: "nav.subscriptions", icon: CreditCard },
  { to: "/year", key: "nav.year", icon: ListTodo },
  { to: "/manage", key: "nav.manage", icon: Settings },
];

function Brand({ to = "/dashboard" }: { to?: string }) {
  const { t } = useI18n();
  return (
    <NavLink to={to} className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Signpost className="size-4.5" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        {t("app.name")}
      </span>
    </NavLink>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const settings = useQuery(api.subscriptions.settings);
  const setBaseCurrency = useMutation(api.subscriptions.setBaseCurrency);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop top bar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 lg:gap-8">
            <Brand />
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map(({ to, key, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  <Icon className="size-4" />
                  {t(key)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle />
            <select
              aria-label={t("nav.homeCurrency")}
              value={settings?.baseCurrency ?? "NZD"}
              onChange={(e) =>
                setBaseCurrency({ currency: e.target.value as never }).then(() =>
                  toast.success(t("toast.currencySet", e.target.value)),
                )
              }
              className="h-8 rounded-md border border-input bg-card px-2 text-xs font-medium text-foreground outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden lg:inline-flex"
            >
              {t("nav.signOut")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 md:pb-12">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {NAV.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <Icon className="size-5" />
              {t(key)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export { Brand };
export default AppShell;
