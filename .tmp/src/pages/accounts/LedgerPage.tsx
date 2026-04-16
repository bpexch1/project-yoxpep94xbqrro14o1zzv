import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Transaction, Client } from "@/entities";
import { 
  ChevronLeft, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
  Download,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function LedgerPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'cash' | 'credit'>('all');

  const { data: clients } = useQuery({
    queryKey: ["client", username],
    queryFn: () => Client.filter({ username }),
    enabled: !!username,
  });

  const client = clients?.[0];

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", username],
    queryFn: () => Transaction.filter({ client_username: username }, "-created_at", 100),
    enabled: !!username,
  });

  const filtered = (transactions || []).filter(t => 
    filterType === 'all' ? true : t.type === filterType
  );

  const summary = filtered.reduce(
    (acc, t) => {
      if (t.amount > 0) {
        acc.deposits += t.amount;
      } else {
        acc.withdrawals += Math.abs(t.amount);
      }
      return acc;
    },
    { deposits: 0, withdrawals: 0 }
  );

  const netBalance = summary.deposits - summary.withdrawals;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatAmount = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-roboto pb-12">
      <main className="max-w-[720px] mx-auto p-4 lg:p-6">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#2c3e50]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#2c3e50]">Settlement Ledger</h1>
              <p className="text-sm text-[#1a9e71] font-bold uppercase tracking-wider">
                @{username}
              </p>
            </div>
          </div>
          <button className="p-2 bg-emerald-50 text-[#1a9e71] rounded-lg hover:bg-emerald-100 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 p-1">
          {(['all', 'cash', 'credit'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-lg",
                filterType === type
                  ? "bg-[#1a9e71] text-white shadow-md"
                  : "bg-white text-[#7f8c8d] hover:bg-gray-50"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-[#1a9e71]" />
              </div>
              <span className="text-[11px] font-bold text-[#7f8c8d] uppercase tracking-wide">Total Deposits</span>
            </div>
            <p className="text-lg font-black text-[#1a9e71]">{formatAmount(summary.deposits)}</p>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="w-4 h-4 text-[#e74c3c]" />
              </div>
              <span className="text-[11px] font-bold text-[#7f8c8d] uppercase tracking-wide">Total Withdrawals</span>
            </div>
            <p className="text-lg font-black text-[#e74c3c]">{formatAmount(summary.withdrawals)}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ArrowUpDown className={cn("w-4 h-4", netBalance >= 0 ? "text-blue-600" : "text-[#e74c3c]")} />
              </div>
              <span className="text-[11px] font-bold text-[#7f8c8d] uppercase tracking-wide">Net Position</span>
            </div>
            <p className={cn("text-lg font-black", netBalance >= 0 ? "text-blue-600" : "text-[#e74c3c]")}>
              {formatAmount(netBalance)}
            </p>
          </div>
        </div>

        {/* Ledger Table Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-[#2c3e50] text-sm uppercase tracking-wider">Transaction Records</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-[#1a9e71] transition-colors"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-4 font-bold text-[#2c3e50] border-r border-gray-50">Date & Time</th>
                  <th className="px-6 py-4 font-bold text-[#2c3e50] border-r border-gray-50">Description</th>
                  <th className="px-6 py-4 font-bold text-[#1a9e71] text-right border-r border-gray-50">Deposit</th>
                  <th className="px-6 py-4 font-bold text-[#e74c3c] text-right border-r border-gray-50">Withdraw</th>
                  <th className="px-6 py-4 font-bold text-[#2c3e50] text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-[#1a9e71]" />
                        <span className="text-sm font-medium text-gray-400">Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                      No transaction history found for {filterType}
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx, idx) => (
                    <tr 
                      key={tx.id} 
                      className={cn(
                        "border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors",
                        idx % 2 === 0 ? "bg-white" : "bg-[#fafbfc]"
                      )}
                    >
                      <td className="px-6 py-4 text-[#7f8c8d] border-r border-gray-50 font-medium">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-6 py-4 text-[#2c3e50] border-r border-gray-50 font-bold">
                        {tx.description || "System Settlement"}
                      </td>
                      <td className="px-6 py-4 text-[#1a9e71] font-black text-right border-r border-gray-50">
                        {tx.amount > 0 ? tx.amount.toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-[#e74c3c] font-black text-right border-r border-gray-50">
                        {tx.amount < 0 ? Math.abs(tx.amount).toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-[#2c3e50] font-black text-right bg-gray-50/50">
                        {(tx.after_balance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-[#7f8c8d] uppercase tracking-widest">
              Showing {filtered.length} entries
            </span>
            <button 
              onClick={() => navigate(-1)}
              className="text-xs font-bold text-[#1a9e71] hover:underline"
            >
              Back to Client List
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
