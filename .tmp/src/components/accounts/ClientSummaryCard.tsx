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
    }, 800);
  };

  const getTypeLabel = (role: string) => {
    if (role === "supermaster" || role === "admin" || role === "superadmin") return "SuperMaster";
    if (role === "client" || role === "bettor") return "Bettor";
    return role || "Bettor";
  };

  const formatValue = (val: number) => {
    return (
      <span className={cn("font-bold", val < 0 ? "text-red-500" : "text-[#26A69A]")}>
        {val.toLocaleString()}
      </span>
    );
  };

  return (
    <section className="bg-white rounded-none border border-[#E0E0E0] shadow-none overflow-hidden">
      {/* Card title */}
      <div className="px-4 py-3 border-b border-[#E0E0E0]">
        <span className="font-bold text-sm text-black">
          NomanSA8592 - Clients List {showRealBalances ? "" : "| Default"}
        </span>
      </div>

      <div className="p-3 space-y-4">
        {/* Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border border-gray-300">
                {!showRealBalances ? (
                  <>
                    <th className="px-2 py-2 border border-gray-300 font-bold text-black whitespace-nowrap">Credit Remaining</th>
                    <th className="px-2 py-2 border border-gray-300 font-bold text-black whitespace-nowrap">Cash</th>
                    <th className="px-2 py-2 border border-gray-300 font-bold text-black whitespace-nowrap">P/L Downline</th>
                    <th className="px-2 py-2 border border-gray-300 font-bold text-black whitespace-nowrap">Users</th>
                  </>
                ) : (
                  <>
                    <th className="px-2 py-2 border border-gray-300 font-bold text-black whitespace-nowrap">Credit Received</th>
                    <th className="px-2 py-2 border border-gray-300 font-bold text-black whitespace-nowrap">Credit Remaining</th>
                    <th className="px-2 py-2 border border-gray-300 font-bold text-black whitespace-nowrap">Cash</th>
                    <th className="px-2 py-2 border border-gray-300 font-bold text-black whitespace-nowrap">P/L Downline</th>
                    <th className="px-2 py-2 border border-gray-300 font-bold text-black whitespace-nowrap">Balance UpLine</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                {!showRealBalances ? (
                  <>
                    <td className="px-2 py-2 border border-gray-300">{formatValue(totals.credit_remaining)}</td>
                    <td className="px-2 py-2 border border-gray-300">{formatValue(totals.cash)}</td>
                    <td className="px-2 py-2 border border-gray-300">{formatValue(totals.pl_downline)}</td>
                    <td className="px-2 py-2 border border-gray-300 font-bold text-gray-700">{filteredClients.length}</td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-2 border border-gray-300">{formatValue(totals.credit_received)}</td>
                    <td className="px-2 py-2 border border-gray-300">{formatValue(totals.credit_remaining)}</td>
                    <td className="px-2 py-2 border border-gray-300">{formatValue(totals.cash)}</td>
                    <td className="px-2 py-2 border border-gray-300">{formatValue(totals.pl_downline)}</td>
                    <td className="px-2 py-2 border border-gray-300">{formatValue(totals.balance_upline)}</td>
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
            className="bg-[#43A047] hover:bg-[#388E3C] text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
          >
            New User
          </button>
          <button className="bg-[#43A047] hover:bg-[#388E3C] text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        {/* Legend */}
        <div className="text-xs text-gray-700 flex flex-wrap items-center gap-x-3 gap-y-1 py-1">
          <div className="flex items-center gap-1">
            <div className="w-7 h-7 bg-[#F59E0B] text-white font-bold text-xs flex items-center justify-center rounded-sm">C</div>
            <span>Cash / Credit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-7 h-7 bg-[#43A047] text-white flex items-center justify-center rounded-sm">
              <Pencil className="w-4 h-4" />
            </div>
            <span>Edit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-7 h-7 bg-[#90CAF9] text-white font-bold text-xs flex items-center justify-center rounded-sm">L</div>
            <span>Ledger</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-7 h-7 bg-[#43A047] text-white font-bold text-xs flex items-center justify-center rounded-sm">A</div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-7 h-7 bg-white border border-red-400 text-red-400 font-bold text-xs flex items-center justify-center rounded-sm">D</div>
            <span>InActive</span>
          </div>
        </div>

        {/* Search row */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-bold text-gray-700">Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-none px-3 py-1.5 text-sm w-52 focus:outline-none focus:border-[#26A69A]"
          />
        </div>
      </div>

      {/* Load Balance Section */}
      {!showRealBalances && (
        <div className="bg-[#43A047] px-4 py-3">
          <button
            onClick={handleLoadBalance}
            disabled={isLoadingBalance}
            className="bg-[#F59E0B] hover:bg-amber-500 text-gray-900 font-bold text-sm px-8 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-70 shadow-sm"
          >
            {isLoadingBalance && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoadingBalance ? "Loading..." : "Load Balance"}
          </button>
        </div>
      )}

      {/* Client Table (Only after load balance) */}
      {showRealBalances && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#26A69A] text-white font-bold text-xs">
                <td className="px-3 py-2 border-r border-[#26A69A]/30">Total</td>
                <td className="px-3 py-2 border-r border-[#26A69A]/30"></td>
                <td className="px-3 py-2 border-r border-[#26A69A]/30">0</td>
                <td className="px-3 py-2">{totals.balance_upline.toLocaleString()}</td>
              </tr>
              <tr className="bg-white border-b border-gray-200 text-gray-700">
                <th className="px-3 py-2 border-r border-gray-200 font-bold">Username</th>
                <th className="px-3 py-2 border-r border-gray-200 font-bold">Type</th>
                <th className="px-3 py-2 border-r border-gray-200 font-bold">Credit</th>
                <th className="px-3 py-2 font-bold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No data available in table</td>
                </tr>
              ) : (
                filteredClients.map((client, idx) => (
                  <React.Fragment key={client.id}>
                    {/* MAIN ROW */}
                    <tr className={cn(idx % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-[#26A69A] font-medium">{client.username}</td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-gray-800">{getTypeLabel(client.role)}</td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-gray-800">{(client.credit_remaining || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 border-b border-gray-200">
                        <span className={cn("font-medium", (client.balance_upline || 0) < 0 ? "text-red-500" : "text-[#26A69A]")}>
                          {(client.balance_upline || 0).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                    {/* ALWAYS EXPANDED DETAIL ROW */}
                    <tr>
                      <td colSpan={4} className={cn("px-4 py-3 border-b border-gray-200", idx % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                        <ul className="text-[13px] text-gray-800 space-y-1.5">
                          <li className="flex items-center gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Balance {(client.balance_upline || 0).toLocaleString()}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Client (P/L) {(client.pl_downline || 0).toLocaleString()}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Share {client.downline_share || 0}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Exposure 0</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Available Balance {(client.credit_remaining || 0).toLocaleString()}</span>
                          </li>
                          <li className="flex items-center gap-2 mt-3 pt-2">
                            <span className="text-gray-400">•</span>
                            <span className="mr-2 text-sm">Options</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setCashCreditClient(client)}
                                className="w-9 h-9 bg-[#F59E0B] text-white font-bold text-sm flex items-center justify-center rounded-sm shadow-sm active:scale-90"
                              >
                                C
                              </button>
                              <button
                                onClick={() => setEditingClient(client)}
                                className="w-9 h-9 bg-[#43A047] text-white flex items-center justify-center rounded-sm shadow-sm active:scale-90"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button className="w-9 h-9 bg-[#90CAF9] text-white font-bold text-sm flex items-center justify-center rounded-sm shadow-sm active:scale-90">
                                L
                              </button>
                              <button
                                className={cn(
                                  "w-9 h-9 rounded-sm font-bold text-sm flex items-center justify-center shadow-sm active:scale-90",
                                  client.status === "active" ? "bg-[#43A047] text-white" : "bg-white border border-red-400 text-red-400"
                                )}
                              >
                                {client.status === "active" ? "A" : "D"}
                              </button>
                            </div>
                          </li>
                        </ul>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
          <div className="px-3 py-3 text-[10px] text-gray-500 border-t border-gray-200 bg-gray-50">
            Showing {filteredClients.length === 0 ? "0 to 0 of 0" : `1 to ${filteredClients.length} of ${filteredClients.length}`} entries
          </div>
        </div>
      )}

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
