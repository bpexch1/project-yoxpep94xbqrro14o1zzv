import { realClient } from "@/integrations/supabase";
export type ConnectionStatus =
  "connecting" | "connected" | "reconnecting" | "disconnected";
export function connectRealtime(
  onChange: () => void,
  onStatus: (status: ConnectionStatus) => void,
) {
  let channel: any;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let changeTimer: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;
  let stopped = false;
  let generation = 0;
  const schedule = () => {
    if (stopped || timer) return;
    onStatus(navigator.onLine ? "reconnecting" : "disconnected");
    timer = setTimeout(
      () => {
        timer = undefined;
        open();
      },
      Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)) +
        Math.random() * 250,
    );
  };
  const open = () => {
    if (stopped) return;
    if (!realClient || !navigator.onLine) {
      onStatus("disconnected");
      if (realClient) schedule();
      return;
    }
    const own = ++generation;
    if (channel) void realClient.removeChannel(channel);
    onStatus(attempts ? "reconnecting" : "connecting");
    channel = realClient
      .channel(`exchange-quotes-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exchange_quotes" },
        () => {
          if (!changeTimer)
            changeTimer = setTimeout(() => {
              changeTimer = undefined;
              if (!stopped) onChange();
            }, 500);
        },
      )
      .subscribe((status: string) => {
        if (stopped || own !== generation) return;
        if (status === "SUBSCRIBED") {
          attempts = 0;
          onStatus(navigator.onLine ? "connected" : "disconnected");
          onChange();
        } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status))
          schedule();
      });
  };
  const offline = () => {
    onStatus("disconnected");
  };
  const online = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    open();
  };
  window.addEventListener("online", online);
  window.addEventListener("offline", offline);
  open();
  return () => {
    stopped = true;
    generation++;
    if (timer) clearTimeout(timer);
    if (changeTimer) clearTimeout(changeTimer);
    window.removeEventListener("online", online);
    window.removeEventListener("offline", offline);
    if (channel) void realClient.removeChannel(channel);
  };
}
