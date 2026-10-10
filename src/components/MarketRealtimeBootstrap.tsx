import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { connectMarketRealtime, disconnectMarketRealtime, onMarketUpdate } from "@/services/realtime";

/** Hub pushes only invalidation notices; verified provider snapshots remain authoritative. */
export function MarketRealtimeBootstrap() {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!import.meta.env.VITE_REALTIME_HUB_URL) return;
    let active = true;
    const offUpdates = onMarketUpdate(() => {
      queryClient.invalidateQueries({
        predicate: (query) => [
          "matches", "related-matches", "live-odds", "cricket-score",
          "mongo-odds", "betfair-sync"
        ].includes(String(query.queryKey[0]))
      });
    });
    const start = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || !active) return;
        await connectMarketRealtime(async () => {
          const { data } = await supabase.auth.getSession();
          return data.session?.access_token || "";
        });
      } catch {
        // Polling and a disconnected-status badge remain available.
      }
    };
    void start();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void start();
    });
    return () => {
      active = false;
      offUpdates();
      listener.subscription.unsubscribe();
      void disconnectMarketRealtime();
    };
  }, [queryClient]);
  return null;
}
