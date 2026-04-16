import React, { useState, useMemo } from "react";
import { Pencil, UserPlus, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/entities";

interface ClientSummaryCardProps {
  clients: any[];
  isLoading: boolean;
  username?: string;
  searchFilter?: string;
  onRefresh?: () => void;
  hideCreateButton?: boolean;
  hideHeader?: boolean;
  autoLoadBalance?: boolean;
}

export function ClientSummaryCard({ 
  clients, 
  isLoading, 
  username = "Admin", 
  searchFilter = "",
  onRefresh,
  hideCreateButton = false,
  hideHeader = false,
  autoLoadBalance = false
}: ClientSummaryCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [localSearch, setLocalSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isBalanceLoaded, setIsBalanceLoaded] = useState(autoLoadBalance);

  React.useEffect(() => {
    if (autoLoadBalance && clients && clients.length > 0 && expandedIds.size === 0) {
      const allIds = new Set(clients.map((c: any) => c.id));
      setExpandedIds(allIds);
    }
  }, [autoLoadBalance, clients]);

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
      case 'client': return 'Bettor';
      default: return 'Bettor';
    }
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const query = localSearch.toLowerCase() || searchFilter.toLowerCase();
    return clients.filter(
      (c) =>
        c.role?.toLowerCase() !== 'company' &&
        (c.username?.toLowerCase().includes(query) ||
        c.full_name?.toLowerCase().includes(query))
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

  const toggleStatus = async (client: any) => {
    try {
      const newStatus = client.status === "active" ? "inactive" : "active";
      await Client.update(client.id, { status: newStatus });
      toast({ title: "Status Updated", description: `${client.username} is now ${newStatus}` });
      onRefresh && onRefresh();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  return (
    <section className="bg-white border border-[#d0d0d0] shadow-sm rounded-[10px] overflow-hidden mb-4" style={{ fontFamily: "Roboto, system-ui, sans-serif", boxShadow: "0 1px 3px rgba(0,0,0,.07)" }}>
      {/* Card title */}
      {!hideHeader && (
        <div className="px-4 py-2.5 bg-white border-b border-[#d0d0d0]">
          <span className="font-bold text-[15px] text-[#212529]">
            {username} - Clients List{!isBalanceLoaded ? " | Default" : ""}
          </span>
        </div>
      )}

      <div className="space-y-2 pt-3">
        {/* Stats table */}
        <div className="px-4 overflow-x-auto">
          <table className="w-auto text-left border-collapse border border-[#ccc]">
            <thead>
              <tr className="bg-[#f8f9fa]">
                {!isBalanceLoaded ? (
                  <>
                    <th className="py-1.5 px-2 border border-[#ccc] font-bold text-[#212529] text-[11px] text-center leading-tight whitespace-nowrap">Credit<br/>Remaining</th>
                    <th className="py-1.5 px-2 border border-[#ccc] font-bold text-[#212529] text-[11px] text-center whitespace-nowrap">Cash</th>
                    <th className="py-1.5 px-2 border border-[#ccc] font-bold text-[#212529] text-[11px] text-center leading-tight whitespace-nowrap">P/L<br/>Downline</th>
                    <th className="py-1.5 px-2 border border-[#ccc] font-bold text-[#212529] text-[11px] text-center whitespace-nowrap">Users</th>
                  </>
                ) : (
                  <>
                    <th className="py-1.5 px-2 border border-[#ccc] font-bold text-[#212529] text-[11px] text-center leading-tight whitespace-nowrap">Credit<br/>Received</th>
                    <th className="py-1.5 px-2 border border-[#ccc] font-bold text-[#212529] text-[11px] text-center leading-tight whitespace-nowrap">Credit<br/>Remaining</th>
                    <th className="py-1.5 px-2 border border-[#ccc] font-bold text-[#212529] text-[11px] text-center whitespace-nowrap">Cash</th>
                    <th className="py-1.5 px-2 border border-[#ccc] font-bold text-[#212529] text-[11px] text-center leading-tight whitespace-nowrap">P/L<br/>Downline</th>
                    <th className="py-1.5 px-2 border border-[#ccc] font-bold text-[#212529] text-[11px] text-center leading-tight whitespace-nowrap">Balance<br/>UpLine</th>
                    <th className="py-1.5 px-2 border border-[#ccc] font-bold text-[#212529] text-[11px] text-center whitespace-nowrap">Users</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                {!isBalanceLoaded ? (
                  <>
                    <td className="py-1.5 px-2 border border-[#ccc] text-center whitespace-nowrap"><span className="text-[13px] font-bold text-[#256F39]">0</span></td>
                    <td className="py-1.5 px-2 border border-[#ccc] text-center whitespace-nowrap"><span className="text-[13px] font-bold text-[#256F39]">0</span></td>
                    <td className="py-1.5 px-2 border border-[#ccc] text-center whitespace-nowrap"><span className="text-[13px] font-bold text-[#256F39]">0</span></td>
                    <td className="py-1.5 px-2 border border-[#ccc] text-center whitespace-nowrap"><span className="text-[13px] font-bold text-[#256F39]">{filteredClients.length}</span></td>
                  </>
                ) : (
                  <>
                    <td className="py-1.5 px-2 border border-[#ccc] text-center whitespace-nowrap">
                      <span className="text-[13px] font-bold text-[#256F39]">{totals.credit_received.toLocaleString()}</span>
                    </td>
                    <td className="py-1.5 px-2 border border-[#ccc] text-center whitespace-nowrap">
                      <span className="text-[13px] font-bold text-[#256F39]">{totals.credit_remaining.toLocaleString()}</span>
                    </td>
                    <td className="py-1.5 px-2 border border-[#ccc] text-center whitespace-nowrap">
                      <span className={cn("text-[13px] font-bold", totals.cash < 0 ? "text-[#e74c3c]" : "text-[#256F39]")}>{totals.cash.toLocaleString()}</span>
                    </td>
                    <td className="py-1.5 px-2 border border-[#ccc] text-center whitespace-nowrap">
                      <span className={cn("text-[13px] font-bold", totals.pl_downline < 0 ? "text-[#e74c3c]" : "text-[#256F39]")}>
                        {totals.pl_downline.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 border border-[#ccc] text-center whitespace-nowrap">
                      <span className={cn("text-[13px] font-bold", totals.balance_upline < 0 ? "text-[#e74c3c]" : "text-[#256F39]")}>{totals.balance_upline.toLocaleString()}</span>
                    </td>
                    <td className="py-1.5 px-2 border border-[#ccc] text-center whitespace-nowrap">
                      <span className="text-[13px] font-bold text-[#256F39]">{filteredClients.length}</span>
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action buttons row */}
        <div className="flex gap-2 px-4">
          {!hideCreateButton && (
            <button
              onClick={() => navigate("/accounts/create")}
              className="bg-[#1a9e71] text-white font-bold text-[13px] py-1.5 px-3.5 rounded-[5px] flex items-center gap-1.5 whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" /> New User
            </button>
          )}
          <button
            onClick={() => navigate(`/reports/daily`)}
            className="bg-[#1a9e71] text-white font-bold text-[13px] py-1.5 px-3.5 rounded-[5px] flex items-center gap-1.5 whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        {/* Legend row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 text-[11px] font-semibold text-[#212529]">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-[#f1c40f] text-black font-bold text-[10px] flex items-center justify-center rounded-sm shadow-sm">C</div>
            <span>Cash / Credit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-[#1EB990] text-white flex items-center justify-center rounded-sm shadow-sm">
              <Pencil className="w-3 h-3" />
            </div>
            <span>Edit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-[#63C2DE] text-white font-bold text-[10px] flex items-center justify-center rounded-sm shadow-sm">L</div>
            <span>Ledger</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-[#42A665] text-white font-bold text-[10px] flex items-center justify-center rounded-sm shadow-sm">A</div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-white border border-[#e74c3c] text-[#e74c3c] font-bold text-[10px] flex items-center justify-center rounded-sm shadow-sm">D</div>
            <span>InActive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-[#e74c3c] text-white font-bold text-[10px] flex items-center justify-center rounded-sm shadow-sm">S</div>
            <span>Settle Account</span>
          </div>
        </div>

        {/* Search row */}
        <div className="px-4 pb-1">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-[#212529] whitespace-nowrap">Search:</label>
            <input
              type="text"
              placeholder="Search username..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="flex-1 h-[34px] border border-[#d1d5db] rounded-[5px] px-2.5 text-[13px] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-[12px] border-collapse">
          <thead>
            {!isBalanceLoaded ? (
              <tr className="bg-[#1a9e71]">
                <td colSpan={3} className="px-4 py-2 text-left">
                  <button
                    type="button"
                    onClick={handleLoadBalance}
                    className="bg-[#f1c40f] hover:bg-yellow-400 text-black font-bold text-[11px] px-4 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Load Balance
                  </button>
                </td>
              </tr>
            ) : (
              <tr className="bg-[#1a9e71] text-white">
                <td className="px-4 py-2.5 font-bold text-sm">Total</td>
                <td className="px-4 py-2.5 text-sm"></td>
                <td className="px-4 py-2.5 font-bold text-sm text-right">{totals.credit_received.toLocaleString()}</td>
              </tr>
            )}
            <tr className="bg-[#ecf0f1] border-y border-[#d5d8dc]">
              <th className="px-4 py-2.5 font-bold text-[#212529] border-r border-[#d5d8dc]">Username</th>
              <th className="px-4 py-2.5 font-bold text-[#212529] border-r border-[#d5d8dc]">Type</th>
              <th className="px-4 py-2.5 font-bold text-[#212529] text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-[#212529] bg-white">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1a9e71]" />
                    <span className="font-medium">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-[#212529] bg-white font-medium">
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
                          onClick={() => {
                            if (isAdminType) {
                              navigate(`/accounts/view/${client.username}`);
                            } else if (isBalanceLoaded) {
                              toggleExpand(client.id);
                            }
                          }}
                          className={cn(
                            "font-bold text-left",
                            isAdminType ? "text-[#1a9e71] underline cursor-pointer" : "text-[#212529]",
                            !isAdminType && isBalanceLoaded && "hover:underline cursor-pointer"
                          )}
                        >
                          {client.username}
                        </button>
                      </td>
                      <td className="px-3 lg:px-4 py-3 border-r border-[#d5d8dc] text-[#212529] font-semibold">
                        {getTypeLabel(client.role)}
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-[#212529] text-right font-semibold">
                        {/* Only show credit value after Load Balance is clicked */}
                        {isBalanceLoaded ? (
                          <span className="font-bold">
                            {(client.credit_received || 0).toLocaleString()}
                          </span>
                        ) : "-"}
                      </td>
                    </tr>

                    {/* Expanded details row — only when balance is loaded AND row is expanded */}
                    {isBalanceLoaded && isExpanded && (
                      <tr>
                        <td colSpan={3} className={cn("px-5 py-4 border-b border-[#d5d8dc]", idx % 2 === 0 ? "bg-slate-50" : "bg-white")}>
                          <div className="relative">
                            <ul className="text-[13px] text-[#212529] space-y-2 relative z-10">
                              <li className="flex items-center gap-2">
                                <span className="text-[#256F39] font-bold">•</span>
                                <span className="font-semibold text-[#212529]">Balance:</span>
                                <span className="font-bold text-[#256F39]">
                                  {(client.balance_upline || 0).toLocaleString()}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#256F39] font-bold">•</span>
                                <span className="font-semibold text-[#212529]">Client (P/L):</span>
                                <span className={cn("font-bold", (client.pl_downline || 0) < 0 ? "text-[#e74c3c]" : "text-[#256F39]")}>
                                  {(client.pl_downline || 0).toLocaleString()}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#256F39] font-bold">•</span>
                                <span className="font-semibold text-[#212529]">Share:</span>
                                <span className="font-bold text-[#256F39]">{client.downline_share || 0}</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#256F39] font-bold">•</span>
                                <span className="font-semibold text-[#212529]">Exposure:</span>
                                <span className="font-bold text-[#256F39]">0</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#256F39] font-bold">•</span>
                                <span className="font-semibold text-[#212529]">Available Balance:</span>
                                <span className="font-bold text-[#256F39]">
                                  {(client.credit_remaining || 0).toLocaleString()}
                                </span>
                              </li>
                              
                              <li className="flex items-center gap-3 mt-4 pt-3 border-t border-[#d5d8dc]">
                                <span className="font-semibold text-[#212529]">• Options</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button 
                                    onClick={() => navigate(`/accounts/cash-credit/${client.username}`)}
                                    className="w-9 h-9 bg-[#f1c40f] hover:bg-yellow-400 text-black font-bold text-sm flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                    title="Cash / Credit"
                                  >
                                    C
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/accounts/edit/${client.username}`)}
                                    className="w-9 h-9 bg-[#1EB990] hover:bg-[#17a37d] text-white flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/accounts/ledger/${client.username}`)}
                                    className="w-9 h-9 bg-[#63C2DE] hover:bg-[#4db0cc] text-white font-bold text-sm flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                    title="Ledger"
                                  >
                                    L
                                  </button>
                                  <button 
                                    onClick={() => toggleStatus(client)}
                                    className={cn(
                                      "w-9 h-9 rounded-sm font-bold text-sm flex items-center justify-center transition-all shadow-sm",
                                      client.status === "active" 
                                        ? "bg-[#42A665] hover:bg-[#379055] text-white" 
                                        : "bg-white border border-[#e74c3c] text-[#e74c3c] hover:bg-red-50"
                                    )}
                                    title={client.status === "active" ? "Active" : "Inactive"}
                                  >
                                    {client.status === "active" ? "A" : "D"}
                                  </button>
                                  {client.role !== 'client' && (
                                    <button 
                                      className="w-9 h-9 bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold text-sm flex items-center justify-center rounded-sm transition-colors shadow-sm"
                                      title="Settle Account"
                                      onClick={() => navigate(`/accounts/settle-pl/${client.username}`)}
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
        <div className="px-4 py-3 text-[11px] text-[#212529] border-t border-[#d5d8dc] bg-[#ecf0f1] font-medium">
          Showing {filteredClients.length} entries
        </div>
      </div>
    </section>
  );
}
