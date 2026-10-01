import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import changelog from "../../changelog.json";
import tauriConfig from "../../src-tauri/tauri.conf.json";
import { getReleaseNotes } from "@/lib/release-notes";

type Release = { releasedAt?: string; zh?: string; en?: string; ja?: string };

export function CurrentReleaseNotice() {
  const { t, i18n } = useTranslation();
  const release = (changelog as Record<string, Release>)[tauriConfig.version];
  if (!release?.releasedAt) return null;
  const summary = getReleaseNotes(JSON.stringify(release), i18n.language)
    .split("\n")[0].replace(/^\s*-\s*/, "");
  const releasedAt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(release.releasedAt));

  return <section aria-label={t("update.recent_changes")} data-testid="current-release-notice"
    className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
    <Sparkles aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-semibold text-primary">{t("update.recent_changes")} · v{tauriConfig.version}</p>
        <time dateTime={release.releasedAt} className="text-xs text-muted-foreground">{releasedAt} (UTC+8)</time>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{summary}</p>
    </div>
  </section>;
}
