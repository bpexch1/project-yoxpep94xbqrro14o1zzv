import { superdevClient } from "@/lib/superdev/client";
// You should ALWAYS export the User entity.
export const User = superdevClient.auth;
// Now adding the entities you created:
export const Client = superdevClient.entity("Client");
export const Transaction = superdevClient.entity("Transaction");
export const Match = superdevClient.entity("Match");
export const Bet = superdevClient.entity("Bet");
