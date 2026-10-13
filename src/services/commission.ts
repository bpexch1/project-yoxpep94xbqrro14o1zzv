import { serviceRequest } from "./client";
export interface CommissionRule {
  id: string;
  client_id: string;
  rate: number;
  basis: "positive_bet_profit";
  actor_id: string;
  reason: string;
  created_at: string;
}
export const commissionHistory = (clientId?: string) =>
  serviceRequest<CommissionRule[]>("commissionHistory", { clientId });
export const setCommissionRule = (input: {
  requestId: string;
  clientId: string;
  rate: number;
  reason: string;
}) => serviceRequest<CommissionRule>("setCommission", input);
