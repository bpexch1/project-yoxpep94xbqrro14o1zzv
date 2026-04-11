import { superdevClient } from "@/lib/superdev/client";

export const User = superdevClient.auth;
export const Client = superdevClient.entity("Client");
export const Transaction = superdevClient.entity("Transaction");
export const Match = superdevClient.entity("Match");
export const Bet = superdevClient.entity("Bet");
