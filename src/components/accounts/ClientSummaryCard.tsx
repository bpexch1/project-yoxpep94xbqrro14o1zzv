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

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  React.useEffect(() => {
    if (autoLoadBalance && clients && clients.length > 0 && expandedIds.size === 0) {
      const allIds = new Set(clients.map((c: any) => c.id));
      setExpandedIds(allIds);
    }
  }, [autoLoadBalance, clients]);

  const handleLoadBalance = () => {
    onRefresh && onRefresh();
    setIsBalanceLoaded(true);
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
    <section className="bg-[#f3f3f3] border border-[#d4d4d4] rounded-[6px] overflow-hidden mb-[14px]" style={arialFont}>
      {/* Card title bar */}
      {!hideHeader && (
        <div className="px-3 py-2 bg-[#ececec] border-b border-[#d4d4d4]">
          <span className="font-bold text-[14px] text-[#333]">
            {username} - Clients List{!isBalanceLoaded ? " | Default" : ""}
          </span>
        </div>
      )}

      {/* Stats table section */}
      <div className="space-y-0 pt-2">
        <div className="px-3 pb-2 overflow-x-auto">
          <table className="w-auto text-left border-collapse border border-[#d0d0d0]">
            <thead>
              <tr className="bg-[#e8e8e8]">
                {!isBalanceLoaded ? (
                  <>
                    <th className="py-1 px-2 border border-[#d0d0d0] font-bold text-[#333] text-[12px] text-center whitespace-nowrap">Credit Remaining</th>
                    <th className="py-1 px-2 border border-[#d0d0d0] font-bold text-[#333] text-[12px] text-center whitespace-nowrap">Cash</th>
                    <th className="py-1 px-2 border border-[#d0d0d0] font-bold text-[#333] text-[12px] text-center whitespace-nowrap">P/L Downline</th>
                    <th className="py-1 px-2 border border-[#d0d0d0] font-bold text-[#333] text-[12px] text-center whitespace-nowrap">Users</th>
                  </>
                ) : (
                  <>
                    <th className="py-1 px-2 border border-[#d0d0d0] font-bold text-[#333] text-[12px] text-center whitespace-nowrap">Credit Received</th>
                    <th className="py-1 px-2 border border-[#d0d0d0] font-bold text-[#333] text-[12px] text-center whitespace-nowrap">Credit Remaining</th>
                    <th className="py-1 px-2 border border-[#d0d0d0] font-bold text-[#333] text-[12px] text-center whitespace-nowrap">Cash</th>
                    <th className="py-1 px-2 border border-[#d0d0d0] font-bold text-[#333] text-[12px] text-center whitespace-nowrap">P/L Downline</th>
                    <th className="py-1 px-2 border border-[#d0d0d0] font-bold text-[#333] text-[12px] text-center whitespace-nowrap">Balance UpLine</th>
                    <th className="py-1 px-2 border border-[#d0d0d0] font-bold text-[#333] text-[12px] text-center whitespace-nowrap">Users</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                {!isBalanceLoaded ? (
                  <>
                    <td className="py-1 px-2 border border-[#d0d0d0] text-center whitespace-nowrap text-[13px] font-bold text-[#12b886]">0</td>
                    <td className="py-1 px-2 border border-[#d0d0d0] text-center whitespace-nowrap text-[13px] font-bold text-[#12b886]">0</td>
                    <td className="py-1 px-2 border border-[#d0d0d0] text-center whitespace-nowrap text-[13px] font-bold text-[#12b886]">0</td>
                    <td className="py-1 px-2 border border-[#d0d0d0] text-center whitespace-nowrap text-[13px] font-bold text-[#12b886]">{filteredClients.length}</td>
                  </>
                ) : (
                  <>
                    <td className="py-1 px-2 border border-[#d0d0d0] text-center whitespace-nowrap text-[13px] font-bold text-[#12b886]">
                      {totals.credit_received.toLocaleString()}
                    </td>
                    <td className="py-1 px-2 border border-[#d0d0d0] text-center whitespace-nowrap text-[13px] font-bold text-[#12b886]">
                      {totals.credit_remaining.toLocaleString()}
                    </td>
                    <td className={cn("py-1 px-2 border border-[#d0d0d0] text-center whitespace-nowrap text-[13px] font-bold", totals.cash < 0 ? "text-[#e74c3c]" : "text-[#12b886]")}>
                      {totals.cash.toLocaleString()}
                    </td>
                    <td className={cn("py-1 px-2 border border-[#d0d0d0] text-center whitespace-nowrap text-[13px] font-bold", totals.pl_downline < 0 ? "text-[#e74c3c]" : "text-[#12b886]")}>
                      {totals.pl_downline.toLocaleString()}
                    </td>
                    <td className={cn("py-1 px-2 border border-[#d0d0d0] text-center whitespace-nowrap text-[13px] font-bold", totals.balance_upline < 0 ? "text-[#e74c3c]" : "text-[#12b886]")}>
                      {totals.balance_upline.toLocaleString()}
                    </td>
                    <td className="py-1 px-2 border border-[#d0d0d0] text-center whitespace-nowrap text-[13px] font-bold text-[#12b886]">
                      {filteredClients.length}
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action buttons row */}
        <div className="flex gap-[6px] px-3 pb-2">
          {!hideCreateButton && (
            <button
              onClick={() => navigate("/accounts/create")}
              className="bg-[#12b886] text-white font-bold text-[13px] h-[36px] px-3 rounded-[4px] flex items-center gap-1.5 whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" /> New User
            </button>
          )}
          <button
            onClick={() => navigate(`/reports/daily`)}
            className="bg-[#12b886] text-white font-bold text-[13px] h-[36px] px-3 rounded-[4px] flex items-center gap-1.5 whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        {/* Legend row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-1 text-[11px] font-semibold text-[#333]">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-[#f1c40f] text-black font-bold text-[10px] flex items-center justify-center rounded-sm">C</div>
            <span>Cash/Credit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-[#1EB990] text-white flex items-center justify-center rounded-sm">
              <Pencil className="w-3 h-3" />
            </div>
            <span>Edit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-[#63C2DE] text-white font-bold text-[10px] flex items-center justify-center rounded-sm">L</div>
            <span>Ledger</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-[#12b886] text-white font-bold text-[10px] flex items-center justify-center rounded-sm">A</div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-white border border-[#e74c3c] text-[#e74c3c] font-bold text-[10px] flex items-center justify-center rounded-sm">D</div>
            <span>InActive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-[#e74c3c] text-white font-bold text-[10px] flex items-center justify-center rounded-sm">S</div>
            <span>Settle Account</span>
          </div>
        </div>

        {/* Search row */}
        <div className="px-3 py-1.5 flex items-center gap-2">
          <label className="text-[13px] font-bold text-[#333] whitespace-nowrap">Search:</label>
          <input
            type="text"
            placeholder="Search username..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="flex-1 h-[34px] border border-[#cccccc] rounded-[4px] px-2.5 text-[13px] outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            {!isBalanceLoaded ? (
              <tr className="bg-[#12b886]">
                <td colSpan={3} className="px-3 py-2 text-left">
                  <button
                    type="button"
                    onClick={handleLoadBalance}
                    className="bg-[#f1c40f] hover:bg-yellow-400 text-black font-bold text-[12px] px-4 h-[32px] rounded-[4px] transition-colors cursor-pointer"
                  >
                    Load Balance
                  </button>
                </td>
              </tr>
            ) : (
              <tr className="bg-[#12b886] text-white font-bold">
                <td className="px-3 py-2.5 text-[14px]">Total</td>
                <td className="px-3 py-2.5"></td>
                <td className="px-3 py-2.5 text-[14px] text-right">{totals.credit_received.toLocaleString()}</td>
              </tr>
            )}
            <tr className="bg-[#e8e8e8] border-y border-[#d0d0d0]">
              <th className="px-3 py-2 font-bold text-[#333] border-r border-[#d0d0d0] text-[12px]">Username</th>
              <th className="px-3 py-2 font-bold text-[#333] border-r border-[#d0d0d0] text-[12px]">Type</th>
              <th className="px-3 py-2 font-bold text-[#333] text-right text-[12px]">Credit</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center bg-white">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#12b886]" />
                    <span className="font-medium text-[#333]">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center bg-white font-medium text-[#333]">
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
                    <tr className={cn(idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]", "border-b border-[#d0d0d0] admin-row h-[34px]")}>
                      <td className="px-3 py-1 border-r border-[#d0d0d0]">
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
                            isAdminType ? "text-[#12b886] underline cursor-pointer" : "text-[#333]",
                            !isAdminType && isBalanceLoaded && "hover:underline cursor-pointer"
                          )}
                        >
                          {client.username}
                        </button>
                      </td>
                      <td className="px-3 py-1 border-r border-[#d0d0d0] text-[#333] font-bold">
                        {getTypeLabel(client.role)}
                      </td>
                      <td className="px-3 py-1 text-[#333] text-right font-bold">
                        {isBalanceLoaded ? (client.credit_received || 0).toLocaleString() : "-"}
                      </td>
                    </tr>

                    {isBalanceLoaded && isExpanded && (
                      <tr>
                        <td colSpan={3} className={cn("px-4 py-3 border-b border-[#d0d0d0]", idx % 2 === 0 ? "bg-[#fafafa]" : "bg-white")}>
                          <div className="relative">
                            <ul className="text-[13px] text-[#333] space-y-1.5 relative z-10">
                              <li className="flex items-center gap-2">
                                <span className="text-[#12b886] font-bold">•</span>
                                <span className="font-bold">Balance:</span>
                                <span className="font-bold text-[#12b886]">
                                  {(client.balance_upline || 0).toLocaleString()}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#12b886] font-bold">•</span>
                                <span className="font-bold">Client (P/L):</span>
                                <span className={cn("font-bold", (client.pl_downline || 0) < 0 ? "text-[#e74c3c]" : "text-[#12b886]")}>
                                  {(client.pl_downline || 0).toLocaleString()}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#12b886] font-bold">•</span>
                                <span className="font-bold">Share:</span>
                                <span className="font-bold text-[#12b886]">{client.downline_share || 0}</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#12b886] font-bold">•</span>
                                <span className="font-bold">Exposure:</span>
                                <span className="font-bold text-[#12b886]">0</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#12b886] font-bold">•</span>
                                <span className="font-bold">Available Balance:</span>
                                <span className="font-bold text-[#12b886]">
                                  {(client.credit_remaining || 0).toLocaleString()}
                                </span>
                              </li>
                              
                              <li className="flex items-center gap-2 mt-3 pt-3 border-t border-[#d0d0d0]">
                                <span className="font-bold text-[#333] text-[12px] mr-1">• Options</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button 
                                    onClick={() => navigate(`/accounts/cash-credit/${client.username}`)}
                                    className="w-[34px] h-[34px] bg-[#f1c40f] hover:bg-yellow-400 text-black font-bold text-[13px] flex items-center justify-center rounded-[4px] transition-colors shadow-sm"
                                    title="Cash / Credit"
                                  >
                                    C
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/accounts/edit/${client.username}`)}
                                    className="w-[34px] h-[34px] bg-[#1EB990] hover:bg-[#17a37d] text-white flex items-center justify-center rounded-[4px] transition-colors shadow-sm"
                                    title="Edit"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/accounts/ledger/${client.username}`)}
                                    className="w-[34px] h-[34px] bg-[#63C2DE] hover:bg-[#4db0cc] text-white font-bold text-[13px] flex items-center justify-center rounded-[4px] transition-colors shadow-sm"
                                    title="Ledger"
                                  >
                                    L
                                  </button>
                                  <button 
                                    onClick={() => toggleStatus(client)}
                                    className={cn(
                                      "w-[34px] h-[34px] rounded-[4px] font-bold text-[13px] flex items-center justify-center transition-all shadow-sm",
                                      client.status === "active" 
                                        ? "bg-[#12b886] hover:bg-[#0ca678] text-white" 
                                        : "bg-white border border-[#e74c3c] text-[#e74c3c] hover:bg-red-50"
                                    )}
                                    title={client.status === "active" ? "Active" : "Inactive"}
                                  >
                                    {client.status === "active" ? "A" : "D"}
                                  </button>
                                  {client.role !== 'client' && (
                                    <button 
                                      className="w-[34px] h-[34px] bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold text-[13px] flex items-center justify-center rounded-[4px] transition-colors shadow-sm"
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
        <div className="px-3 py-2 text-[11px] text-[#333] border-t border-[#d0d0d0] bg-[#e8e8e8] font-bold">
          Showing {filteredClients.length} entries
        </div>
      </div>
    </section>
  );
}
