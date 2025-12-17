import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";
import { LoadingAlert } from "../components/LoadingAlert";
import { fetchSystemStatus, postSystemResync } from "@/shared/api/system";
import type { SystemStatusResponse } from "@/types/system";
import { setLastResyncTimeUtc } from "@/store/slices/systemSlice";
import type { RootState } from "@/store/store";
import { isLessThan3Hours } from "@/shared/utils/time";

type PopupState = {
  title: string;
  message: string;
  detail?: string;
  tone: "info" | "error";
};

export const LoadingPage = () => {
  const dispatch = useDispatch();
  const lastResyncTime = useSelector(
    (state: RootState) => state.system.last_resync_time_utc
  );
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const hasTriggeredResync = useRef(false);

  const needsResync = !lastResyncTime || !isLessThan3Hours(lastResyncTime);
  const POLL_INTERVAL = 5000;

  const ALERT_TITLE = "Alert";
  const ALERT_MESSAGE = "Unable to reach backend service.";

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (!needsResync) {
      return;
    }

    const poll = async () => {
      try {
        const body = await fetchSystemStatus();

        if (!body.is_successful || !body.data) {
          setPopup({
            title: ALERT_TITLE,
            message: ALERT_MESSAGE,
            detail: body.error_msg ?? "Backend unreachable. Retrying shortly.",
            tone: "error",
          });
          timer = setTimeout(poll, POLL_INTERVAL);
          return;
        }

        const system = body.data;
        setStatus(system);

        const { resync_running, last_discovered_at } = system;

        if (resync_running || !last_discovered_at) {
          setPopup({
            title: ALERT_TITLE,
            message: ALERT_MESSAGE,
            detail:
              "Resync in progress. This will close once discovery finishes.",
            tone: "info",
          });
        } else {
          setPopup(null);
        }

        if (!hasTriggeredResync.current) {
          hasTriggeredResync.current = true;
          await postSystemResync();
          timer = setTimeout(poll, POLL_INTERVAL);
          return;
        }

        if (resync_running || !last_discovered_at) {
          timer = setTimeout(poll, POLL_INTERVAL);
          return;
        }

        dispatch(setLastResyncTimeUtc(last_discovered_at));
      } catch (err) {
        setPopup({
          title: ALERT_TITLE,
          message: ALERT_MESSAGE,
          detail:
            err instanceof Error
              ? err.message
              : "Unexpected error while checking status. Retrying...",
          tone: "error",
        });
        timer = setTimeout(poll, POLL_INTERVAL);
      }
    };

    poll();
    return () => clearTimeout(timer);
  }, [dispatch, needsResync]);

  if (!needsResync) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-(--bg) px-6 text-(--text)">
      <div className="w-full max-w-md rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
              System preparation
            </p>
            <h1 className="mt-1 text-xl font-semibold">
              Initialize backend cache
            </h1>
          </div>

          <span
            className={`mt-1 h-3 w-3 rounded-full ${
              popup?.tone === "error" ? "bg-red-500" : "bg-(--primary)"
            }`}
            aria-hidden
          />
        </div>

        {/* Explanation */}
        <ExplainHint visible={showExplain}>
          This overlay warms the backend cache and checks system status. It
          auto-triggers a resync if needed and closes once discovery finishes.
        </ExplainHint>
        <p className="mt-4 text-sm text-(--text-subtle)">
          Before continuing, the backend will warm its cache to ensure fast and
          consistent responses. This operation may take a few moments.
        </p>

        {/* Status */}
        {status?.resync_running && (
          <div className="mt-5 flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-(--primary)" />
            <span className="text-sm font-medium">
              Cache initialization in progress…
            </span>
          </div>
        )}

        {/* Inline Alert */}
        {popup && (
          <div
            className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
              popup.tone === "error"
                ? "border-red-300 bg-red-50 text-red-800"
                : "border-slate-300 bg-slate-50 text-slate-700"
            }`}
          >
            <p className="font-medium">{popup.message}</p>
            {popup.detail && (
              <p className="mt-1 text-xs opacity-80">{popup.detail}</p>
            )}
          </div>
        )}

        {/* Actions */}
        {!status?.resync_running && (
          <div className="mt-6 flex justify-end gap-3">
            {/* <button
              type="button"
              onClick={() => setPopup(null)}
              className="rounded-full border border-(--primary) px-4 py-2 text-sm font-semibold uppercase tracking-wide text-(--primary) hover:bg-(--bg-subtle)"
            >
              Cancel
            </button> */}
            {/* 
            <button
              type="button"
              onClick={async () => {
                await postSystemResync();
              }}
              className="rounded-full bg-(--primary) px-4 py-2 text-sm font-semibold uppercase tracking-wide text-(--accent-contrast) hover:bg-(--primary-hover)"
            >
              Initialize
            </button> */}
          </div>
        )}
      </div>
    </div>
  );
};
