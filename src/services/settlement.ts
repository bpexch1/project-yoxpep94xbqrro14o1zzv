import { serviceRequest } from "./client";
export interface SettlementInput {
  requestId: string;
  marketId: string;
  winnerId?: string;
  void?: boolean;
  reason: string;
}
export const requestSettlement = (input: SettlementInput) =>
  serviceRequest<{
    success: boolean;
    marketId: string;
    totalBetsSettled: number;
  }>("settle", input);
export const lockMarket = (input: {
  requestId: string;
  marketId: string;
  locked: boolean;
}) =>
  serviceRequest<{ success: boolean; locked: boolean }>("lockMarket", input);
