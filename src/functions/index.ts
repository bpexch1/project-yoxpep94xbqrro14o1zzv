import { superdevClient } from "@/lib/superdev/client";

export const handleTransaction = superdevClient.functions.handleTransaction;
export const settleBets = superdevClient.functions.settleBets;
export const getLiveOdds = superdevClient.functions.getLiveOdds;
export const getCricketScore = superdevClient.functions.getCricketScore;
export const oddsEngine = superdevClient.functions.oddsEngine;

// Use local fetch implementations when available
try {
  // Dynamic import to avoid build-time errors if files don't exist yet
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const atd = require('./fetch-atd-cricket-home').default;
  const betfair = require('./fetch-betfair-events').default;
  export const fetchAtdCricketHome = atd;
  export const fetchBetfairEvents = betfair;
} catch (err) {
  // Fallback to superdevClient functions if local modules aren't present
  // This keeps existing behavior while enabling local overrides
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  export const fetchAtdCricketHome = superdevClient.functions.fetchAtdCricketHome;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  export const fetchBetfairEvents = superdevClient.functions.fetchBetfairEvents;
}
