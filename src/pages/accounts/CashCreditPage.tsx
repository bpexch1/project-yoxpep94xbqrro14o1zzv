import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Client, Transaction } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  Loader2, 
  ArrowUpCircle, 
  ArrowDownCircle,
  History,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CashCreditPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'cash' | 'credit'>('cash');
  const [depositDesc, setDepositDesc] = useState('');
  const [depositAmount, setDepositAmount] = useState('0');
  const [withdrawDesc, setWithdrawDesc] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('0');
  
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const { data: clients, isLoading: isFetchingClient, refetch: refetchClient } = useQuery({
    queryKey: ["client", username],
    queryFn: () => Client.filter({ username }),
    enabled: !!username,
  });

  const client = clients?.[0];

  const { data: transactions, isLoading: isFetchingTx, refetch: refetchTx } = useQuery({
    queryKey: ["transactions", username, activeTab],
    queryFn: () => Transaction.filter({ client_username: username, type: activeTab }, "-created_at", 50),
    enabled: !!username,
  });

  useEffect(() => {
    if (!client) return;
    if (activeTab === 'cash') {
      setDepositDesc(`Cash payment to Book from ${client.username}`);
      setWithdrawDesc(`Cash payment to ${client.username} from Book`);
    } else {
      setDepositDesc(`Credit Issued to ${client.username}`);
      setWithdrawDesc(`Credit Withdrawn from ${client.username}`);
    }
    setDepositAmount('0');
    setWithdrawAmount('0');
  }, [client?.username, activeTab]);

  const refreshAll = async () => {
    await refetchClient();
    await refetchTx();
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["client", username] });
    queryClient.invalidateQueries({ queryKey: ["transactions", username] });
  };

  const handleDeposit = async () => {
    if (!client) return;
    const amount = parseFloat(depositAmount) || 0;
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Enter an amount greater than 0" });
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      let clientUpdateData: Record<string, number> = {};
      let afterBalance: number;
      let beforeBalance: number;

      if (activeTab === 'cash') {
        beforeBalance = client.cash || 0;
        afterBalance = beforeBalance + amount;
        const newBalanceUpline = (client.balance_upline || 0) + amount;
        clientUpdateData = { cash: afterBalance, balance_upline: newBalanceUpline };
      } else {
        beforeBalance = client.credit_remaining || 0;
        afterBalance = beforeBalance + amount;
        clientUpdateData = {
          credit_received: (client.credit_received || 0) + amount,
          credit_remaining: afterBalance,
        };
      }

      await Client.update(client.id, clientUpdateData);
      await Transaction.create({
        client_username: client.username,
        type: activeTab,
        amount: amount,
        description: depositDesc,
        before_balance: beforeBalance,
        after_balance: afterBalance,
      });

      await refreshAll();
      toast({ title: "Deposit Successful ✓", description: `${amount.toLocaleString()} Rs. deposited to ${client.username}` });
      setDepositAmount('0');
    } catch (err: any) {
      console.error('Deposit error:', err);
      toast({ variant: "destructive", title: "Deposit Failed", description: err?.message || "Please try again" });
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleWithdraw = async () => {
    if (!client) return;
    const amount = parseFloat(withdrawAmount) || 0;
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Enter an amount greater than 0" });
      return;
    }

    // Insufficient balance check
    if (activeTab === 'cash' && amount > (client.cash || 0)) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: `Available: ${(client.cash || 0).toLocaleString()} Rs.` });
      return;
    }
    if (activeTab === 'credit' && amount > (client.credit_remaining || 0)) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: `Available: ${(client.credit_remaining || 0).toLocaleString()} Rs.` });
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      let clientUpdateData: Record<string, number> = {};
      let afterBalance: number;
      let beforeBalance: number;

      if (activeTab === 'cash') {
        beforeBalance = client.cash || 0;
        afterBalance = Math.max(0, beforeBalance - amount);
        const newBalanceUpline = Math.max(0, (client.balance_upline || 0) - amount);
        clientUpdateData = { cash: afterBalance, balance_upline: newBalanceUpline };
      } else {
        beforeBalance = client.credit_remaining || 0;
        afterBalance = Math.max(0, beforeBalance - amount);
        clientUpdateData = { credit_remaining: afterBalance };
      }

      await Client.update(client.id, clientUpdateData);
      await Transaction.create({
        client_username: client.username,
        type: activeTab,
        amount: -amount,
        description: withdrawDesc,
        before_balance: beforeBalance,
        after_balance: afterBalance,
      });

      await refreshAll();
      toast({ title: "Withdraw Successful ✓", description: `${amount.toLocaleString()} Rs. withdrawn from ${client.username}` });
      setWithdrawAmount('0');
    } catch (err: any) {
      console.error('Withdraw error:', err);
      toast({ variant: "destructive", title: "Withdraw Failed", description: err?.message || "Please try again" });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  if (isFetchingClient) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#16a085]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Client not found</h1>
        <button onClick={() => navigate(-1)} className="bg-white border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
          <ChevronLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-roboto pb-12">
      <main className="max-w-[720px] mx-auto p-4 lg:p-6">
        
        {/* TAB SWITCHER */}
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <button
            onClick={() => setActiveTab('cash')}
            className={cn(
              "flex-1 py-4 text-base font-bold transition-all",
              activeTab === 'cash'
                ? "bg-[#3498db] text-white shadow-inner"
                : "bg-white text-[#16a085] hover:bg-gray-50"
            )}
          >
            Cash
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={cn(
              "flex-1 py-4 text-base font-bold transition-all",
              activeTab === 'credit'
                ? "bg-[#3498db] text-white shadow-inner"
                : "bg-white text-[#16a085] hover:bg-gray-50"
            )}
          >
            Credit
          </button>
        </div>

        {/* CLIENT SUMMARY CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#2c3e50]">{client.username}</h2>
            <div className="px-3 py-1 bg-emerald-50 text-[#16a085] rounded-full text-xs font-bold uppercase tracking-wider">
              {activeTab} Mode
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-0 border border-[#d5d8dc] rounded-lg overflow-hidden text-center">
            <div className="bg-gray-50 py-3 border-r border-[#d5d8dc]">
              <p className="text-[10px] font-bold text-[#7f8c8d] uppercase mb-1">
                {activeTab === 'cash' ? 'Credit' : 'Credit Limit'}
              </p>
              <p className="text-sm font-bold text-[#16a085]">
                {(client?.credit_remaining || 0).toLocaleString()} Rs.
              </p>
            </div>
            <div className="bg-white py-3 border-r border-[#d5d8dc]">
              <p className="text-[10px] font-bold text-[#7f8c8d] uppercase mb-1">
                {activeTab === 'cash' ? 'Balance' : `${client.username} Credit`}
              </p>
              <p className="text-sm font-bold text-[#16a085]">
                {(activeTab === 'cash' ? client.cash : client.credit_remaining || 0).toLocaleString()} Rs.
              </p>
            </div>
            <div className="bg-gray-50 py-3">
              <p className="text-[10px] font-bold text-[#7f8c8d] uppercase mb-1">
                {activeTab === 'cash' ? 'Max Withdraw' : 'Available'}
              </p>
              <p className="text-sm font-bold text-[#16a085]">
                {Math.max(0, activeTab === 'cash' ? (client.cash || 0) : (client.credit_remaining || 0)).toLocaleString()} Rs.
              </p>
            </div>
          </div>
        </div>

        {/* DEPOSIT SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-[#16a085] px-6 py-3 flex items-center justify-between">
            <p className="text-white text-sm font-bold flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5" />
              DEPOSIT {activeTab.toUpperCase()}
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7f8c8d] uppercase mb-2">Description</label>
              <input
                type="text"
                value={depositDesc}
                onChange={(e) => setDepositDesc(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a085]/10 focus:border-[#16a085] transition-all bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#7f8c8d] uppercase mb-2">Amount (Rs.)</label>
              <div className="relative">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 pl-12 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#16a085]/10 focus:border-[#16a085] transition-all bg-gray-50"
                  min="0"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7f8c8d] font-bold">Rs.</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleDeposit}
                disabled={isSubmittingDeposit}
                className="bg-[#16a085] hover:bg-[#138d75] text-white font-bold px-10 py-3 rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
              >
                {isSubmittingDeposit && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Deposit
              </button>
            </div>
          </div>
        </div>

        {/* WITHDRAW SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-[#e74c3c] px-6 py-3 flex items-center justify-between">
            <p className="text-white text-sm font-bold flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5" />
              WITHDRAW {activeTab.toUpperCase()}
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7f8c8d] uppercase mb-2">Description</label>
              <input
                type="text"
                value={withdrawDesc}
                onChange={(e) => setWithdrawDesc(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e74c3c]/10 focus:border-[#e74c3c] transition-all bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#7f8c8d] uppercase mb-2">Amount (Rs.)</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 pl-12 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#e74c3c]/10 focus:border-[#e74c3c] transition-all bg-gray-50"
                    min="0"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7f8c8d] font-bold">Rs.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const available = activeTab === 'cash' ? (client?.cash || 0) : (client?.credit_remaining || 0);
                    setWithdrawAmount(Math.max(0, available).toString());
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#2c3e50] font-bold rounded-lg text-xs uppercase transition-colors whitespace-nowrap"
                >
                  Max
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleWithdraw}
                disabled={isSubmittingWithdraw}
                className="bg-[#e74c3c] hover:bg-red-600 text-white font-bold px-10 py-3 rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
              >
                {isSubmittingWithdraw && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Withdrawal
              </button>
            </div>
          </div>
        </div>

        {/* RECENT TRANSACTIONS SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-[#2c3e50] flex items-center gap-2">
              <History className="w-5 h-5 text-[#16a085]" />
              Recent {activeTab} History
            </h3>
            <button 
              onClick={() => navigate(`/accounts/ledger/${username}`)}
              className="text-xs font-bold text-[#1a9e71] hover:underline"
            >
              View Full Ledger
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 font-bold text-[#7f8c8d] uppercase">Date</th>
                  <th className="px-6 py-3 font-bold text-[#7f8c8d] uppercase">Description</th>
                  <th className="px-6 py-3 font-bold text-[#7f8c8d] uppercase text-right">Amount</th>
                  <th className="px-6 py-3 font-bold text-[#7f8c8d] uppercase text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {isFetchingTx ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16a085] mx-auto" />
                    </td>
                  </tr>
                ) : transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium italic">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions?.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-[#7f8c8d] whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-6 py-3 font-medium text-[#2c3e50]">{tx.description}</td>
                      <td className={cn(
                        "px-6 py-3 font-bold text-right",
                        tx.amount >= 0 ? "text-[#16a085]" : "text-[#e74c3c]"
                      )}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 font-bold text-[#2c3e50] text-right">
                        {(tx.after_balance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BACK BUTTON */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-[#2c3e50] font-bold px-8 py-3 rounded-lg border border-gray-200 shadow-sm transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Accounts
          </button>
        </div>
          
      </main>
    </div>
  );
}
