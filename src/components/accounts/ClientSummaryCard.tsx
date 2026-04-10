import React, { useState, useMemo } from "react";
import { BookOpen, Pencil, CheckCircle, XCircle, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewUserModal } from "./NewUserModal";
import { CashCreditModal } from "./CashCreditModal";

interface ClientSummaryCardProps {
  clients: any[];
  isLoading: boolean;
}

export function ClientSummaryCard({ clients, isLoading }: ClientSummaryCardProps) {
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isCashCreditModalOpen, setIsCashCreditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isLoadBalanceLoading, setIsLoadBalanceLoading] = useState(false);
  const [showRealBalances, setShowRealBalances] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString();
  };

  const handleLoadBalance = () => {
    setIsLoadBalanceLoading(true);
    setTimeout(() => {
      setIsLoadBalanceLoading(false);
      setShowRealBalances(true);
    }, 800);
  };

  const totals = useMemo(() => {
    if (!showRealBalances || !clients || clients.length === 0) {
      return {
        credit_received: 0,
        credit_remaining: 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        users: 0
      };
    }
    return clients.reduce(
      (acc, client) => ({
        credit_received: acc.credit_received + (client.credit_received || 0),
        credit_remaining: acc.credit_remaining + (client.credit_remaining || 0),
        cash: acc.cash + (client.cash || 0),
        pl_downline: acc.pl_downline + (client.pl_downline || 0),
        balance_upline: acc.balance_upline + (client.balance_upline || 0),
        users: acc.users + 1
      }),
      { credit_received: 0, credit_remaining: 0, cash: 0, pl_downline: 0, balance_upline: 0, users: 0 }
    );
  }, [clients, showRealBalances]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(client => 
      client.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const handleOpenCashCredit = (client: any) => {
    setSelectedClient(client);
    setIsCashCreditModalOpen(true);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-800 flex justify-between items-center uppercase tracking-wider">
        <span>NomanSA8592 - Clients List | Default</span>
        <button 
          onClick={handleLoadBalance}
          disabled={isLoadBalanceLoading}
          className="bg-amber-400 hover:bg-amber-500 text-black font-bold px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isLoadBalanceLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          Load Balance
        </button>
      </div>
      
      <div className="p-4 space-y-5">
        {/* Stats Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-slate-50/30">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter text-[10px]">
                <th className="p-3 border-r border-slate-200 whitespace-nowrap">Credit Received</th>
                <th className="p-3 border-r border-slate-200 whitespace-nowrap">Credit Remaining</th>
                <th className="p-3 border-r border-slate-200 whitespace-nowrap">Cash</th>
                <th className="p-3 border-r border-slate-200 whitespace-nowrap">P/L Downline</th>
                <th className="p-3 border-r border-slate-200 whitespace-nowrap">Balance Upline</th>
                <th className="p-3 whitespace-nowrap">Users</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-[13px]">
                <td className="p-3 border-r border-slate-200 text-emerald-600">{formatNumber(totals.credit_received)}</td>
                <td className="p-3 border-r border-slate-200 text-emerald-600">{formatNumber(totals.credit_remaining)}</td>
                <td className="p-3 border-r border-slate-200 text-emerald-600">{formatNumber(totals.cash)}</td>
                <td className={cn("p-3 border-r border-slate-200", totals.pl_downline < 0 ? "text-red-500" : "text-emerald-600")}>
                  {formatNumber(totals.pl_downline)}
                </td>
                <td className="p-3 border-r border-slate-200 text-emerald-600">{formatNumber(totals.balance_upline)}</td>
                <td className="p-3 text-emerald-600">{totals.users || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setIsNewUserModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-all">
            <BookOpen className="w-4 h-4" />
            Account Ledger
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-slate-500 border-t border-slate-100 pt-4 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-orange-500 rounded-md flex items-center justify-center text-white font-black text-[11px] leading-none">C</div>
            <span>Cash / Credit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-500 rounded-md flex items-center justify-center text-white">
              <Pencil className="w-3 h-3" />
            </div>
            <span>Edit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-sky-500 rounded-md flex items-center justify-center text-white font-black text-[8px] leading-none">L</div>
            <span>Ledger</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-600 rounded-md flex items-center justify-center text-white">
              <CheckCircle className="w-3 h-3" />
            </div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-red-500 rounded-md flex items-center justify-center text-red-500">
              <XCircle className="w-3 h-3" />
            </div>
            <span>InActive</span>
          </div>
        </div>

        {/* List Table */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-end items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-widest">
            <span>Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 max-w-[180px] focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 transition-all focus:bg-white font-normal lowercase tracking-normal"
            />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter text-[10px]">
                  <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">User Name</th>
                  <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap text-right">Credit Received</th>
                  <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap text-right">Credit Remaining</th>
                  <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap text-right">Cash</th>
                  <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap text-right">P/L Downline</th>
                  <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap text-right">Balance Upline</th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-3 font-medium">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                        Loading clients...
                      </div>
                    </td>
                  </tr>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group text-[13px]">
                      <td className="px-4 py-3 border-r border-slate-100 font-bold text-emerald-600 cursor-pointer hover:underline">
                        {client.username}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100 text-right font-medium">{formatNumber(client.credit_received)}</td>
                      <td className="px-4 py-3 border-r border-slate-100 text-right font-medium">{formatNumber(client.credit_remaining)}</td>
                      <td className="px-4 py-3 border-r border-slate-100 text-right font-medium">{formatNumber(client.cash)}</td>
                      <td className={cn("px-4 py-3 border-r border-slate-100 text-right font-black", (client.pl_downline || 0) < 0 ? "text-red-500" : "text-emerald-600")}>
                        {formatNumber(client.pl_downline)}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100 text-right font-medium">{formatNumber(client.balance_upline)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleOpenCashCredit(client)}
                            className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center text-white font-black text-[11px] shadow-sm hover:bg-orange-600 transition-all active:scale-90"
                          >
                            C
                          </button>
                          <button className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center text-white shadow-sm hover:bg-emerald-600 transition-all active:scale-90">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 bg-sky-500 rounded-md flex items-center justify-center text-white font-black text-[11px] shadow-sm hover:bg-sky-600 transition-all active:scale-90">
                            L
                          </button>
                          <button className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center shadow-sm transition-all active:scale-90",
                            client.status === "active" 
                              ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                              : "border-2 border-red-500 text-red-500 hover:bg-red-50"
                          )}>
                            {client.status === "active" ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                      No clients found. Click 'New User' to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 px-1">
            <span>Showing {filteredClients.length} of {clients?.length || 0} Entries</span>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors" disabled>Previous</button>
              <button className="px-4 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>

      <NewUserModal 
        isOpen={isNewUserModalOpen} 
        onClose={() => setIsNewUserModalOpen(false)} 
      />
      
      <CashCreditModal 
        client={selectedClient}
        isOpen={isCashCreditModalOpen}
        onClose={() => {
          setIsCashCreditModalOpen(false);
          setSelectedClient(null);
        }}
      />
    </div>
  );
}
