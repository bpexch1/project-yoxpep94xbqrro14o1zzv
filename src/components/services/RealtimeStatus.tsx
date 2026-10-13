import { serviceRequest } from "@/services/client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { connectRealtime, ConnectionStatus } from "@/services/realtime";
export function RealtimeStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const cache = useQueryClient();
  const { data: health } = useQuery({
    queryKey: ["exchange-service-health"],
    queryFn: () => serviceRequest<{ feedConfigured: boolean }>("health"),
    staleTime: 60000,
    retry: false,
  });
  useEffect(
    () =>
      connectRealtime(() => {
        void cache.invalidateQueries({
          predicate: (q) =>
            [
              "live-odds",
              "mongo-odds",
              "engine-odds",
              "admin-market-odds",
            ].includes(String(q.queryKey[0])),
        });
      }, setStatus),
    [cache],
  );
  // Hide the feed availability banner when no licensed feed is configured.
  // Keep the realtime connection subscription active for future configuration.
  if (health?.feedConfigured === false) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      title="Realtime database connection. Odds freshness is checked separately."
      className={`text-[10px] whitespace-nowrap px-1 ${status === "connected" ? "text-emerald-700" : "text-amber-700"}`}
    >
      {status === "connected"
        ? "● Connected"
        : status === "disconnected"
          ? "● Disconnected"
          : status === "reconnecting"
            ? "● Reconnecting…"
            : "● Connecting…"}
    </span>
  );
}
