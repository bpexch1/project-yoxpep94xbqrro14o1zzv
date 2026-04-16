import React, { useState, useMemo } from "react";
import { Pencil, UserPlus, BookOpen, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/entities";
import { useIsMobile } from "@/hooks/use-mobile";

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
  autoLoadBalance = true
}: ClientSummaryCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [localSearch, setLocalSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
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
    const query = (localSearch.toLowerCase() || searchFilter.toLowerCase()).trim();
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
    <section className={cn(
      "bg-white border border-[#ccc] overflow-hidden mb-2",
      isMobile ? "rounded-lg" : "rounded-none"
    )} style={arialFont}>
      {/* Card title bar */}
      {!hideHeader && (
        <div className="px-[14px] py-[10px] border-b border-[#ddd]">
          <span className="font-bold text-[15px] text-[#333]">
            <span className="text-[#12b886]">{username}</span> - Clients List
          </span>
        </div>
      )}

      {/* Stats table section */}
      <div className="px-[14px] pt-2.5 pb-2">
        <table className="w-full sm:w-auto text-left border-collapse border border-[#ccc]">
          <thead>
            <tr className="bg-[#f5f5f5]">
              <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Credit Received</th>
              <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Credit Remaining</th>
              <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Cash</th>
              <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">P/L Downline</th>
              <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap sm:table-cell">Balance UpLine</th>
              <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Users</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr>
              <td className="py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold text-[#12b886]">
                {totals.credit_received.toLocaleString()}
              </td>
              <td className="py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold text-[#12b886]">
                {totals.credit_remaining.toLocaleString()}
              </td>
              <td className={cn("py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold", totals.cash < 0 ? "text-[#e74c3c]" : "text-[#12b886]")}>
                {totals.cash.toLocaleString()}
              </td>
              <td className={cn("py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold", totals.pl_downline < 0 ? "text-[#e74c3c]" : "text-[#12b886]")}>
                {totals.pl_downline.toLocaleString()}
              </td>
              <td className={cn("py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold sm:table-cell", totals.balance_upline < 0 ? "text-[#e74c3c]" : "text-[#12b886]")}>
                {totals.balance_upline.toLocaleString()}
              </td>
              <td className="py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold text-[#12b886]">
                {filteredClients.length}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action row with legend and search */}
      <div className="flex flex-col gap-3 px-[14px] pb-3">
        <div className="flex items-center gap-2">
          {!hideCreateButton && (
            <button
              onClick={() => navigate("/accounts/create")}
              className="bg-[#12b886] text-white font-bold text-[13px] h-[34px] px-3 rounded-[4px] flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> New User
            </button>
          )}
          <button
            onClick={() => navigate(`/reports/daily`)}
            className="bg-[#12b886] text-white font-bold text-[13px] h-[34px] px-3 rounded-[4px] flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] font-bold text-[#333]">
            <div className="flex items-center gap-1">
              <div className="w-[20px] h-[20px] bg-[#f1c40f] text-black flex items-center justify-center rounded-sm">C</div>
              <span>Cash / Credit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[20px] h-[20px] bg-[#1EB990] text-white flex items-center justify-center rounded-sm">
                <Pencil className="w-3 h-3" />
              </div>
              <span>Edit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[20px] h-[20px] bg-[#63C2DE] text-white flex items-center justify-center rounded-sm">L</div>
              <span>Ledger</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[20px] h-[20px] bg-[#12b886] text-white flex items-center justify-center rounded-sm">A</div>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1 w-full sm:w-auto">
              <div className="w-[20px] h-[20px] bg-white border border-[#e74c3c] text-[#e74c3c] flex items-center justify-center rounded-sm">D</div>
              <span>InActive</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[#333] text-center">Search:</span>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="h-[28px] border border-[#ccc] rounded-none px-2 text-[13px] outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#12b886] text-white font-bold text-[13px]">
              <td className="px-[10px] py-2">Total</td>
              {!isMobile ? (
                <>
                  <td className="px-[10px] py-2"></td>
                  <td className="px-[10px] py-2 text-right">{totals.credit_received.toLocaleString()}</td>
                  <td className="px-[10px] py-2 text-right">{totals.balance_upline.toLocaleString()}</td>
                  <td className="px-[10px] py-2 text-right">{totals.pl_downline.toLocaleString()}</td>
                  <td className="px-[10px] py-2"></td>
                  <td className="px-[10px] py-2 text-right">0</td>
                  <td className="px-[10px] py-2 text-right">{totals.credit_remaining.toLocaleString()}</td>
                  <td className="px-[10px] py-2"></td>
                </>
              ) : (
                <>
                  <td className="px-[10px] py-2"></td>
                  <td className="px-[10px] py-2 text-right">{totals.credit_received.toLocaleString()}</td>
                </>
              )}
            </tr>
            <tr className="bg-[#f5f5f5] border-y border-[#ccc] text-[12px] text-[#333]">
              <th className="px-[10px] py-2 font-bold border-r border-[#ccc]">Username</th>
              <th className="px-[10px] py-2 font-bold border-r border-[#ccc]">Type</th>
              <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Credit</th>
              {!isMobile && (
                <>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Balance</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Client (P/L)</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Share</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Exposure</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Available Balance</th>
                  <th className="px-[10px] py-2 font-bold">Options</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isMobile ? 3 : 9} className="px-3 py-10 text-center bg-white">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#12b886]" />
                    <span className="font-medium text-[#333]">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={isMobile ? 3 : 9} className="px-3 py-10 text-center bg-white font-medium text-[#333]">
                  No data available
                </td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => {
                const roleLower = client.role?.toLowerCase();
                const isAdminType = roleLower !== "client";
                const isExpanded = expandedIds.has(client.id);

                return (
                  <React.Fragment key={client.id}>
                    <tr className={cn(idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]", "border-b border-[#ddd]")}>
                      <td className="px-[10px] py-1.5 border-r border-[#ccc]">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => isAdminType && navigate(`/accounts/view/${client.username}`)}
                            className={cn(
                              "font-bold text-left text-[13px]",
                              isAdminType ? "text-[#12b886] underline cursor-pointer" : "text-[#333]"
                            )}
                          >
                            {client.username}
                          </button>
                          {isMobile && (
                            <button
                              onClick={() => toggleExpand(client.id)}
                              className="w-5 h-5 rounded-full bg-[#333] text-white text-[10px] flex items-center justify-center shrink-0"
                            >
                              i
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-[10px] py-1.5 border-r border-[#ccc] text-[#333] text-[13px]">
                        {getTypeLabel(client.role)}
                      </td>
                      <td className="px-[10px] py-1.5 border-r border-[#ccc] text-[#333] text-right text-[13px] font-medium">
                        {(client.credit_received || 0).toLocaleString()}
                      </td>
                      
                      {!isMobile && (
                        <>
                          <td className={cn("px-[10px] py-1.5 border-r border-[#ccc] text-right text-[13px] font-medium", (client.balance_upline || 0) < 0 ? "text-[#e74c3c]" : "text-[#333]")}>
                            {(client.balance_upline || 0).toLocaleString()}
                          </td>
                          <td className={cn("px-[10px] py-1.5 border-r border-[#ccc] text-right text-[13px] font-bold", (client.pl_downline || 0) < 0 ? "text-[#e74c3c]" : "text-[#12b886]")}>
                            {(client.pl_downline || 0).toLocaleString()}
                          </td>
                          <td className="px-[10px] py-1.5 border-r border-[#ccc] text-[#333] text-right text-[13px]">
                            {client.downline_share || 0}
                          </td>
                          <td className="px-[10px] py-1.5 border-r border-[#ccc] text-[#333] text-right text-[13px]">
                            0
                          </td>
                          <td className="px-[10px] py-1.5 border-r border-[#ccc] text-[#12b886] text-right text-[13px] font-bold">
                            {(client.credit_remaining || 0).toLocaleString()}
                          </td>
                          <td className="px-[10px] py-1.5 min-w-[150px]">
                            <div className="flex flex-wrap items-center gap-[2px]">
                              <button 
                                onClick={() => navigate(`/accounts/cash-credit/${client.username}`)}
                                className="w-[28px] h-[28px] bg-[#f1c40f] hover:bg-yellow-400 text-black font-bold text-[12px] flex items-center justify-center rounded-[3px] transition-colors shadow-sm"
                                title="Cash / Credit"
                              >
                                C
                              </button>
                              <button 
                                onClick={() => navigate(`/accounts/edit/${client.username}`)}
                                className="w-[28px] h-[28px] bg-[#1EB990] hover:bg-[#17a37d] text-white flex items-center justify-center rounded-[3px] transition-colors shadow-sm"
                                title="Edit"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => navigate(`/accounts/ledger/${client.username}`)}
                                className="w-[28px] h-[28px] bg-[#63C2DE] hover:bg-[#4db0cc] text-white font-bold text-[12px] flex items-center justify-center rounded-[3px] transition-colors shadow-sm"
                                title="Ledger"
                              >
                                L
                              </button>
                              <button 
                                onClick={() => toggleStatus(client)}
                                className={cn(
                                  "w-[28px] h-[28px] rounded-[3px] font-bold text-[12px] flex items-center justify-center transition-all shadow-sm",
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
                                  className="w-[28px] h-[28px] bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold text-[12px] flex items-center justify-center rounded-[3px] transition-colors shadow-sm"
                                  title="Settle Account"
                                  onClick={() => navigate(`/accounts/settle-pl/${client.username}`)}
                                >
                                  S
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>

                    {/* Mobile Expanded Row */}
                    {isMobile && isExpanded && (
                      <tr className="bg-[#f9f9f9] border-b border-[#ddd]">
                        <td colSpan={3} className="px-3 py-3">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-y-2 text-[13px]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#333]">Balance:</span>
                                <span className={cn("font-medium", (client.balance_upline || 0) < 0 ? "text-[#e74c3c]" : "text-[#333]")}>
                                  {(client.balance_upline || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#333]">P/L:</span>
                                <span className={cn("font-bold", (client.pl_downline || 0) < 0 ? "text-[#e74c3c]" : "text-[#12b886]")}>
                                  {(client.pl_downline || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#333]">Share:</span>
                                <span className="text-[#333]">{client.downline_share || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#333]">Exposure:</span>
                                <span className="text-[#333]">0</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#333]">Avail:</span>
                                <span className="text-[#12b886] font-bold">
                                  {(client.credit_remaining || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button 
                                onClick={() => navigate(`/accounts/cash-credit/${client.username}`)}
                                className="h-[28px] px-3 bg-[#f1c40f] text-black font-bold text-[12px] flex items-center justify-center rounded-[3px]"
                              >
                                C
                              </button>
                              <button 
                                onClick={() => navigate(`/accounts/edit/${client.username}`)}
                                className="h-[28px] px-3 bg-[#1EB990] text-white flex items-center justify-center rounded-[3px]"
                              >
                                <Pencil className="w-3 h-3 mr-1" /> Edit
                              </button>
                              <button 
                                onClick={() => navigate(`/accounts/ledger/${client.username}`)}
                                className="h-[28px] px-3 bg-[#63C2DE] text-white font-bold text-[12px] flex items-center justify-center rounded-[3px]"
                              >
                                L
                              </button>
                              <button 
                                onClick={() => toggleStatus(client)}
                                className={cn(
                                  "h-[28px] px-3 rounded-[3px] font-bold text-[12px] flex items-center justify-center",
                                  client.status === "active" 
                                    ? "bg-[#12b886] text-white" 
                                    : "bg-white border border-[#e74c3c] text-[#e74c3c]"
                                )}
                              >
                                {client.status === "active" ? "Active" : "Inactive"}
                              </button>
                              {client.role !== 'client' && (
                                <button 
                                  className="h-[28px] px-3 bg-[#e74c3c] text-white font-bold text-[12px] flex items-center justify-center rounded-[3px]"
                                  onClick={() => navigate(`/accounts/settle-pl/${client.username}`)}
                                >
                                  Settle
                                </button>
                              )}
                            </div>
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
        <div className="px-[14px] py-[6px] text-[12px] text-[#333] bg-[#e8e8e8] font-bold">
          Showing {filteredClients.length} entries
        </div>
      </div>
    </section>
  );
}
