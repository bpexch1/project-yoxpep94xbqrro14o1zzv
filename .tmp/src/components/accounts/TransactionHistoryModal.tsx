import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/entities";
import { X, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any | null;
  filterType?: 'cash' | 'credit' | 'all';
}

export function TransactionHistoryModal({
  isOpen,
  onClose,
  client,
  filterType = 'all'
}: TransactionHistoryModalProps) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", client?.username],
    queryFn: () => Transaction.filter({ client_username: client.username }, "-created_at", 100),
    enabled: isOpen && !!client?.username,
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-[#f4f6f7]">
        <DialogHeader className="bg-[#1a9e71] px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col">
            <DialogTitle className="text-white text-lg font-bold">
              {client?.username} — Settlement Ledger
            </DialogTitle>
            <p className="text-emerald-50 text-xs font-medium uppercase tracking-wider mt-0.5">
              {filterType === 'all' ? 'All Transactions' : `${filterType} Transactions`}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-[#d5d8dc] shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-emerald-50 rounded">
                  <TrendingUp className="w-3.5 h-3.5 text-[#1a9e71]" />
                </div>
                <span className="text-[10px] font-bold text-[#7f8c8d] uppercase">Deposits</span>
              </div>
              <p className="text-sm font-bold text-[#1a9e71]">{formatAmount(summary.deposits)}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-[#d5d8dc] shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-red-50 rounded">
                  <TrendingDown className="w-3.5 h-3.5 text-[#e74c3c]" />
                </div>
                <span className="text-[10px] font-bold text-[#7f8c8d] uppercase">Withdrawals</span>
              </div>
              <p className="text-sm font-bold text-[#e74c3c]">{formatAmount(summary.withdrawals)}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#d5d8dc] shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-blue-50 rounded">
                  <TrendingUp className={cn("w-3.5 h-3.5", netBalance >= 0 ? "text-blue-600" : "text-[#e74c3c]")} />
                </div>
                <span className="text-[10px] font-bold text-[#7f8c8d] uppercase">Net P/L</span>
              </div>
              <p className={cn("text-sm font-bold", netBalance >= 0 ? "text-blue-600" : "text-[#e74c3c]")}>
                {formatAmount(netBalance)}
              </p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-lg border border-[#d5d8dc] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#ecf0f1] border-b border-[#d5d8dc]">
                    <th className="px-3 py-2.5 font-bold text-[#2c3e50] border-r border-[#d5d8dc]">Date/Time</th>
                    <th className="px-3 py-2.5 font-bold text-[#2c3e50] border-r border-[#d5d8dc]">Description</th>
                    <th className="px-3 py-2.5 font-bold text-[#1a9e71] text-right border-r border-[#d5d8dc]">Deposit</th>
                    <th className="px-3 py-2.5 font-bold text-[#e74c3c] text-right border-r border-[#d5d8dc]">Withdrawal</th>
                    <th className="px-3 py-2.5 font-bold text-[#2c3e50] text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-[#7f8c8d]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#1a9e71]" />
                          <span className="font-medium">Loading ledger...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-[#7f8c8d] font-medium italic">
                        No transactions found for this period
                      </td>
                    </tr>
                  ) : (
                    filtered.map((tx, idx) => (
                      <tr 
                        key={tx.id} 
                        className={cn(
                          "border-b border-[#d5d8dc] last:border-0",
                          idx % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"
                        )}
                      >
                        <td className="px-3 py-2.5 text-[#2c3e50] border-r border-[#d5d8dc] whitespace-nowrap">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="px-3 py-2.5 text-[#2c3e50] border-r border-[#d5d8dc]">
                          {tx.description || "Settlement"}
                        </td>
                        <td className="px-3 py-2.5 text-[#1a9e71] font-bold text-right border-r border-[#d5d8dc]">
                          {tx.amount > 0 ? formatAmount(tx.amount) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-[#e74c3c] font-bold text-right border-r border-[#d5d8dc]">
                          {tx.amount < 0 ? formatAmount(Math.abs(tx.amount)) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-[#2c3e50] font-bold text-right">
                          {formatAmount(tx.after_balance || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-[#ecf0f1] px-3 py-2 text-[10px] font-bold text-[#7f8c8d] text-right border-t border-[#d5d8dc] uppercase tracking-wider">
              End of records
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
