import React, { useState, useMemo } from "react";
import { Plus, BookOpen, Pencil, Info, Loader2 } from "lucide-react";
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
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

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

  const handleLoadBalance = () => {
    setIsLoadingBalance(true);
    setTimeout(() => {
      setIsLoadingBalance(false);
      setShowRealBalances(true);
      // Auto-expand ALL clients
      const allIds = new Set<string>(filteredClients.map((c: any) => c.id));
      setExpandedClients(allIds);
    }, 800);
  };

  const toggleClient = (id: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getUsernameClass = (role: string) => {
    if (role === "supermaster" || role === "admin") return "font-bold text-emerald-600 cursor-pointer";
    return "font-bold text-gray-900"; // Bettor = bold black
  };

  const getTypeLabel = (role: string) => {
    if (role === "supermaster" || role === "admin") return "SuperMaster";
    if (role === "client" || role === "bettor") return "Bettor";
    return role || "Bettor";
  };

  const total_credit = totals.credit_remaining.toLocaleString();
  const total_balance = totals.balance_upline.toLocaleString();

  return (
    <section className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      {/* Card title */}
      <div className="px-4 py-3 border-b border-gray-200">
        <span className="font-bold text-sm text-gray-900">
          NomanSA8592 - Clients List
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Table */}
        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                {showRealBalances && (
                  <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Credit Received</th>
                )}
                <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Credit Remaining</th>
                <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Cash</th>
                <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">P/L Downline</th>
                {!showRealBalances && (
                  <th className="p-2 font-bold text-gray-800 whitespace-nowrap">Users</th>
                )}
                {showRealBalances && (
                  <th className="p-2 font-bold text-gray-800 whitespace-nowrap">Balance Upline</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                {showRealBalances && (
                  <td className="p-2 border-r border-gray-200 text-emerald-600 underline font-bold">{totals.credit_received.toLocaleString()}</td>
                )}
                <td className={cn(
                  "p-2 border-r border-gray-200 font-bold",
                  showRealBalances ? "text-emerald-600 underline" : (totals.credit_remaining < 0 ? "text-red-500" : "text-emerald-600")
                )}>
                  {totals.credit_remaining.toLocaleString()}
                </td>
                <td className={cn("p-2 border-r border-gray-200 font-bold", totals.cash < 0 ? "text-red-500" : "text-emerald-600")}>
                  {totals.cash.toLocaleString()}
                </td>
                <td className={cn("p-2 border-r border-gray-200 font-bold", totals.pl_downline < 0 ? "text-red-500" : "text-emerald-600")}>
                  {totals.pl_downline.toLocaleString()}
                </td>
                {!showRealBalances && (
                  <td className="p-2 font-bold text-gray-800">
                    {filteredClients.length}
                  </td>
                )}
                {showRealBalances && (
                  <td className={cn("p-2 font-bold", totals.balance_upline < 0 ? "text-red-500" : "text-emerald-600")}>
                    {totals.balance_upline.toLocaleString()}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Horizontal divider */}
        <div className="border-t border-gray-200" />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/accounts/create")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
          >
            New User
          </button>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-amber-400 rounded flex items-center justify-center text-white font-bold text-[11px]">C</div>
              <span className="text-xs text-gray-700">Cash / Credit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-white">
                <Pencil className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-gray-700">Edit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-sky-400 rounded flex items-center justify-center text-white font-bold text-[11px]">L</div>
              <span className="text-xs text-gray-700">Ledger</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-white font-bold text-[11px]">A</div>
              <span className="text-xs text-gray-700">Active</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-white border border-red-400 rounded flex items-center justify-center text-red-400 font-bold text-[11px]">D</div>
            <span className="text-xs text-gray-700">InActive</span>
          </div>
        </div>

        {/* Search row */}
        <div className="flex flex-col items-center gap-1 pt-2">
          <span className="text-sm text-gray-700">Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-teal-500 text-center"
          />
        </div>
      </div>

      {/* Load Balance Bar */}
      {!showRealBalances && (
        <div className="bg-emerald-500 px-4 py-3 flex items-center">
          <button
            onClick={handleLoadBalance}
            disabled={isLoadingBalance}
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-sm px-6 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-70"
          >
            {isLoadingBalance && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoadingBalance ? "Loading..." : "Load Balance"}
          </button>
        </div>
      )}

      {/* Client Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-emerald-500 text-white font-bold">
              <td className="px-3 py-2 border-r border-emerald-400">Total</td>
              <td className="px-3 py-2 border-r border-emerald-400"></td>
              <td className="px-3 py-2 border-r border-emerald-400">{total_credit}</td>
              <td className="px-3 py-2">{total_balance}</td>
            </tr>
            <tr className="bg-white border-b border-gray-200 font-bold text-gray-900">
              <th className="px-3 py-2 border-r border-gray-200">Username</th>
              <th className="px-3 py-2 border-r border-gray-200">Type</th>
              <th className="px-3 py-2 border-r border-gray-200">Credit</th>
              <th className="px-3 py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">Loading clients...</td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No data available in table</td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => (
                <React.Fragment key={client.id}>
                  <tr className={cn("border-b border-gray-100", idx % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                    <td className="px-3 py-2 border-r border-gray-100">
                      <div className={getUsernameClass(client.role)}>{client.username}</div>
                      {!showRealBalances && (
                        <button
                          onClick={() => toggleClient(client.id)}
                          className={cn(
                            "mt-1 w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                            expandedClients.has(client.id)
                              ? "bg-blue-100 border border-blue-300"
                              : "bg-gray-200 hover:bg-gray-300"
                          )}
                        >
                          <Info className="w-4 h-4 text-gray-700" />
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-100 text-gray-700">{getTypeLabel(client.role)}</td>
                    <td className="px-3 py-2 border-r border-gray-100 text-gray-700">
                      {showRealBalances ? (client.credit_remaining || 0).toLocaleString() : "-"}
                    </td>
                    <td className={cn("px-3 py-2 font-bold",
                      !showRealBalances ? "text-gray-700" :
                      (client.balance_upline || 0) < 0 ? "text-red-500" : "text-emerald-600"
                    )}>
                      {showRealBalances ? (client.balance_upline || 0).toLocaleString() : "-"}
                    </td>
                  </tr>
                  
                  {(showRealBalances || expandedClients.has(client.id)) && (
                    <tr className={cn("border-b border-gray-200", idx % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                      <td colSpan={4} className="px-4 py-3">
                        <ul className="space-y-1 text-xs text-gray-800">
                          <li>• Balance {showRealBalances 
                            ? (client.balance_upline || 0).toLocaleString() 
                            : `= ${(client.balance_upline || 0).toLocaleString()}`}
                          </li>
                          <li>• Client (P/L) {showRealBalances
                            ? (client.pl_downline || 0).toLocaleString()
                            : `= ${(client.pl_downline || 0).toLocaleString()}`}
                          </li>
                          <li>• Share {showRealBalances
                            ? (client.downline_share || 0)
                            : `= ${(client.downline_share || 0).toFixed(2)}`}
                          </li>
                          <li>• Exposure 0</li>
                          <li>• Available Balance {showRealBalances
                            ? (client.balance_upline || 0).toLocaleString()
                            : `= ${(client.balance_upline || 0).toLocaleString()}`}
                          </li>
                          <li className="flex items-center gap-2 flex-wrap pt-1">
                            {showRealBalances && <span>• Options</span>}
                            {!showRealBalances && <span>•</span>}
                            {/* C button */}
                            <button className="w-8 h-8 bg-amber-400 rounded text-white font-bold text-xs flex items-center justify-center">C</button>
                            {/* Edit/pencil button */}
                            <button 
                              onClick={() => setEditingClient(client)} 
                              className="w-8 h-8 bg-emerald-500 rounded text-white flex items-center justify-center"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {/* L button */}
                            <button className="w-8 h-8 bg-sky-400 rounded text-white font-bold text-xs flex items-center justify-center">L</button>
                            {/* A/D button */}
                            <button className={cn(
                              "w-8 h-8 rounded font-bold text-xs flex items-center justify-center",
                              client.status === "active" 
                                ? "bg-emerald-500 text-white"
                                : "bg-white border-2 border-red-400 text-red-400"
                            )}>
                              {client.status === "active" ? "A" : "D"}
                            </button>
                          </li>
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
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
