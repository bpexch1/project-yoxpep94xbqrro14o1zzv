import * as signalR from "@microsoft/signalr";

export type MarketRealtimeState = "unconfigured" | "connecting" | "connected" | "reconnecting" | "disconnected";

let connection: signalR.HubConnection | null = null;
let status: MarketRealtimeState = "unconfigured";
const listeners = new Set<(next: MarketRealtimeState) => void>();
const eventListeners = new Set<(event: unknown) => void>();

function updateStatus(next: MarketRealtimeState) {
  status = next;
  for (const listener of listeners) listener(next);
}

export function realtimeStatus(): MarketRealtimeState { return status; }

export function observeRealtime(listener: (state: MarketRealtimeState) => void): () => void {
  listeners.add(listener);
  listener(status);
  return () => { listeners.delete(listener); };
}

export function onMarketUpdate(listener: (event: unknown) => void): () => void {
  eventListeners.add(listener);
  return () => { eventListeners.delete(listener); };
}

/** Expects a first-party, access-controlled SignalR hub.
 * Never connect directly to another site's hub or embed third-party credentials.
 * Consumer must still query authoritative, verified snapshots and reject stale prices.
 */
export async function connectMarketRealtime(accessTokenFactory?: () => string | Promise<string>) {
  const url = import.meta.env.VITE_REALTIME_HUB_URL?.trim();
  if (!url) { updateStatus("unconfigured"); return; }
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) return;
  updateStatus("connecting");
  connection = new signalR.HubConnectionBuilder()
    .withUrl(url, accessTokenFactory ? { accessTokenFactory } : {})
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
  connection.on("MarketUpdated", (event) => {
    for (const listener of eventListeners) listener(event);
  });
  connection.onreconnecting(() => updateStatus("reconnecting"));
  connection.onreconnected(() => updateStatus("connected"));
  connection.onclose(() => updateStatus("disconnected"));
  try {
    await connection.start();
    updateStatus("connected");
  } catch (err) {
    updateStatus("disconnected");
    throw err;
  }
}

export async function disconnectMarketRealtime() {
  const active = connection;
  connection = null;
  if (active) await active.stop();
  updateStatus("disconnected");
}
