import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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

  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const hasTriggeredResync = useRef(false);

  const needsResync = !lastResyncTime || !isLessThan3Hours(lastResyncTime);
  const POLL_INTERVAL = 5000;

  const ALERT_TITLE = "Alert";
  const ALERT_MESSAGE = "are you ready to change PopUp?";

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

        if (!hasTriggeredResync.current && !last_discovered_at) {
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
    <div className="flex h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]">
      <div className="w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              System sync
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text)]">
              Preparing dashboard
            </h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-[color:var(--bg-subtle)]">
            <span className="sr-only">Loading</span>
          </div>
        </div>

        <p className="mt-4 text-sm text-[var(--text-subtle)]">
          {status?.resync_running
            ? "We are resyncing Kubernetes state with the latest cluster view."
            : "Checking system readiness and recent discovery status."}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <span className="inline-flex h-3 w-3 animate-pulse rounded-full bg-[color:var(--primary)]" />
          <span className="text-sm font-medium text-[var(--text-muted)]">
            {status?.resync_running
              ? "Resync in progress..."
              : "Contacting control plane..."}
          </span>
        </div>
      </div>

      <LoadingAlert
        open={!!popup}
        title={popup?.title ?? ALERT_TITLE}
        message={popup?.message ?? ALERT_MESSAGE}
        detail={popup?.detail}
        onCancel={() => setPopup(null)}
        onOk={() => setPopup(null)}
        tone={popup?.tone}
      />
    </div>
  );
};
