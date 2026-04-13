import React, { useState, useMemo } from "react";
import { Pencil, UserPlus, BookOpen, Loader2 } from "lucide-react";
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isBalanceLoaded, setIsBalanceLoaded] = useState(false);

  const handleLoadBalance = () => {
    onRefresh && onRefresh();
    setIsBalanceLoaded(true);
    // Auto-expand all clients
    const allIds = new Set(clients.map((c: any) => c.id));
    setExpandedIds(allIds);
  };

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
        credit_received: acc.credit_received + (c.credit_received || 0),
        credit_remaining: acc.credit_remaining + (c.credit_remaining || 0),
        cash: acc.cash + (c.cash || 0),
        pl_downline: acc.pl_downline + (c.pl_downline || 0),
        balance_upline: acc.balance_upline + (c.balance_upline || 0),
      }),
      { credit_received: 0, credit_remaining: 0, cash: 0, pl_downline: 0, balance_upline: 0 }
    ),
    [filteredClients]
  );

  const formatNum = (val: number) => (
    <span className={cn("font-bold", val < 0 ? "text-[#e74c3c]" : "text-[#16a085]")}>
      {val.toLocaleString()}
    </span>
  );

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="bg-white border border-[#d5d8dc] shadow-sm">
      {/* Card title */}
      <div className="px-4 py-2.5 bg-[#ecf0f1] border-b border-[#d5d8dc]">
        <span className="font-bold text-sm text-[#2c3e50]">
          {username} - Clients List
        </span>
      </div>

      <div className="p-3 space-y-4">
        {/* Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-[#d5d8dc] min-w-[500px]">
            <thead>
              <tr className="bg-[#ecf0f1]">
                <th className="px-2 py-2 border border-[#d5d8dc] font-bold text-[#2c3e50] text-center">Credit<br/>Received</th>
                <th className="px-2 py-2 border border-[#d5d8dc] font-bold text-[#2c3e50] text-center">Credit<br/>Remaining</th>
                <th className="px-2 py-2 border border-[#d5d8dc] font-bold text-[#2c3e50] text-center">Cash</th>
                <th className="px-2 py-2 border border-[#d5d8dc] font-bold text-[#2c3e50] text-center">P/L<br/>Downline</th>
                <th className="px-2 py-2 border border-[#d5d8dc] font-bold text-[#2c3e50] text-center">Balance<br/>UpLine</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-2 border border-[#d5d8dc] text-center">{formatNum(totals.credit_received)}</td>
                <td className="px-2 py-2 border border-[#d5d8dc] text-center">{formatNum(totals.credit_remaining)}</td>
                <td className="px-2 py-2 border border-[#d5d8dc] text-center">{formatNum(totals.cash)}</td>
                <td className="px-2 py-2 border border-[#d5d8dc] text-center">{formatNum(totals.pl_downline)}</td>
                <td className="px-2 py-2 border border-[#d5d8dc] text-center">{formatNum(totals.balance_upline)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/accounts/create")}
            className="bg-[#16a085] hover:bg-[#138d75] text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" /> New User
          </button>
          <button className="bg-[#16a085] hover:bg-[#138d75] text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm">
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#2c3e50] border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-[#f1c40f] text-black font-bold text-xs flex items-center justify-center rounded-sm">C</div>
            <span>Cash / Credit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-[#5dade2] text-white flex items-center justify-center rounded-sm">
              <Pencil className="w-4 h-4" />
            </div>
            <span>Edit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-[#3498db] text-white font-bold text-xs flex items-center justify-center rounded-sm">L</div>
            <span>Ledger</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-[#16a085] text-white font-bold text-xs flex items-center justify-center rounded-sm">A</div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-white border border-[#e74c3c] text-[#e74c3c] font-bold text-xs flex items-center justify-center rounded-sm">D</div>
            <span>InActive</span>
          </div>
        </div>

        {/* Local Search Field */}
        <div className="flex flex-col items-center gap-1 py-2 border-t border-gray-100">
          <span className="text-sm text-[#2c3e50] font-medium">Search:</span>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="border border-[#d5d8dc] px-3 py-1.5 text-sm w-52 focus:outline-none focus:border-[#16a085] text-[#2c3e50] bg-white"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {!isBalanceLoaded ? (
              <tr className="bg-[#16a085]">
                <td colSpan={3} className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={handleLoadBalance}
                    className="bg-[#f1c40f] hover:bg-yellow-400 active:bg-yellow-500 text-black font-bold text-xs px-5 py-2 rounded transition-colors cursor-pointer select-none"
                  >
                    Load Balance
                  </button>
                </td>
              </tr>
            ) : (
              <tr className="bg-[#16a085]">
                <td className="px-3 py-2.5 font-bold text-white border-r border-white/20">Total</td>
                <td className="px-3 py-2.5 border-r border-white/20"></td>
                <td className="px-3 py-2.5 font-bold text-white text-right">
                  {totals.credit_remaining.toLocaleString()}
                </td>
              </tr>
            )}
            {/* Column headers — always visible */}
            <tr className="bg-[#ecf0f1] border-b border-[#d5d8dc]">
              <th className="px-3 py-2.5 font-bold text-[#2c3e50] border-r border-[#d5d8dc]">Username</th>
              <th className="px-3 py-2.5 font-bold text-[#2c3e50] border-r border-[#d5d8dc]">Type</th>
              <th className="px-3 py-2.5 font-bold text-[#2c3e50] text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-[#7f8c8d] bg-white">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#16a085]" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-[#7f8c8d] bg-white">
                  No data available
                </td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => {
                const roleLower = client.role?.toLowerCase();
                const isAdminType = roleLower === "admin" || roleLower === "supermaster" || roleLower === "superadmin";
                const isExpanded = expandedIds.has(client.id);

                return (
                  <React.Fragment key={client.id}>
                    {/* Main row */}
                    <tr className={cn(idx % 2 === 0 ? "bg-white" : "bg-[#f4f6f7]", "border-b border-[#d5d8dc]")}>
                      <td className="px-3 py-3 border-r border-[#d5d8dc]">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleExpand(client.id)}
                            className={cn(
                              "font-medium hover:underline text-left",
                              isAdminType ? "text-[#16a085]" : "font-bold text-[#2c3e50]"
                            )}
                          >
                            {client.username}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-r border-[#d5d8dc] text-[#2c3e50]">
                        {getTypeLabel(client.role)}
                      </td>
                      <td className="px-3 py-3 text-[#2c3e50] text-right font-medium">
                        {(client.credit_remaining || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={3} className={cn("px-6 py-4 border-b border-[#d5d8dc]", idx % 2 === 0 ? "bg-slate-50" : "bg-white")}>
                          <div className="relative">
                            <ul className="text-[13px] text-[#2c3e50] space-y-2 relative z-10">
                              <li className="flex items-center gap-2">
                                <span className="text-[#16a085] font-bold">•</span>
                                <span className="font-medium text-[#7f8c8d]">Balance:</span>
                                <span className="font-bold">{(client.balance_upline || 0).toLocaleString()}</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#16a085] font-bold">•</span>
                                <span className="font-medium text-[#7f8c8d]">Client (P/L):</span>
                                <span className={cn("font-bold", (client.pl_downline || 0) < 0 ? "text-[#e74c3c]" : "text-[#16a085]")}>
                                  {(client.pl_downline || 0).toLocaleString()}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#16a085] font-bold">•</span>
                                <span className="font-medium text-[#7f8c8d]">Share:</span>
                                <span className="font-bold">{client.downline_share || 0}</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#16a085] font-bold">•</span>
                                <span className="font-medium text-[#7f8c8d]">Exposure:</span>
                                <span className="font-bold">0</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#16a085] font-bold">•</span>
                                <span className="font-medium text-[#7f8c8d]">Available Balance:</span>
                                <span className="font-bold">{(client.credit_remaining || 0).toLocaleString()}</span>
                              </li>
                              
                              <li className="flex items-center gap-3 mt-4 pt-3 border-t border-[#d5d8dc]">
                                <span className="font-medium text-[#7f8c8d]">• Options</span>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setCashCreditClient(client)}
                                    className="w-9 h-9 bg-[#f1c40f] hover:bg-yellow-400 text-black font-bold text-sm flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                    title="Cash / Credit"
                                  >
                                    C
                                  </button>
                                  <button 
                                    onClick={() => setEditingClient(client)}
                                    className="w-9 h-9 bg-[#5dade2] hover:bg-[#3498db] text-white flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="w-9 h-9 bg-[#3498db] hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                    title="Ledger"
                                  >
                                    L
                                  </button>
                                  <button 
                                    className={cn(
                                      "w-9 h-9 rounded-sm font-bold text-sm flex items-center justify-center transition-all shadow-sm",
                                      client.status === "active" 
                                        ? "bg-[#16a085] hover:bg-[#138d75] text-white" 
                                        : "bg-white border border-[#e74c3c] text-[#e74c3c] hover:bg-red-50"
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
        <div className="px-3 py-2.5 text-[10px] text-[#7f8c8d] border-t border-[#d5d8dc] bg-[#ecf0f1] font-medium">
          Showing {filteredClients.length} entries
        </div>
      </div>

      <EditClientModal isOpen={!!editingClient} onClose={() => setEditingClient(null)} client={editingClient} />
      <CashCreditModal isOpen={!!cashCreditClient} onClose={() => setCashCreditClient(null)} client={cashCreditClient} />
    </section>
  );
}
