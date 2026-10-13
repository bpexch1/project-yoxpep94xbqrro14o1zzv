import { serviceRequest } from "./client";
import { queryReport, ReportFilter } from "./reports";
export interface Account {
  id: string;
  username: string;
  cash: number;
  availableBalance: number;
  exposure: number;
  credit_received: number;
  credit_remaining: number;
  [key: string]: unknown;
}
export const readAccount = (clientId?: string) =>
  serviceRequest<Account>("account", { clientId });
export const readLedger = (filters: Omit<ReportFilter, "kind"> = {}) =>
  queryReport({ ...filters, kind: "ledger" });
