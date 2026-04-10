import { useState, useMemo } from "react";
import { BookOpen, Pencil, CheckCircle, XCircle, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewUserModal } from "./NewUserModal";
import { CashCreditModal } from "./CashCreditModal";
import { motion, AnimatePresence } from "framer-motion";

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
    if (!showRealBalances || !clients) {
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
    <div className="bg-white rounded border shadow-sm overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b text-sm font-bold text-slate-800 flex justify-between items-center">
        <span>NomanSA8592 - Clients List | Default</span>
        <button 
          onClick={handleLoadBalance}
          disabled={isLoadBalanceLoading}
          className="bg-amber-400 hover:bg-amber-500 text-black font-bold px-4 py-1.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isLoadBalanceLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          Load Balance
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Stats Table */}
        <div className="overflow-x-auto border rounded bg-white">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-700 font-bold">
                <th className="p-3 border-r whitespace-nowrap">Credit Received</th>
                <th className="p-3 border-r whitespace-nowrap">Credit Remaining</th>
                <th className="p-3 border-r whitespace-nowrap">Cash</th>
                <th className="p-3 border-r whitespace-nowrap">P/L Downline</th>
                <th className="p-3 border-r whitespace-nowrap">Balance Upline</th>
                <th className="p-3 whitespace-nowrap">Users</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold">
                <td className="p-3 border-r text-emerald-600">{formatNumber(totals.credit_received)}</td>
                <td className="p-3 border-r text-emerald-600">{formatNumber(totals.credit_remaining)}</td>
                <td className="p-3 border-r text-emerald-600">{formatNumber(totals.cash)}</td>
                <td className={cn("p-3 border-r", totals.pl_downline < 0 ? "text-red-500" : "text-emerald-600")}>
                  {formatNumber(totals.pl_downline)}
                </td>
                <td className="p-3 border-r text-emerald-600">{formatNumber(totals.balance_upline)}</td>
                <td className="p-3 text-emerald-600">{totals.users}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setIsNewUserModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New User
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors">
            <BookOpen className="w-3.5 h-3.5" />
            Account Ledger
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-600 border-t pt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-white font-bold">C</div>
            <span>Cash / Credit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-white">
              <Pencil className="w-3 h-3" />
            </div>
            <span>Edit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-sky-500 rounded flex items-center justify-center text-white font-bold text-[8px]">L</div>
            <span>Ledger</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center text-white">
              <CheckCircle className="w-3 h-3" />
            </div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 border border-red-500 rounded flex items-center justify-center text-red-500">
              <XCircle className="w-3 h-3" />
            </div>
            <span>InActive</span>
          </div>
        </div>

        {/* List Table */}
        <div className="space-y-3 mt-6">
          <div className="flex justify-end items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-slate-200 rounded px-2 py-1 max-w-[150px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="overflow-x-auto border rounded">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-3 border-r whitespace-nowrap">User Name</th>
                  <th className="p-3 border-r whitespace-nowrap text-right">Credit Received</th>
                  <th className="p-3 border-r whitespace-nowrap text-right">Credit Remaining</th>
                  <th className="p-3 border-r whitespace-nowrap text-right">Cash</th>
                  <th className="p-3 border-r whitespace-nowrap text-right">P/L Downline</th>
                  <th className="p-3 border-r whitespace-nowrap text-right">Balance Upline</th>
                  <th className="p-3 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading clients...
                      </div>
                    </td>
                  </tr>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 border-r font-semibold text-emerald-600 cursor-pointer hover:underline">
                        {client.username}
                      </td>
                      <td className="p-3 border-r text-right font-medium">{formatNumber(client.credit_received)}</td>
                      <td className="p-3 border-r text-right font-medium">{formatNumber(client.credit_remaining)}</td>
                      <td className="p-3 border-r text-right font-medium">{formatNumber(client.cash)}</td>
                      <td className={cn("p-3 border-r text-right font-bold", (client.pl_downline || 0) < 0 ? "text-red-500" : "text-emerald-600")}>
                        {formatNumber(client.pl_downline)}
                      </td>
                      <td className="p-3 border-r text-right font-medium">{formatNumber(client.balance_upline)}</td>
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleOpenCashCredit(client)}
                            className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm hover:bg-orange-600 transition-colors"
                          >
                            C
                          </button>
                          <button className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center text-white shadow-sm hover:bg-emerald-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 bg-sky-500 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm hover:bg-sky-600 transition-colors">
                            L
                          </button>
                          <button className={cn(
                            "w-7 h-7 rounded flex items-center justify-center shadow-sm transition-colors",
                            client.status === "active" 
                              ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                              : "border border-red-500 text-red-500 hover:bg-red-50"
                          )}>
                            {client.status === "active" ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      No clients found. Click "New User" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-2 px-1">
            <span>Showing {filteredClients.length} of {clients?.length || 0}</span>
            <div className="flex gap-1.5">
              <button className="px-3 py-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
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
