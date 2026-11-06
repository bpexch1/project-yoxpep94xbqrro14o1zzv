export interface FreshMarket {
  status: string;
  betting_locked?: boolean;
  delayed: boolean;
  observed_at: string;
}
export interface SizedQuote {
  size: number;
  consumed: number;
  observed_at: string;
}
export const isFreshMarket = (market: FreshMarket, now = Date.now()) => {
  const age = now - Date.parse(market.observed_at);
  return market.status === "OPEN" && !market.betting_locked &&
    !market.delayed && Number.isFinite(age) && age >= 0 && age < 15000;
};
export const availableQuoteSize = (quote: SizedQuote | undefined, now = Date.now()) => {
  if (!quote) return 0;
  const age = now - Date.parse(quote.observed_at);
  if (!Number.isFinite(age) || age < 0 || age >= 15000) return 0;
  return Math.max(0, Number(quote.size) - Number(quote.consumed)) || 0;
};
