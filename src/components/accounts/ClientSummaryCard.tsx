import React, { useState, useMemo } from "react";
import { Plus, BookOpen, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditClientModal } from "./EditClientModal";
import { CashCreditModal } from "./CashCreditModal";
import { useNavigate } from "react-router-dom";

interface ClientSummaryCardProps {
  clients: any[];
  isLoading: boolean;
}

export function ClientSummaryCard({ clients, isLoading }: ClientSummaryCardProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [cashCreditClient, setCashCreditClient] = useState<any | null>(null);
  const [showRealBalances, setShowRealBalances] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(
      (client) =>
        client.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const totals = useMemo(() => {
    return filteredClients.reduce(
      (acc, client) => ({
        credit_received: acc.credit_received + (client.credit_received || 0),
        credit_remaining: acc.credit_remaining + (client.credit_remaining || 0),
        cash: acc.cash + (client.cash || 0),
        pl_downline: acc.pl_downline + (client.pl_downline || 0),
        balance_upline: acc.balance_upline + (client.balance_upline || 0),
      }),
      { credit_received: 0, credit_remaining: 0, cash: 0, pl_downline: 0, balance_upline: 0 }
    );
  }, [filteredClients]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLoadBalance = () => {
    setIsLoadingBalance(true);
    setTimeout(() => {
      setIsLoadingBalance(false);
      setShowRealBalances(true);
      // Auto-expand all rows
      setExpandedRows(new Set(filteredClients.map(c => c.id)));
    }, 800);
  };

  const getUsernameClass = (role: string) => {
    if (role === "supermaster" || role === "admin" || role === "superadmin") {
      return "text-emerald-500 font-medium";
    }
    return "text-gray-900 font-bold";
  };

  const getTypeLabel = (role: string) => {
    if (role === "supermaster" || role === "admin" || role === "superadmin") return "SuperMaster";
    if (role === "client" || role === "bettor") return "Bettor";
    return role || "Bettor";
  };

  return (
    <section className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      {/* Card title */}
      <div className="px-4 py-3 border-b border-gray-200">
        <span className="font-bold text-sm text-gray-900 tracking-tight">NomanSA8592 - Clients List</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Table */}
        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="w-full text-left text-[11px] min-w-[360px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {!showRealBalances ? (
                  <>
                    <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Credit Remaining</th>
                    <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Cash</th>
                    <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">P/L Downline</th>
                    <th className="p-2 font-bold text-gray-800 whitespace-nowrap">Users</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Credit Received</th>
                    <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Credit Remaining</th>
                    <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Cash</th>
                    <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">P/L Downline</th>
                    <th className="p-2 font-bold text-gray-800 whitespace-nowrap">Balance Upline</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                {!showRealBalances ? (
                  <>
                    <td className="p-2 border-r border-gray-200 text-emerald-600 font-bold">{totals.credit_remaining.toLocaleString()}</td>
                    <td className="p-2 border-r border-gray-200 font-bold">{totals.cash.toLocaleString()}</td>
                    <td className="p-2 border-r border-gray-200 font-bold">{totals.pl_downline.toLocaleString()}</td>
                    <td className="p-2 font-bold text-gray-700">{filteredClients.length}</td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border-r border-gray-200 text-emerald-600 font-bold underline">{totals.credit_received.toLocaleString()}</td>
                    <td className="p-2 border-r border-gray-200 text-emerald-600 font-bold underline">{totals.credit_remaining.toLocaleString()}</td>
                    <td className={cn("p-2 border-r border-gray-200 font-bold", totals.cash < 0 ? "text-red-500" : "text-emerald-600")}>
                      {totals.cash.toLocaleString()}
                    </td>
                    <td className={cn("p-2 border-r border-gray-200 font-bold", totals.pl_downline < 0 ? "text-red-500" : "text-emerald-600")}>
                      {totals.pl_downline.toLocaleString()}
                    </td>
                    <td className={cn("p-2 font-bold", totals.balance_upline < 0 ? "text-red-500" : "text-emerald-600")}>
                      {totals.balance_upline.toLocaleString()}
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/accounts/create")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold px-4 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> New User
          </button>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold px-4 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm active:scale-95">
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        {/* Legend */}
        <div className="text-xs text-gray-700 flex flex-wrap items-center gap-x-3 gap-y-1 p-2">
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-amber-400 rounded text-white font-bold flex items-center justify-center">C</div>
            <span>Cash / Credit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-emerald-500 rounded text-white flex items-center justify-center">
              <Pencil className="w-3.5 h-3.5" />
            </div>
            <span>Edit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-sky-400 rounded text-white font-bold flex items-center justify-center">L</div>
            <span>Ledger</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-emerald-500 rounded text-white font-bold flex items-center justify-center">A</div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 border border-red-400 rounded text-red-400 font-bold flex items-center justify-center">D</div>
            <span>InActive</span>
          </div>
        </div>

        {/* Search row */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm font-bold text-gray-700">Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-72 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
            placeholder="Search username or name..."
          />
        </div>
      </div>

      {/* Load Balance Section */}
      {!showRealBalances && (
        <div className="bg-emerald-500 px-4 py-3 flex items-center">
          <button
            onClick={handleLoadBalance}
            disabled={isLoadingBalance}
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-sm px-6 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-70 shadow-sm active:scale-95"
          >
            {isLoadingBalance && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoadingBalance ? "Loading..." : "Load Balance"}
          </button>
        </div>
      )}

      {/* Client Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[340px]">
          <thead>
            {showRealBalances && (
              <tr className="bg-emerald-500 text-white font-bold text-xs">
                <td className="px-3 py-2 border-r border-emerald-400 font-bold">Total</td>
                <td className="px-3 py-2 border-r border-emerald-400"></td>
                <td className="px-3 py-2 border-r border-emerald-400">{totals.credit_remaining.toLocaleString()}</td>
                <td className="px-3 py-2">{totals.balance_upline.toLocaleString()}</td>
              </tr>
            )}
            {/* Column header row */}
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-700">
              <th className="px-3 py-2 border-r border-gray-200 font-bold">Username</th>
              <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Type</th>
              <th className="px-3 py-2 border-r border-gray-200 font-bold">Credit</th>
              <th className="px-3 py-2 font-bold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500 text-xs">Loading...</td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500 text-xs">No data available in table</td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const isExpanded = expandedRows.has(client.id);
                return (
                  <React.Fragment key={client.id}>
                    {/* MAIN ROW */}
                    <tr className={cn("bg-white active:bg-emerald-50 transition-colors", !isExpanded && "border-b border-gray-100")}>
                      <td className="px-3 py-2.5 border-r border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className={cn(getUsernameClass(client.role), "max-w-[110px] truncate")}>{client.username}</span>
                          {!showRealBalances && (
                            <button
                              onClick={() => toggleRow(client.id)}
                              className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors bg-white shadow-sm",
                                isExpanded ? "border-emerald-400 text-emerald-500 bg-emerald-50" : "border-gray-300 text-gray-400"
                              )}
                            >
                              i
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-r border-gray-100 text-gray-700 text-center">{getTypeLabel(client.role)}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100 text-gray-700">
                        {showRealBalances ? (client.credit_remaining || 0).toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        {showRealBalances ? (
                          <span className={cn("font-medium", (client.balance_upline || 0) < 0 ? "text-red-500" : "text-emerald-600")}>
                            {(client.balance_upline || 0).toLocaleString()}
                          </span>
                        ) : "-"}
                      </td>
                    </tr>

                    {/* EXPANDED DETAIL ROW */}
                    {isExpanded && (
                      <tr className="border-b border-gray-200">
                        <td colSpan={4} className="px-4 py-3 bg-white">
                          <ul className="text-sm text-gray-800 space-y-1 list-disc list-inside">
                            <li>Balance {(client.balance_upline || 0).toLocaleString()}</li>
                            <li>Client (P/L) {(client.pl_downline || 0).toLocaleString()}</li>
                            <li>Share {client.downline_share || 0}</li>
                            <li>Exposure 0</li>
                            <li>Available Balance {(client.credit_remaining || 0).toLocaleString()}</li>
                            <li className="flex items-center gap-2 list-none">
                              <span className="mr-1">•</span>
                              <span className="mr-2">Options</span>
                              <button
                                onClick={() => setCashCreditClient(client)}
                                className="w-9 h-9 bg-amber-400 rounded text-white font-bold text-base flex items-center justify-center active:scale-90 shadow-sm"
                              >
                                C
                              </button>
                              <button
                                onClick={() => setEditingClient(client)}
                                className="w-9 h-9 bg-emerald-500 rounded text-white flex items-center justify-center active:scale-90 shadow-sm"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button className="w-9 h-9 bg-sky-400 rounded text-white font-bold text-base flex items-center justify-center active:scale-90 shadow-sm">
                                L
                              </button>
                              <button
                                className={cn(
                                  "w-9 h-9 rounded font-bold text-base flex items-center justify-center active:scale-90 shadow-sm",
                                  client.status === "active" ? "bg-emerald-500 text-white" : "border-2 border-red-400 text-red-400 bg-white"
                                )}
                              >
                                {client.status === "active" ? "A" : "D"}
                              </button>
                            </li>
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        <div className="px-3 py-3 text-[10px] text-gray-500 border-t border-gray-100 bg-gray-50">
          Showing {filteredClients.length === 0 ? "0 to 0 of 0" : `1 to ${filteredClients.length} of ${filteredClients.length}`} entries
        </div>
      </div>

      <EditClientModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
      />

      <CashCreditModal
        isOpen={!!cashCreditClient}
        onClose={() => setCashCreditClient(null)}
        client={cashCreditClient}
      />
    </section>
  );
}
