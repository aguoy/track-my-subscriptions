import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Link } from "react-router";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            {t("notfound.title")}
          </h1>
          <p className="text-lg text-muted-foreground">{t("notfound.body")}</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("detail.backToAll")}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
