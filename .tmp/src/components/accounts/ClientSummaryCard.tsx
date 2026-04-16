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
  const [isBalanceLoaded, setIsBalanceLoaded] = useState(autoLoadBalance);

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  const handleLoadBalance = () => {
    onRefresh && onRefresh();
    setIsBalanceLoaded(true);
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
    <section className="bg-white border border-[#ccc] rounded-none overflow-hidden mb-2" style={arialFont}>
      {/* Card title bar */}
      {!hideHeader && (
        <div className="px-[14px] py-[10px] border-b border-[#ddd]">
          <span className="font-bold text-[15px] text-[#333]">
            <span className="text-[#12b886]">{username}</span> - Clients List{!isBalanceLoaded ? " | Default" : ""}
          </span>
        </div>
      )}

      {/* Stats table section */}
      <div className="px-[14px] pt-2.5 pb-2">
        <table className="w-auto text-left border-collapse border border-[#ccc]">
          <thead>
            <tr className="bg-[#f5f5f5]">
              {!isBalanceLoaded ? (
                <>
                  <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Credit Remaining</th>
                  <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Cash</th>
                  <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">P/L Downline</th>
                  <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Users</th>
                </>
              ) : (
                <>
                  <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Credit Received</th>
                  <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Credit Remaining</th>
                  <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Cash</th>
                  <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">P/L Downline</th>
                  <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Balance UpLine</th>
                  <th className="py-1.5 px-3 border border-[#ccc] font-bold text-[#333] text-[13px] whitespace-nowrap">Users</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr>
              {!isBalanceLoaded ? (
                <>
                  <td className="py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold text-[#12b886]">0</td>
                  <td className="py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold text-[#12b886]">0</td>
                  <td className="py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold text-[#12b886]">0</td>
                  <td className="py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold text-[#12b886]">{filteredClients.length}</td>
                </>
              ) : (
                <>
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
                  <td className={cn("py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold", totals.balance_upline < 0 ? "text-[#e74c3c]" : "text-[#12b886]")}>
                    {totals.balance_upline.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-3 border border-[#ccc] whitespace-nowrap text-[13px] font-bold text-[#12b886]">
                    {filteredClients.length}
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action row with legend and search */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-[14px] pb-3">
        <div className="flex items-center gap-1.5">
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

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#333]">
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
            <div className="flex items-center gap-1">
              <div className="w-[20px] h-[20px] bg-white border border-[#e74c3c] text-[#e74c3c] flex items-center justify-center rounded-sm">D</div>
              <span>InActive</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-[#333]">Search:</span>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-[150px] h-[28px] border border-[#ccc] rounded-none px-2 text-[13px] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {!isBalanceLoaded ? (
              <>
                <tr className="bg-[#12b886]">
                  <td colSpan={3} className="px-[10px] py-2">
                    <button
                      type="button"
                      onClick={handleLoadBalance}
                      className="bg-[#f1c40f] text-black font-bold text-[12px] px-4 h-[30px] rounded-[4px] hover:bg-yellow-400 transition-colors"
                    >
                      Load Balance
                    </button>
                  </td>
                </tr>
                <tr className="bg-[#f5f5f5] border-y border-[#ccc]">
                  <th className="px-3 py-2 font-bold text-[#333] border-r border-[#ccc] text-[12px]">Username</th>
                  <th className="px-3 py-2 font-bold text-[#333] border-r border-[#ccc] text-[12px]">Type</th>
                  <th className="px-3 py-2 font-bold text-[#333] text-right text-[12px]">Credit</th>
                </tr>
              </>
            ) : (
              <>
                <tr className="bg-[#12b886] text-white font-bold text-[13px]">
                  <td className="px-[10px] py-2">Total</td>
                  <td className="px-[10px] py-2"></td>
                  <td className="px-[10px] py-2 text-right">{totals.credit_received.toLocaleString()}</td>
                  <td className="px-[10px] py-2 text-right">{totals.balance_upline.toLocaleString()}</td>
                  <td className="px-[10px] py-2 text-right">{totals.pl_downline.toLocaleString()}</td>
                  <td className="px-[10px] py-2"></td>
                  <td className="px-[10px] py-2 text-right">0</td>
                  <td className="px-[10px] py-2 text-right">{totals.credit_remaining.toLocaleString()}</td>
                  <td className="px-[10px] py-2"></td>
                </tr>
                <tr className="bg-[#f5f5f5] border-y border-[#ccc] text-[12px] text-[#333]">
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc]">Username</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc]">Type</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Credit</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Balance</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Client (P/L)</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Share</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Exposure</th>
                  <th className="px-[10px] py-2 font-bold border-r border-[#ccc] text-right">Available Balance</th>
                  <th className="px-[10px] py-2 font-bold">Options</th>
                </tr>
              </>
            )}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isBalanceLoaded ? 9 : 3} className="px-3 py-10 text-center bg-white">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#12b886]" />
                    <span className="font-medium text-[#333]">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={isBalanceLoaded ? 9 : 3} className="px-3 py-10 text-center bg-white font-medium text-[#333]">
                  No data available
                </td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => {
                const roleLower = client.role?.toLowerCase();
                const isAdminType = roleLower !== "client";

                return (
                  <tr key={client.id} className={cn(idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]", "border-b border-[#ddd]")}>
                    <td className="px-[10px] py-1.5 border-r border-[#ccc]">
                      <button
                        onClick={() => isAdminType && navigate(`/accounts/view/${client.username}`)}
                        className={cn(
                          "font-bold text-left text-[13px]",
                          isAdminType ? "text-[#12b886] underline cursor-pointer" : "text-[#333]"
                        )}
                      >
                        {client.username}
                      </button>
                    </td>
                    <td className="px-[10px] py-1.5 border-r border-[#ccc] text-[#333] text-[13px]">
                      {getTypeLabel(client.role)}
                    </td>
                    <td className="px-[10px] py-1.5 border-r border-[#ccc] text-[#333] text-right text-[13px] font-medium">
                      {(client.credit_received || 0).toLocaleString()}
                    </td>
                    
                    {isBalanceLoaded && (
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
