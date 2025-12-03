// src/app/components/LoadingPage.tsx

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSystemStatus, postSystemResync } from "@/shared/api/system";
import type { SystemStatusResponse } from "@/types/system";
import { setLastResyncTimeUtc } from "@/store/slices/systemSlice";
import type { RootState } from "@/store/store";
import { isLessThan3Hours } from "@/shared/utils/time";

export const LoadingPage = () => {
  const dispatch = useDispatch();

  const lastResyncTime = useSelector(
    (state: RootState) => state.system.last_resync_time_utc
  );

  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const hasTriggeredResync = useRef(false);

  // Derived: do we need a resync?
  const needsResync = !lastResyncTime || !isLessThan3Hours(lastResyncTime);

  const POLL_INTERVAL = 2000;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    // If no resync needed, bail out early — but *after* hook runs
    if (!needsResync) {
      return;
    }

    const poll = async () => {
      const body = await fetchSystemStatus();

      if (!body.is_successful || !body.data) {
        console.error("Failed to load system status:", body.error_msg);
        timer = setTimeout(poll, POLL_INTERVAL);
        return;
      }

      const system = body.data;
      setStatus(system);

      const { resync_running, last_discovered_at } = system;

      // 1. Trigger resync once
      if (!hasTriggeredResync.current && !last_discovered_at) {
        hasTriggeredResync.current = true;
        await postSystemResync();
        timer = setTimeout(poll, POLL_INTERVAL);
        return;
      }

      // 2. Keep polling until ready
      if (resync_running || !last_discovered_at) {
        timer = setTimeout(poll, POLL_INTERVAL);
        return;
      }

      // 3. Save timestamp to Redux
      dispatch(setLastResyncTimeUtc(last_discovered_at));

      // 4. Done, stop polling
    };

    poll();
    return () => clearTimeout(timer);
  }, [dispatch, needsResync]);

  // --- UI logic ---
  // If no resync needed, show no loader
  if (!needsResync) {
    return null; // parent component shows real app
  }

  return (
    <div className="flex items-center justify-center h-screen text-xl">
      <div>
        {status?.resync_running
          ? "Resyncing Kubernetes state…"
          : "Checking system status…"}
      </div>
    </div>
  );
};
