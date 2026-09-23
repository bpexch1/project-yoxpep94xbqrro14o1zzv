import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Transaction, Client } from "@/entities";
import { Loader2, Calendar, FileText, Printer } from "lucide-react";
import { getClientSession } from "@/hooks/useClientAuth";

export default function LedgerPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const session = getClientSession();

  const [fromDate, setFromDate] = useState("09/23/2026 12:00 AM");
  const [toDate, setToDate] = useState("09/23/2026 11:59 PM");
  const [filterType, setFilterType] = useState<"all" | "parent" | "settlements">("all");
  const [pageSize, setPageSize] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: clients } = useQuery({
    queryKey: ["client", username],
    queryFn: () => Client.filter({ username }),
    enabled: !!username,
  });
  const client = clients?.[0];

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", username],
    queryFn: () => Transaction.filter({ client_username: username }, "created_at", 200),
    enabled: !!username,
    refetchInterval: 3000,
  });

  // Synthesize transactions list starting with Opening Balance
  const ledgerEntries = useMemo(() => {
    let runningBalance = 0;
    const entries: any[] = [];

    // 1. Initial Opening Balance entry
    entries.push({
      id: "opening",
      date: new Date(Date.now() - 3600 * 1000 * 24),
      dateStr: "9/23/2026 12:00:00 am",
      description: "Opening Balance",
      amount: 0,
      balance: 0,
    });

    // 2. Transactions in chronological order
    const sortedTx = [...transactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    sortedTx.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      runningBalance += amt;
      const d = new Date(tx.created_at);
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const seconds = d.getSeconds().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "pm" : "am";
      const h12 = hours % 12 || 12;
      const dateFormatted = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${h12}:${minutes}:${seconds} ${ampm}`;

      const desc = tx.description || (tx.type === "credit" ? `Credit Issued to ${username} (Credit)` : `Cash deposit in ${username} (Cash)`);

      entries.push({
        id: tx.id,
        date: d,
        dateStr: dateFormatted,
        description: desc,
        amount: amt,
        balance: tx.after_balance !== undefined ? tx.after_balance : runningBalance,
      });
    });

    return entries;
  }, [transactions, username]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return ledgerEntries;
    const q = searchQuery.toLowerCase();
    return ledgerEntries.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.dateStr.toLowerCase().includes(q) ||
        String(e.amount).includes(q) ||
        String(e.balance).includes(q)
    );
  }, [ledgerEntries, searchQuery]);

  const totalPages = Math.ceil(filteredEntries.length / pageSize) || 1;
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  return (
    <div style={{ minHeight: "100vh", background: "#ececed", fontFamily: '"Roboto Condensed", HelveticaNeue, Helvetica, Arial, sans-serif', paddingBottom: 40, fontSize: "1rem", color: "#212529" }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "8px 8px" }}>
        
        {/* 1. REPORT FILTER CARD */}
        <div style={{ background: "#ffffff", border: "1px solid #d5d8dc", borderRadius: 4, marginBottom: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ background: "#f8f9fa", borderBottom: "1px solid #e5e7eb", padding: "7px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>
              ≡ Report Filter
            </span>
          </div>

          <div style={{ padding: "12px 14px" }}>
            {/* From Date */}
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 3, marginBottom: 8, overflow: "hidden" }}>
              <input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ flex: 1, border: "none", padding: "6px 10px", fontSize: 13, color: "#1f2937", outline: "none" }}
              />
              <span style={{ padding: "6px 10px", background: "#f3f4f6", borderLeft: "1px solid #cbd5e1", color: "#6b7280" }}>
                <Calendar style={{ width: 14, height: 14 }} />
              </span>
            </div>

            <div style={{ textAlign: "center", fontWeight: 700, color: "#6b7280", margin: "2px 0 6px 0" }}>-</div>

            {/* To Date */}
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 3, marginBottom: 12, overflow: "hidden" }}>
              <input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ flex: 1, border: "none", padding: "6px 10px", fontSize: 13, color: "#1f2937", outline: "none" }}
              />
              <span style={{ padding: "6px 10px", background: "#f3f4f6", borderLeft: "1px solid #cbd5e1", color: "#6b7280" }}>
                <Calendar style={{ width: 14, height: 14 }} />
              </span>
            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                style={{
                  background: "#00a65a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 3,
                  padding: "7px 22px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* 2. LEDGER TITLE */}
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", marginBottom: 10, paddingLeft: 2 }}>
          {username ? `${username} - Account Ledger` : "Account Ledger"}
        </div>

        {/* 3. CONTROLS: Entries Dropdown & Print/Excel/PDF Buttons & Search */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 3,
                padding: "4px 6px",
                fontSize: 12.5,
                background: "#ffffff",
                color: "#1f2937",
                outline: "none"
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span style={{ fontSize: 12, color: "#374151" }}>entries per page</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 2 }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{ background: "#6c757d", color: "#ffffff", border: "none", padding: "4px 12px", fontSize: 12, fontWeight: 600, borderRadius: 3, cursor: "pointer" }}
            >
              Print
            </button>
            <button
              type="button"
              style={{ background: "#6c757d", color: "#ffffff", border: "none", padding: "4px 12px", fontSize: 12, fontWeight: 600, borderRadius: 3, cursor: "pointer" }}
            >
              Excel
            </button>
            <button
              type="button"
              style={{ background: "#6c757d", color: "#ffffff", border: "none", padding: "4px 12px", fontSize: 12, fontWeight: 600, borderRadius: 3, cursor: "pointer" }}
            >
              PDF
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <label style={{ fontSize: 12.5, color: "#374151" }}>Search:</label>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ border: "1px solid #cbd5e1", borderRadius: 3, padding: "3px 6px", fontSize: 12, outline: "none", width: 110, background: "#ffffff" }}
            />
          </div>
        </div>

        {/* 4. TABLE / ROWS */}
        <div style={{ background: "#ffffff", border: "1px solid #d5d8dc", borderRadius: 4, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          
          {/* Column Header */}
          <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr", background: "#f8f9fa", borderBottom: "1px solid #dee2e6", padding: "7px 8px", fontSize: 12, fontWeight: 700, color: "#374151" }}>
            <div># ⬍</div>
            <div>Date ⬍</div>
            <div>Description ⬍</div>
          </div>

          {isLoading ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
              <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite", margin: "0 auto 6px" }} />
              Loading ledger...
            </div>
          ) : paginatedEntries.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
              No transactions found
            </div>
          ) : (
            paginatedEntries.map((entry, idx) => {
              const rowNum = (currentPage - 1) * pageSize + idx + 1;
              const isNegative = entry.amount < 0;

              return (
                <div key={entry.id || idx} style={{ borderBottom: "1px solid #e5e7eb", padding: "10px 8px", fontSize: 12.5 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr", alignItems: "flex-start", gap: 6 }}>
                    
                    {/* # with red circular icon */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #e53935", display: "inline-block", position: "relative" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e53935", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
                      </span>
                      <span style={{ fontWeight: 700, color: "#111827", fontSize: 12 }}>{rowNum}</span>
                    </div>

                    {/* Date */}
                    <div style={{ color: "#374151", fontSize: 12, lineHeight: 1.3 }}>
                      {entry.dateStr}
                    </div>

                    {/* Description (Green Bold) */}
                    <div style={{ color: "#00a65a", fontWeight: 700, fontSize: 12.5, lineHeight: 1.3 }}>
                      {entry.description}
                    </div>
                  </div>

                  {/* Sub-row: Amount & Balance */}
                  <div style={{ marginTop: 8, paddingLeft: 42, display: "flex", flexDirection: "column", gap: 3, fontSize: 12.5, color: "#1f2937" }}>
                    <div>
                      <span style={{ color: "#4b5563" }}>Amount</span>{" "}
                      <span style={{ fontWeight: 700, color: isNegative ? "#e53935" : "#111827" }}>
                        {isNegative ? `-${Math.abs(entry.amount).toLocaleString()}` : entry.amount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#4b5563" }}>Balance</span>{" "}
                      <span style={{ fontWeight: 700 }}>
                        {entry.balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. FOOTER & PAGINATION */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: "#4b5563" }}>
          <div>
            Showing 1 to {filteredEntries.length} of {filteredEntries.length} entries
          </div>

          <div style={{ display: "flex", gap: 3 }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{ padding: "3px 8px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: 3, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: "3px 8px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: 3, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >
              ‹
            </button>
            <button
              style={{ padding: "3px 8px", border: "1px solid #00a65a", background: "#00a65a", color: "#fff", borderRadius: 3, fontWeight: 700 }}
            >
              {currentPage}
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{ padding: "3px 8px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: 3, cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              style={{ padding: "3px 8px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: 3, cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}
            >
              »
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
