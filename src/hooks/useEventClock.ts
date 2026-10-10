import { useEffect, useState } from "react";

/** Render a running clock only when an actual start timestamp is supplied.
 * Scheduled match time is never treated as elapsed match time.
 */
export function useEventClock(
  status?: string | null,
  scheduledAt?: string | null,
  actualStartedAt?: string | null
): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  function duration(ms: number): string {
    const seconds = Math.max(0, Math.floor(ms / 1000));
    return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
      .map(n => String(n).padStart(2, "0")).join(":");
  }

  const state = String(status || "").toLowerCase();
  if (["live", "inplay", "started"].includes(state)) {
    const actual = actualStartedAt ? Date.parse(actualStartedAt) : NaN;
    return Number.isFinite(actual) && actual <= now
      ? `Elapsed : ${duration(now - actual)}`
      : "Live · match clock unavailable";
  }
  if (state === "upcoming") {
    const planned = scheduledAt ? Date.parse(scheduledAt) : NaN;
    return Number.isFinite(planned) && planned > now
      ? `Starts in : ${duration(planned - now)}`
      : "Start time unavailable";
  }
  return "Match clock unavailable";
}
