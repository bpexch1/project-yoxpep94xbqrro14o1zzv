import React, { useState, useMemo, useEffect } from "react";
import { Pencil, UserPlus, BookOpen, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditClientModal } from "./EditClientModal";
import { CashCreditModal } from "./CashCreditModal";
import { useNavigate } from "react-router-dom";

interface ClientSummaryCardProps {
  clients: any[];
  isLoading: boolean;
  username?: string;
  searchFilter?: string;
  onRefresh?: () => void;
}

export function ClientSummaryCard({ 
  clients, 
  isLoading, 
  username = "Admin", 
  searchFilter = "",
  onRefresh
}: ClientSummaryCardProps) {
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState("");
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [cashCreditClient, setCashCreditClient] = useState<any | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getTypeLabel = (role: string) => {
    switch(role?.toLowerCase()) {
      case 'superadmin': return 'SuperAdmin';
      case 'supermaster': return 'SuperMaster';
      case 'admin': return 'Admin';
      case 'agent': return 'Agent';
      case 'client': return 'Client';
      default: return 'Bettor';
    }
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const query = localSearch.toLowerCase() || searchFilter.toLowerCase();
    return clients.filter(
      (c) =>
        c.username?.toLowerCase().includes(query) ||
        c.full_name?.toLowerCase().includes(query)
    );
  }, [clients, localSearch, searchFilter]);

  const totals = useMemo(() =>
    filteredClients.reduce(
      (acc, c) => ({
        credit_remaining: acc.credit_remaining + (c.credit_remaining || 0),
        cash: acc.cash + (c.cash || 0),
        pl_downline: acc.pl_downline + (c.pl_downline || 0),
      }),
      { credit_remaining: 0, cash: 0, pl_downline: 0 }
    ),
    [filteredClients]
  );

  const formatNum = (val: number, isTotal = false) => (
    <span className={cn("font-bold", val < 0 ? "text-red-500" : "text-[#26A69A]", isTotal && val >= 0 ? "text-white" : "")}>
      {val.toLocaleString()}
    </span>
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="bg-white border border-[#E0E0E0] shadow-sm">
      {/* Card title */}
      <div className="px-4 py-2.5 bg-[#F5F5F5] border-b border-[#E0E0E0]">
        <span className="font-bold text-sm text-black">
          {username} - Clients List | Default
        </span>
      </div>

      <div className="p-3 space-y-4">
        {/* Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-white">
                <th className="px-2 py-2 border border-gray-300 font-bold text-black text-center">Credit<br/>Remaining</th>
                <th className="px-2 py-2 border border-gray-300 font-bold text-black text-center">Cash</th>
                <th className="px-2 py-2 border border-gray-300 font-bold text-black text-center">P/L<br/>Downline</th>
                <th className="px-2 py-2 border border-gray-300 font-bold text-black text-center">Users</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-2 border border-gray-300 text-center">{formatNum(totals.credit_remaining)}</td>
                <td className="px-2 py-2 border border-gray-300 text-center">{formatNum(totals.cash)}</td>
                <td className="px-2 py-2 border border-gray-300 text-center">{formatNum(totals.pl_downline)}</td>
                <td className="px-2 py-2 border border-gray-300 font-bold text-gray-800 text-center">{filteredClients.length}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/accounts/create")}
            className="bg-[#26A69A] hover:bg-[#00897B] text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" /> New User
          </button>
          <button className="bg-[#26A69A] hover:bg-[#00897B] text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm">
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-black border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-[#F59E0B] text-white font-bold text-xs flex items-center justify-center rounded-sm">C</div>
            <span>Cash / Credit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-[#26A69A] text-white flex items-center justify-center rounded-sm">
              <Pencil className="w-4 h-4" />
            </div>
            <span>Edit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-[#90CAF9] text-white font-bold text-xs flex items-center justify-center rounded-sm">L</div>
            <span>Ledger</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-[#26A69A] text-white font-bold text-xs flex items-center justify-center rounded-sm">A</div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-white border border-red-400 text-red-400 font-bold text-xs flex items-center justify-center rounded-sm">D</div>
            <span>InActive</span>
          </div>
        </div>

        {/* Local Search Field */}
        <div className="flex flex-col items-center gap-1 py-2 border-t border-gray-100">
          <span className="text-sm text-black font-medium">Search:</span>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="border border-gray-300 px-3 py-1.5 text-sm w-52 focus:outline-none focus:border-[#26A69A] text-gray-900 bg-white"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Green Total header row */}
            <tr className="bg-[#26A69A]">
              <td className="px-3 py-2.5 font-bold text-white border-r border-[#229587]">Total</td>
              <td className="px-3 py-2.5 border-r border-[#229587]">
                <button 
                  onClick={onRefresh}
                  className="bg-[#F59E0B] hover:bg-amber-500 text-black font-bold text-xs px-4 py-2 rounded transition-colors"
                >
                  Load Balance
                </button>
              </td>
              <td className="px-3 py-2.5 font-bold text-white text-right">
                {totals.credit_remaining.toLocaleString()}
              </td>
            </tr>
            {/* Column headers */}
            <tr className="bg-white border-b border-gray-300">
              <th className="px-3 py-2.5 font-bold text-black border-r border-gray-200">Username</th>
              <th className="px-3 py-2.5 font-bold text-black border-r border-gray-200">Type</th>
              <th className="px-3 py-2.5 font-bold text-black text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-gray-500 bg-white">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#26A69A]" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-gray-500 bg-white">
                  No data available
                </td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => {
                const roleLower = client.role?.toLowerCase();
                const isAdminType = roleLower === "admin" || roleLower === "supermaster" || roleLower === "superadmin";
                const isExpanded = expandedId === client.id;

                return (
                  <React.Fragment key={client.id}>
                    {/* Main row */}
                    <tr className={cn(idx % 2 === 0 ? "bg-white" : "bg-gray-50", "border-b border-gray-200")}>
                      <td className="px-3 py-3 border-r border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleExpand(client.id)}
                            className={cn(
                              "font-medium hover:underline text-left",
                              isAdminType ? "text-[#26A69A]" : "font-bold text-black"
                            )}
                          >
                            {client.username}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 text-black">
                        {getTypeLabel(client.role)}
                      </td>
                      <td className="px-3 py-3 text-black text-right font-medium">
                        {(client.credit_remaining || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={3} className={cn("px-6 py-4 border-b border-gray-300", idx % 2 === 0 ? "bg-slate-50" : "bg-white")}>
                          <div className="relative">
                            <ul className="text-[13px] text-gray-800 space-y-2 relative z-10">
                              <li className="flex items-center gap-2">
                                <span className="text-[#26A69A] font-bold">•</span>
                                <span className="font-medium text-gray-600">Balance:</span>
                                <span className="font-bold">{(client.balance_upline || 0).toLocaleString()}</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#26A69A] font-bold">•</span>
                                <span className="font-medium text-gray-600">Client (P/L):</span>
                                <span className={cn("font-bold", (client.pl_downline || 0) < 0 ? "text-red-500" : "text-[#26A69A]")}>
                                  {(client.pl_downline || 0).toLocaleString()}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#26A69A] font-bold">•</span>
                                <span className="font-medium text-gray-600">Share:</span>
                                <span className="font-bold">{client.downline_share || 0}</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#26A69A] font-bold">•</span>
                                <span className="font-medium text-gray-600">Exposure:</span>
                                <span className="font-bold">0</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#26A69A] font-bold">•</span>
                                <span className="font-medium text-gray-600">Available Balance:</span>
                                <span className="font-bold">{(client.credit_remaining || 0).toLocaleString()}</span>
                              </li>
                              
                              <li className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-200">
                                <span className="font-medium text-gray-600">• Options</span>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setCashCreditClient(client)}
                                    className="w-9 h-9 bg-[#F59E0B] hover:bg-amber-500 text-white font-bold text-sm flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                    title="Cash / Credit"
                                  >
                                    C
                                  </button>
                                  <button 
                                    onClick={() => setEditingClient(client)}
                                    className="w-9 h-9 bg-[#26A69A] hover:bg-[#00897B] text-white flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="w-9 h-9 bg-[#90CAF9] hover:bg-blue-300 text-white font-bold text-sm flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                    title="Ledger"
                                  >
                                    L
                                  </button>
                                  <button 
                                    className={cn(
                                      "w-9 h-9 rounded-sm font-bold text-sm flex items-center justify-center transition-all shadow-sm",
                                      client.status === "active" 
                                        ? "bg-[#26A69A] hover:bg-[#00897B] text-white" 
                                        : "bg-white border border-red-400 text-red-400 hover:bg-red-50"
                                    )}
                                    title={client.status === "active" ? "Active" : "Inactive"}
                                  >
                                    {client.status === "active" ? "A" : "D"}
                                  </button>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
        <div className="px-3 py-2.5 text-[10px] text-gray-500 border-t border-gray-200 bg-[#F5F5F5] font-medium">
          Showing {filteredClients.length} entries
        </div>
      </div>

      <EditClientModal isOpen={!!editingClient} onClose={() => setEditingClient(null)} client={editingClient} />
      <CashCreditModal isOpen={!!cashCreditClient} onClose={() => setCashCreditClient(null)} client={cashCreditClient} />
    </section>
  );
}
