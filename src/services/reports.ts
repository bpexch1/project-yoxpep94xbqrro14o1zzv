import { csvCell } from "./csv";
import { serviceRequest } from "./client";
export interface ReportFilter {
  kind: "bets" | "ledger";
  clientId?: string;
  matchId?: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
}
export interface ReportResult {
  rows: Record<string, unknown>[];
  truncated: boolean;
  from: string;
  to: string;
}
export const queryReport = (filters: ReportFilter) =>
  serviceRequest<ReportResult>("reports", filters);
export async function exportReport(filters: ReportFilter): Promise<Blob> {
  const data = await queryReport({ ...filters, limit: 10000 });
  if (data.truncated)
    throw new Error("Export exceeds 10,000 rows. Select a smaller date range.");
  const columns =
    filters.kind === "bets"
      ? [
          "id",
          "user_email",
          "match_id",
          "selection",
          "bet_type",
          "stake",
          "odds",
          "status",
          "reserved",
          "profit",
          "commission_amount",
          "created_at",
        ]
      : [
          "id",
          "client_username",
          "type",
          "amount",
          "description",
          "before_balance",
          "after_balance",
          "operator_username",
          "created_at",
        ];
  return new Blob(
    [
      "\uFEFF" +
        [
          columns.map(csvCell).join(","),
          ...data.rows.map((row) =>
            columns.map((key) => csvCell(row[key])).join(","),
          ),
        ].join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
}
