
import { superdevClient } from "@/lib/superdev/client";

export const handleTransaction = superdevClient.functions.handleTransaction;
export const fetchBetfairEvents = superdevClient.functions.fetchBetfairEvents;
export const settleBets = superdevClient.functions.settleBets;
export const getLiveOdds = superdevClient.functions.getLiveOdds;
export const getCricketScore = superdevClient.functions.getCricketScore;
export const oddsEngine = superdevClient.functions.oddsEngine;
export const fetchAtdCricketHome = superdevClient.functions.fetchAtdCricketHome;
