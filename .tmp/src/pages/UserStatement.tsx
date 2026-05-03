
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Transaction, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { ChevronLeft, Loader2, ReceiptText, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";

export default function UserStatement() {
  const navigate = useNavigate();
  const session = getClientSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: transactions, isLoading: transLoading } = useQuery({
    queryKey: ["user-transactions", session?.username],
    queryFn: () => Transaction.filter({ client_username: session?.username }),
    enabled: !!session?.username,
  });

  const { data: clientData } = useQuery({
    queryKey: ["client-profile", session?.username],
    queryFn: async () => {
      const clients = await Client.filter({ username: session?.username });
      return clients?.[0];
    },
    enabled: !!session?.username,
  });

  if (!session) {
    navigate("/login");
    return null;
  }

  const sortedTransactions = (transactions || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-[#d6e4f0] text-[#1e3a5c]">
      <UserHeader
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="max-w-4xl mx-auto px-3 py-4 pb-12">
        <button
          onClick={() => navigate("/play")}
          className="flex items-center gap-1 text-[#1e3a5c] mb-4 hover:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back to Dashboard</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1e3a5c] rounded-lg">
              <ReceiptText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Account Statement</h1>
          </div>

          <div className="bg-white rounded-xl p-3 px-5 shadow-sm border border-white/60 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Balance</span>
              <span className="text-lg font-black text-emerald-600">₹{(clientData?.cash || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Credit Limit</span>
              <span className="text-lg font-black text-[#1e3a5c]">₹{(clientData?.credit_received || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {transLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1e3a5c] animate-spin" />
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ReceiptText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No transactions found</h3>
            <p className="text-gray-500 text-sm mt-1">Your transaction history will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-white/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedTransactions.map((tx) => {
                    const isCredit = tx.amount > 0 || tx.type === 'credit';
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-[#1e3a5c]">
                            {format(new Date(tx.created_at), "MMM dd, yyyy")}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {format(new Date(tx.created_at), "hh:mm a")}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-[#1e3a5c] line-clamp-1">{tx.description || "System Transaction"}</p>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded mt-1 inline-block ${tx.type === 'cash' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {tx.amount >= 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ArrowDownLeft className="w-3 h-3 text-rose-500" />
                            )}
                            <span className={`text-sm font-black ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-[#1e3a5c]">
                          ₹{tx.after_balance?.toLocaleString("en-IN") || tx.before_balance?.toLocaleString("en-IN") || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
