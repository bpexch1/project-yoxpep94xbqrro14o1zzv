import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Transaction, Client } from "@/entities";
import { 
  ChevronLeft, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
  Download
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
    return amount.toLocaleString('en-IN');
  };

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-12" style={arialFont}>
      <main className="max-w-[540px] mx-auto p-3">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-[10px] border border-[#d5d8dc] shadow-sm">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#333]" />
            </button>
            <div>
              <h1 className="text-[15px] font-bold text-[#333]">Ledger</h1>
              <p className="text-[11px] text-[#12b886] font-bold uppercase">
                {username}
              </p>
            </div>
          </div>
          <button className="p-2 text-[#12b886] hover:bg-gray-50 rounded-full transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex bg-white rounded-[10px] border border-[#d5d8dc] overflow-hidden mb-4 p-1 shadow-sm">
          {(['all', 'cash', 'credit'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "flex-1 h-9 text-[11px] font-bold uppercase tracking-widest transition-all rounded-[7px]",
                filterType === type
                  ? "bg-[#12b886] text-white"
                  : "text-[#7f8c8d] hover:bg-gray-50"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white p-3 rounded-[10px] border border-[#d5d8dc] shadow-sm text-center">
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-0.5">Deposits</p>
            <p className="text-[13px] font-bold text-[#12b886]">{formatAmount(summary.deposits)}</p>
          </div>
          <div className="bg-white p-3 rounded-[10px] border border-[#d5d8dc] shadow-sm text-center">
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-0.5">Withdraw</p>
            <p className="text-[13px] font-bold text-[#e74c3c]">{formatAmount(summary.withdrawals)}</p>
          </div>
          <div className="bg-white p-3 rounded-[10px] border border-[#d5d8dc] shadow-sm text-center">
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-0.5">Net</p>
            <p className={cn("text-[13px] font-bold", netBalance >= 0 ? "text-blue-600" : "text-[#e74c3c]")}>
              {formatAmount(netBalance)}
            </p>
          </div>
        </div>

        {/* Ledger Table Card */}
        <div className="bg-white rounded-[10px] border border-[#d5d8dc] overflow-hidden shadow-sm">
          <div className="px-3 py-2 bg-[#ecf0f1] border-b border-[#d5d8dc] flex items-center justify-between">
            <h3 className="font-bold text-[#333] text-[13px]">Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-[#f5f5f5] border-b border-[#d0d0d0]">
                  <th className="px-2 py-2 font-bold text-[#333] border-r border-[#d0d0d0]">Date</th>
                  <th className="px-2 py-2 font-bold text-[#333] border-r border-[#d0d0d0]">Desc</th>
                  <th className="px-2 py-2 font-bold text-[#12b886] text-right border-r border-[#d0d0d0]">Dep</th>
                  <th className="px-2 py-2 font-bold text-[#e74c3c] text-right">With</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="px-3 py-10 text-center bg-white"><Loader2 className="w-6 h-6 animate-spin text-[#12b886] mx-auto" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-10 text-center text-gray-400 bg-white">No history found</td></tr>
                ) : (
                  filtered.map((tx, idx) => (
                    <tr key={tx.id} className={cn("border-b border-[#d0d0d0] h-[34px]", idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]")}>
                      <td className="px-2 py-1 text-[#333] border-r border-[#d0d0d0]">{formatDate(tx.created_at)}</td>
                      <td className="px-2 py-1 text-[#333] border-r border-[#d0d0d0] font-bold truncate max-w-[80px]">{tx.description}</td>
                      <td className="px-2 py-1 text-[#12b886] font-bold text-right border-r border-[#d0d0d0]">{tx.amount > 0 ? tx.amount.toLocaleString() : "—"}</td>
                      <td className="px-2 py-1 text-[#e74c3c] font-bold text-right">{tx.amount < 0 ? Math.abs(tx.amount).toLocaleString() : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-[#f5f5f5] px-3 py-2 border-t border-[#d0d0d0] flex justify-between items-center">
            <span className="text-[10px] font-bold text-[#333]">
              Entries: {filtered.length}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
