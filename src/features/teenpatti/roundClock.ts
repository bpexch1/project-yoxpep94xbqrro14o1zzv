// Leave a small margin for the request to reach the server before the round closes.
// The server remains authoritative and can still reject a late request.
export function bettingWindowOpen(closesAtMs: number, estimatedServerNowMs: number, marginMs = 1000): boolean {
  return Number.isFinite(closesAtMs) && Number.isFinite(estimatedServerNowMs) &&
    closesAtMs - estimatedServerNowMs > marginMs;
}
