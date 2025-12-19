// NotificationBell.tsx

import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import Popup from "reactjs-popup";
import { IoNotificationsOutline } from "react-icons/io5";
import {
  fetchActiveAlerts,
  resolveAlert,
  type AlertEvent,
} from "@/shared/api/state/alerts";
import type { PopupActions } from "reactjs-popup/dist/types";
import { formatDateTime, useTimezone } from "@/shared/time";
import { useI18n } from "@/app/providers/i18n/useI18n";

interface NotificationBellProps {
  className?: string;
}

const BASE_STYLES = {
  wrapper:
    "relative p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[var(--surface-dark)]/70 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-(--primary) transition-all",
  icon: "h-6 w-6",
  badge:
    "absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 whitespace-nowrap",
  panel:
    "w-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl z-[90] overflow-hidden",
};

const severityBadge = (severity: string) => {
  const normalized = severity.toLowerCase();
  if (normalized === "critical") return "bg-red-100 text-red-700";
  if (normalized === "warning") return "bg-amber-100 text-amber-700";
  return "bg-blue-100 text-blue-700";
};

export const NotificationBell = ({ className = "" }: NotificationBellProps) => {
  const { t } = useI18n();
  const popupRef = useRef<PopupActions | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const { timeZone } = useTimezone();

  const unreadCount = alerts.filter((a) => a.active).length;
  const displayCount =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchActiveAlerts();
      setAlerts(res.data?.active_alerts ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("alerts.notifications.loadError")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prime data once on mount to avoid empty state flicker
    void loadAlerts();
  }, []);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await resolveAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("alerts.notifications.resolveError")
      );
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Popup
      ref={popupRef}
      position="bottom right"
      arrow={false}
      closeOnDocumentClick
      offsetY={8}
      onOpen={() => void loadAlerts()}
      overlayStyle={{
        background: "transparent",
        zIndex: 80,
        position: "fixed",
        inset: 0,
        overflow: "hidden",
      }}
      contentStyle={{
        padding: 0,
        border: "none",
        background: "transparent",
        zIndex: 90,
        boxShadow: "none",
        width: "auto",
        maxWidth: "100%",
      }}
      trigger={
        <button
          aria-label={t("alerts.notifications.ariaLabel", {
            count: unreadCount,
          })}
          type="button"
          className={twMerge(BASE_STYLES.wrapper, className)}
        >
          <IoNotificationsOutline className={BASE_STYLES.icon} />
          {displayCount && (
            <span aria-live="polite" className={BASE_STYLES.badge}>
              {displayCount}
            </span>
          )}
        </button>
      }
    >
      <div className={BASE_STYLES.panel}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm font-semibold dark:border-gray-800">
          <span>{t("alerts.notifications.title")}</span>
          <button
            type="button"
            className="text-xs font-semibold text-(--primary) hover:underline"
            onClick={() => {
              setAlerts([]);
              popupRef.current?.close();
            }}
          >
            {t("common.actions.clear")}
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-3 space-y-2 text-sm">
          {loading && (
            <p className="text-gray-500">{t("alerts.notifications.loading")}</p>
          )}
          {error && (
            <p className="text-red-500">
              {error}{" "}
              <button
                type="button"
                className="underline"
                onClick={() => void loadAlerts()}
              >
                {t("common.retry")}
              </button>
            </p>
          )}
          {!loading && !error && alerts.length === 0 && (
            <p className="text-gray-500">{t("alerts.notifications.empty")}</p>
          )}
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={twMerge(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    severityBadge(alert.severity)
                  )}
                >
                  {alert.severity}
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-(--primary) hover:underline disabled:opacity-50"
                  disabled={resolvingId === alert.id}
                  onClick={() => void handleResolve(alert.id)}
                >
                  {resolvingId === alert.id
                    ? t("alerts.notifications.resolving")
                    : t("alerts.notifications.resolve")}
                </button>
              </div>
              <p className="mt-1 text-[13px] text-gray-800 dark:text-gray-100">
                {alert.message}
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                {t("alerts.notifications.createdAt", {
                  timestamp: formatDateTime(alert.created_at, { timeZone }),
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Popup>
  );
};
