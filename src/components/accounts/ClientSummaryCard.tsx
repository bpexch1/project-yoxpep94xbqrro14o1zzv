import React, { useState, useMemo } from "react";
import { Plus, BookOpen, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditClientModal } from "./EditClientModal";
import { useNavigate } from "react-router-dom";

interface ClientSummaryCardProps {
  clients: any[];
  isLoading: boolean;
}

export function ClientSummaryCard({ clients, isLoading }: ClientSummaryCardProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingClient, setEditingClient] = useState<any | null>(null);
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

  const total_credit = showRealBalances ? totals.credit_remaining.toLocaleString() : "0";
  const total_balance = showRealBalances ? totals.balance_upline.toLocaleString() : "0";

  return (
    <section className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      {/* Card title */}
      <div className="px-4 py-3 border-b border-gray-200">
        <span className="font-bold text-sm text-gray-900">NomanSA8592 - Clients List</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Table */}
        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-white border-b border-gray-200">
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
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New User
          </button>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1 transition-colors">
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        {/* Legend */}
        <div className="text-xs text-gray-700 flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-amber-400 rounded text-white font-bold text-[10px] flex items-center justify-center">C</div>
            <span>Cash / Credit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-emerald-500 rounded text-white flex items-center justify-center">
              <Pencil className="w-3.5 h-3.5" />
            </div>
            <span>Edit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-sky-400 rounded text-white font-bold text-[10px] flex items-center justify-center">L</div>
            <span>Ledger</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-emerald-500 rounded text-white font-bold text-[10px] flex items-center justify-center">A</div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 border-2 border-red-400 rounded text-red-400 font-bold text-[10px] flex items-center justify-center">D</div>
            <span>InActive</span>
          </div>
        </div>

        {/* Search row - centered */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm text-gray-700">Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
          />
        </div>
      </div>

      {/* Load Balance Section - GREEN bar with AMBER button */}
      {!showRealBalances && (
        <div className="bg-emerald-500 px-4 py-3 flex items-center">
          <button
            onClick={handleLoadBalance}
            disabled={isLoadingBalance}
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-sm px-5 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-70"
          >
            {isLoadingBalance && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoadingBalance ? "Loading..." : "Load Balance"}
          </button>
        </div>
      )}

      {/* Client Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            {/* Green Total row */}
            <tr className="bg-emerald-500 text-white font-bold">
              <td className="px-3 py-2 border-r border-emerald-400">Total</td>
              <td className="px-3 py-2 border-r border-emerald-400"></td>
              <td className="px-3 py-2 border-r border-emerald-400">{total_credit}</td>
              <td className="px-3 py-2">{total_balance}</td>
            </tr>
            {/* Column header row */}
            <tr className="bg-white border-b border-gray-200">
              <th className="px-3 py-2 border-r border-gray-200 font-bold text-gray-800">Username</th>
              <th className="px-3 py-2 border-r border-gray-200 font-bold text-gray-800">Type</th>
              <th className="px-3 py-2 border-r border-gray-200 font-bold text-gray-800">Credit</th>
              <th className="px-3 py-2 font-bold text-gray-800">Balance</th>
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
              filteredClients.map((client, idx) => {
                const isExpanded = expandedRows.has(client.id);
                return (
                  <React.Fragment key={client.id}>
                    {/* MAIN ROW */}
                    <tr className={cn("border-b border-gray-100", idx % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                      <td className="px-3 py-2 border-r border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <span className={getUsernameClass(client.role)}>{client.username}</span>
                          <button
                            onClick={() => toggleRow(client.id)}
                            className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors bg-white",
                              isExpanded ? "border-emerald-400 text-emerald-500" : "border-gray-300 text-gray-400"
                            )}
                          >
                            i
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-gray-700 text-sm">{getTypeLabel(client.role)}</td>
                      <td className="px-3 py-2 border-r border-gray-100 text-gray-700 text-sm">
                        {showRealBalances ? (client.credit_remaining || 0).toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm">
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
                        <td colSpan={4} className="px-4 py-3 bg-gray-50">
                          <ul className="text-sm text-gray-800 space-y-1">
                            <li>• Balance {(client.balance_upline || 0).toLocaleString()}</li>
                            <li>• Client (P/L) {(client.pl_downline || 0).toLocaleString()}</li>
                            <li>• Share {client.downline_share || 0}</li>
                            <li>• Exposure 0</li>
                            <li>• Available Balance {(client.credit_remaining || 0).toLocaleString()}</li>
                            <li className="flex items-center gap-1 pt-2">
                              <span>• Options</span>
                              <button className="w-7 h-7 bg-amber-400 rounded text-white font-bold text-xs flex items-center justify-center">C</button>
                              <button
                                onClick={() => setEditingClient(client)}
                                className="w-7 h-7 bg-emerald-500 rounded text-white flex items-center justify-center"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button className="w-7 h-7 bg-sky-400 rounded text-white font-bold text-xs flex items-center justify-center">L</button>
                              <button
                                className={cn(
                                  "w-7 h-7 rounded font-bold text-xs flex items-center justify-center",
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

        <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
          Showing {filteredClients.length === 0 ? "0 to 0 of 0" : `1 to ${filteredClients.length} of ${filteredClients.length}`} entries
        </div>
      </div>

      <EditClientModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
      />
    </section>
  );
}
