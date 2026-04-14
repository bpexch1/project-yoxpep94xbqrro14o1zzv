import React, { useState, useMemo } from "react";
import { Pencil, UserPlus, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditClientModal } from "./EditClientModal";
import { CashCreditModal } from "./CashCreditModal";
import { SettlePLModal } from "./SettlePLModal";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [localSearch, setLocalSearch] = useState("");
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [cashCreditClient, setCashCreditClient] = useState<any | null>(null);
  const [settlePLClient, setSettlePLClient] = useState<any | null>(null);
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
      case 'company': return 'Company';
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
    <section className="bg-white border border-[#d5d8dc] shadow-none rounded-lg overflow-hidden">
      {/* Card title */}
      <div className="px-4 py-3 bg-white border-b border-[#d5d8dc]">
        <span className="font-bold text-sm text-[#2c3e50]">
          {username} - Clients List{!isBalanceLoaded ? " | Default" : ""}
        </span>
      </div>

      <div className="space-y-4">
        {/* Stats table */}
        <div className="px-4 pt-4 overflow-x-auto">
          {!isBalanceLoaded ? (
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-1 border border-gray-300 font-bold text-[#2c3e50] text-[11px] text-center leading-tight">Credit<br/>Remaining</th>
                  <th className="py-2 px-1 border border-gray-300 font-bold text-[#2c3e50] text-[11px] text-center">Cash</th>
                  <th className="py-2 px-1 border border-gray-300 font-bold text-[#2c3e50] text-[11px] text-center leading-tight">P/L<br/>Downline</th>
                  <th className="py-2 px-1 border border-gray-300 font-bold text-[#2c3e50] text-[11px] text-center">Users</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-1 border border-gray-300 text-center"><span className="text-sm font-bold text-[#1a9e71]">0</span></td>
                  <td className="py-2 px-1 border border-gray-300 text-center"><span className="text-sm font-bold text-[#1a9e71]">0</span></td>
                  <td className="py-2 px-1 border border-gray-300 text-center"><span className="text-sm font-bold text-[#1a9e71]">0</span></td>
                  <td className="py-2 px-1 border border-gray-300 text-center"><span className="text-sm font-bold text-[#1a9e71]">{filteredClients.length}</span></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-1 border border-gray-300 font-bold text-[#2c3e50] text-[11px] text-center leading-tight">Credit<br/>Received</th>
                  <th className="py-2 px-1 border border-gray-300 font-bold text-[#2c3e50] text-[11px] text-center leading-tight">Credit<br/>Remaining</th>
                  <th className="py-2 px-1 border border-gray-300 font-bold text-[#2c3e50] text-[11px] text-center">Cash</th>
                  <th className="py-2 px-1 border border-gray-300 font-bold text-[#2c3e50] text-[11px] text-center leading-tight">P/L<br/>Downline</th>
                  <th className="py-2 px-1 border border-gray-300 font-bold text-[#2c3e50] text-[11px] text-center leading-tight">Balance<br/>UpLine</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-1 border border-gray-300 text-center">
                    <span className="text-sm font-bold text-[#1a9e71]">{totals.credit_received.toLocaleString()}</span>
                  </td>
                  <td className="py-2 px-1 border border-gray-300 text-center">
                    <span className="text-sm font-bold text-[#1a9e71]">{totals.credit_remaining.toLocaleString()}</span>
                  </td>
                  <td className="py-2 px-1 border border-gray-300 text-center">
                    <span className={cn("text-sm font-bold", totals.cash < 0 ? "text-[#e74c3c]" : "text-[#1a9e71]")}>{totals.cash.toLocaleString()}</span>
                  </td>
                  <td className="py-2 px-1 border border-gray-300 text-center">
                    <span className={cn("text-sm font-bold", totals.pl_downline < 0 ? "text-[#e74c3c]" : "text-[#1a9e71]")}>
                      {totals.pl_downline.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-2 px-1 border border-gray-300 text-center">
                    <span className={cn("text-sm font-bold", totals.balance_upline < 0 ? "text-[#e74c3c]" : "text-[#1a9e71]")}>{totals.balance_upline.toLocaleString()}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Action buttons + Legend merged row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-4 py-3 gap-3">
          {/* Left: Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/accounts/create")}
              className="bg-[#1a9e71] hover:bg-[#158c61] text-white text-sm font-bold px-4 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" /> New User
            </button>
            <button className="bg-[#1a9e71] hover:bg-[#158c61] text-white text-sm font-bold px-4 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap">
              <BookOpen className="w-3.5 h-3.5" /> Account Ledger
            </button>
          </div>

          {/* Right: Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-[#2c3e50]">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#f1c40f] text-black font-bold text-[10px] flex items-center justify-center rounded-sm">C</div>
              <span className="font-medium">Cash / Credit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#5dade2] text-white flex items-center justify-center rounded-sm">
                < Pencil className="w-3 h-3" />
              </div>
              <span className="font-medium">Edit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#3498db] text-white font-bold text-[10px] flex items-center justify-center rounded-sm">L</div>
              <span className="font-medium">Ledger</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#1a9e71] text-white font-bold text-[10px] flex items-center justify-center rounded-sm">A</div>
              <span className="font-medium">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-white border border-[#e74c3c] text-[#e74c3c] font-bold text-[10px] flex items-center justify-center rounded-sm">D</div>
              <span className="font-medium">InActive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#e74c3c] text-white font-bold text-[10px] flex items-center justify-center rounded-sm">S</div>
              <span className="font-medium">Settle Account</span>
            </div>
          </div>
        </div>

        {/* Search Field */}
        <div className="flex flex-col items-center gap-1 py-3 border-t border-gray-100 px-4">
          <span className="text-sm text-[#2c3e50] font-semibold text-center">Search:</span>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="border border-[#d5d8dc] px-3 py-1.5 text-sm w-full max-w-[280px] focus:outline-none focus:border-[#1a9e71] text-[#2c3e50] bg-white mx-auto block"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {!isBalanceLoaded ? (
              <tr className="bg-[#1a9e71]">
                <td colSpan={3} className="px-4 py-3 text-left">
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
              <tr className="bg-[#1a9e71] text-white">
                <td className="px-4 py-3 font-bold text-sm">Total</td>
                <td className="px-4 py-3 text-sm"></td>
                <td className="px-4 py-3 font-bold text-sm text-right">{totals.credit_received.toLocaleString()}</td>
              </tr>
            )}
            {/* Column headers — always visible */}
            <tr className="bg-[#ecf0f1] border-b border-[#d5d8dc]">
              <th className="px-3 lg:px-4 py-3 font-bold text-[#2c3e50] text-[12px] border-r border-[#d5d8dc]">Username</th>
              <th className="px-3 lg:px-4 py-3 font-bold text-[#2c3e50] text-[12px] border-r border-[#d5d8dc]">Type</th>
              <th className="px-3 lg:px-4 py-3 font-bold text-[#2c3e50] text-[12px] text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-[#2c3e50] bg-white">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1a9e71]" />
                    <span className="font-medium">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-[#2c3e50] bg-white font-medium">
                  No data available
                </td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => {
                const roleLower = client.role?.toLowerCase();
                const isAdminType = roleLower === "admin" || roleLower === "supermaster" || roleLower === "superadmin" || roleLower === "company";
                const isExpanded = expandedIds.has(client.id);

                return (
                  <React.Fragment key={client.id}>
                    {/* Main row — always visible */}
                    <tr className={cn(idx % 2 === 0 ? "bg-white" : "bg-[#f4f6f7]", "border-b border-[#d5d8dc]")}>
                      <td className="px-3 lg:px-4 py-3 border-r border-[#d5d8dc]">
                        <button
                          onClick={() => isBalanceLoaded && toggleExpand(client.id)}
                          className={cn(
                            "font-bold text-left",
                            isAdminType ? "text-[#1a9e71]" : "text-[#2c3e50]",
                            isBalanceLoaded && "hover:underline cursor-pointer"
                          )}
                        >
                          {client.username}
                        </button>
                      </td>
                      <td className="px-3 lg:px-4 py-3 border-r border-[#d5d8dc] text-[#2c3e50] font-semibold">
                        {getTypeLabel(client.role)}
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-[#2c3e50] text-right font-semibold">
                        {/* Only show credit value after Load Balance is clicked */}
                        {isBalanceLoaded ? (client.credit_received || 0).toLocaleString() : "-"}
                      </td>
                    </tr>

                    {/* Expanded details row — only when balance is loaded AND row is expanded */}
                    {isBalanceLoaded && isExpanded && (
                      <tr>
                        <td colSpan={3} className={cn("px-5 py-4 border-b border-[#d5d8dc]", idx % 2 === 0 ? "bg-slate-50" : "bg-white")}>
                          <div className="relative">
                            <ul className="text-[13px] text-[#2c3e50] space-y-2 relative z-10">
                              <li className="flex items-center gap-2">
                                <span className="text-[#1a9e71] font-bold">•</span>
                                <span className="font-semibold text-[#2c3e50]">Balance:</span>
                                <span className="font-bold">{(client.balance_upline || 0).toLocaleString()}</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#1a9e71] font-bold">•</span>
                                <span className="font-semibold text-[#2c3e50]">Client (P/L):</span>
                                <span className={cn("font-bold", (client.pl_downline || 0) < 0 ? "text-[#e74c3c]" : "text-[#1a9e71]")}>
                                  {(client.pl_downline || 0).toLocaleString()}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#1a9e71] font-bold">•</span>
                                <span className="font-semibold text-[#2c3e50]">Share:</span>
                                <span className="font-bold">{client.downline_share || 0}</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#1a9e71] font-bold">•</span>
                                <span className="font-semibold text-[#2c3e50]">Exposure:</span>
                                <span className="font-bold">0</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#1a9e71] font-bold">•</span>
                                <span className="font-semibold text-[#2c3e50]">Available Balance:</span>
                                <span className="font-bold">{(client.credit_remaining || 0).toLocaleString()}</span>
                              </li>
                              
                              <li className="flex items-center gap-3 mt-4 pt-3 border-t border-[#d5d8dc]">
                                <span className="font-semibold text-[#2c3e50]">• Options</span>
                                <div className="flex items-center gap-2 flex-wrap">
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
                                        ? "bg-[#1a9e71] hover:bg-[#158c61] text-white" 
                                        : "bg-white border border-[#e74c3c] text-[#e74c3c] hover:bg-red-50"
                                    )}
                                    title={client.status === "active" ? "Active" : "Inactive"}
                                  >
                                    {client.status === "active" ? "A" : "D"}
                                  </button>
                                  {client.can_settle_pl && (
                                    <button 
                                      className="w-9 h-9 bg-[#e74c3c] hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                      title="Settle Account"
                                      onClick={() => setSettlePLClient(client)}
                                    >
                                      S
                                    </button>
                                  )}
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
        <div className="px-4 py-3 text-[11px] text-[#2c3e50] border-t border-[#d5d8dc] bg-[#ecf0f1] font-medium">
          Showing {filteredClients.length} entries
        </div>
      </div>

      <EditClientModal isOpen={!!editingClient} onClose={() => setEditingClient(null)} client={editingClient} />
      <CashCreditModal isOpen={!!cashCreditClient} onClose={() => setCashCreditClient(null)} client={cashCreditClient} />
      <SettlePLModal isOpen={!!settlePLClient} onClose={() => setSettlePLClient(null)} client={settlePLClient} />
    </section>
  );
}
