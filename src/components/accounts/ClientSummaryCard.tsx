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
        users: clients?.length || 0
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
    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 font-semibold text-sm text-slate-800">
        NomanSA8592 - Clients List {showRealBalances ? "" : "| Default"}
      </div>
      
      <div className="p-4">
        {/* Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-slate-100">
                {!showRealBalances ? (
                  <>
                    <th className="p-2 border-r border-slate-100 font-semibold text-slate-600 w-1/4">Credit Remaining</th>
                    <th className="p-2 border-r border-slate-100 font-semibold text-slate-600 w-1/4">Cash</th>
                    <th className="p-2 border-r border-slate-100 font-semibold text-slate-600 w-1/4">P/L Downline</th>
                    <th className="p-2 font-semibold text-slate-600 w-1/4">Users</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border-r border-slate-100 font-semibold text-slate-600">Credit Received</th>
                    <th className="p-2 border-r border-slate-100 font-semibold text-slate-600">Credit Remaining</th>
                    <th className="p-2 border-r border-slate-100 font-semibold text-slate-600">Cash</th>
                    <th className="p-2 font-semibold text-slate-600">P/L Downline</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-sm">
                {!showRealBalances ? (
                  <>
                    <td className="p-2 border-r border-slate-100 text-green-600">0</td>
                    <td className="p-2 border-r border-slate-100 text-green-600">0</td>
                    <td className="p-2 border-r border-slate-100 text-green-600">0</td>
                    <td className="p-2 text-slate-800">{totals.users}</td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border-r border-slate-100 text-slate-800">{formatNumber(totals.credit_received)}</td>
                    <td className="p-2 border-r border-slate-100 text-slate-800">{formatNumber(totals.credit_remaining)}</td>
                    <td className={cn("p-2 border-r border-slate-100", totals.cash < 0 ? "text-red-500" : "text-slate-800")}>{formatNumber(totals.cash)}</td>
                    <td className={cn("p-2", totals.pl_downline < 0 ? "text-red-500" : "text-slate-800")}>{formatNumber(totals.pl_downline)}</td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2 mt-3">
          <button 
            onClick={() => setIsNewUserModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New User
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1 transition-colors">
            <BookOpen className="w-3.5 h-3.5" />
            Account Ledger
          </button>
        </div>

        {/* Legend Row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[10px] font-medium text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-[9px]">C</div>
            <span>Cash / Credit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center text-white">
              <Pencil className="w-2.5 h-2.5" />
            </div>
            <span>Edit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-sky-500 rounded flex items-center justify-center text-white font-bold text-[9px]">L</div>
            <span>Ledger</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-[9px]">A</div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border border-red-500 rounded flex items-center justify-center text-red-500 font-bold text-[9px]">D</div>
            <span>InActive</span>
          </div>
        </div>

        {/* Search Row */}
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-slate-600">
          <span>Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        {/* Client Data Table */}
        <div className="overflow-x-auto mt-3 border border-slate-100 rounded">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="p-2 border-r border-slate-100">User Name</th>
                <th className="p-2 border-r border-slate-100 text-right">Credit Received</th>
                <th className="p-2 border-r border-slate-100 text-right">Credit Remaining</th>
                <th className="p-2 border-r border-slate-100 text-right">Cash</th>
                <th className="p-2 border-r border-slate-100 text-right">P/L Downline</th>
                <th className="p-2 border-r border-slate-100 text-right">Balance Upline</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading clients...
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50">
                    <td className="p-2 border-r border-slate-50 text-emerald-600 font-bold cursor-pointer hover:underline">
                      {client.username}
                    </td>
                    <td className="p-2 border-r border-slate-50 text-right">{formatNumber(client.credit_received)}</td>
                    <td className="p-2 border-r border-slate-50 text-right">{formatNumber(client.credit_remaining)}</td>
                    <td className="p-2 border-r border-slate-50 text-right">{formatNumber(client.cash)}</td>
                    <td className={cn("p-2 border-r border-slate-50 text-right font-bold", (client.pl_downline || 0) < 0 ? "text-red-500" : "text-emerald-600")}>
                      {formatNumber(client.pl_downline)}
                    </td>
                    <td className="p-2 border-r border-slate-50 text-right">{formatNumber(client.balance_upline)}</td>
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleOpenCashCredit(client)}
                          className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-[10px] hover:bg-orange-600 transition-colors"
                        >
                          C
                        </button>
                        <button className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-white hover:bg-emerald-600 transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center text-white font-bold text-[10px] hover:bg-sky-600 transition-colors">
                          L
                        </button>
                        <button className={cn(
                          "w-6 h-6 rounded flex items-center justify-center transition-colors",
                          client.status === "active" 
                            ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                            : "border border-red-500 text-red-500 hover:bg-red-50"
                        )}>
                          {client.status === "active" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                    No clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load Balance Button at bottom */}
        <button 
          onClick={handleLoadBalance}
          disabled={isLoadBalanceLoading}
          className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-black font-bold py-3 text-sm tracking-wide transition-colors mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isLoadBalanceLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoadBalanceLoading ? "Loading..." : "Load Balance"}
        </button>
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
