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
  History
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

  const { data: clients, isLoading: isFetchingClient } = useQuery({
    queryKey: ["client", username],
    queryFn: () => Client.filter({ username }),
    enabled: !!username,
  });

  const client = clients?.[0];

  const { data: transactions, isLoading: isFetchingTx } = useQuery({
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
  }, [client, activeTab]);

  const handleDeposit = async () => {
    if (!client) return;
    const amount = parseFloat(depositAmount) || 0;
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Please enter an amount greater than 0" });
      return;
    }
    
    setIsSubmittingDeposit(true);
    try {
      if (activeTab === 'cash') {
        const before = client.cash || 0;
        await Transaction.create({
          client_username: client.username,
          type: 'cash',
          amount: amount,
          description: depositDesc,
          before_balance: before,
          after_balance: before + amount,
        });
        await Client.update(client.id, { cash: before + amount });
      } else {
        const beforeRec = client.credit_received || 0;
        const beforeRem = client.credit_remaining || 0;
        await Transaction.create({
          client_username: client.username,
          type: 'credit',
          amount: amount,
          description: depositDesc,
          before_balance: beforeRem,
          after_balance: beforeRem + amount,
        });
        await Client.update(client.id, {
          credit_received: beforeRec + amount,
          credit_remaining: beforeRem + amount,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", username] });
      queryClient.invalidateQueries({ queryKey: ["transactions", username] });
      toast({ title: "Deposit Successful", description: `${amount} Rs. deposited to ${client.username}` });
      setDepositAmount('0');
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Deposit Failed" });
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleWithdraw = async () => {
    if (!client) return;
    const amount = parseFloat(withdrawAmount) || 0;
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Please enter an amount greater than 0" });
      return;
    }
    
    setIsSubmittingWithdraw(true);
    try {
      if (activeTab === 'cash') {
        const before = client.cash || 0;
        await Transaction.create({
          client_username: client.username,
          type: 'cash',
          amount: -amount,
          description: withdrawDesc,
          before_balance: before,
          after_balance: before - amount,
        });
        await Client.update(client.id, { cash: before - amount });
      } else {
        const beforeRem = client.credit_remaining || 0;
        await Transaction.create({
          client_username: client.username,
          type: 'credit',
          amount: -amount,
          description: withdrawDesc,
          before_balance: beforeRem,
          after_balance: beforeRem - amount,
        });
        await Client.update(client.id, { credit_remaining: beforeRem - amount });
      }
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", username] });
      queryClient.invalidateQueries({ queryKey: ["transactions", username] });
      toast({ title: "Withdraw Successful", description: `${amount} Rs. withdrawn from ${client.username}` });
      setWithdrawAmount('0');
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Withdraw Failed" });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  if (isFetchingClient) {
    return (
      <div className="min-h-screen bg-[#ececec] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#12b886]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#ececec] flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-[#333] mb-4">Client not found</h1>
        <button onClick={() => navigate(-1)} className="bg-white border border-[#cccccc] px-4 h-10 rounded-[4px] flex items-center gap-2 font-bold text-[#333]">
          <ChevronLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ececec] pb-12" style={arialFont}>
      <main className="max-w-[420px] mx-auto p-3">
        
        {/* TAB SWITCHER */}
        <div className="flex bg-[#ececec] rounded-[6px] border border-[#d4d4d4] overflow-hidden mb-4 p-1">
          <button
            onClick={() => setActiveTab('cash')}
            className={cn(
              "flex-1 h-10 text-[14px] font-bold transition-all rounded-[4px]",
              activeTab === 'cash'
                ? "bg-[#12b886] text-white"
                : "bg-transparent text-[#333]"
            )}
          >
            Cash
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={cn(
              "flex-1 h-10 text-[14px] font-bold transition-all rounded-[4px]",
              activeTab === 'credit'
                ? "bg-[#12b886] text-white"
                : "bg-transparent text-[#333]"
            )}
          >
            Credit
          </button>
        </div>

        {/* CLIENT SUMMARY CARD */}
        <div className="bg-[#f3f3f3] rounded-[6px] border border-[#d4d4d4] overflow-hidden mb-4 shadow-none">
          <div className="bg-[#ececec] px-3 py-2 border-b border-[#d4d4d4] flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#333]">{client.username}</h2>
            <div className="text-[11px] font-bold text-[#12b886] uppercase">
              {activeTab} Mode
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-3 gap-0 border border-[#d0d0d0] rounded-[4px] overflow-hidden text-center bg-white">
              <div className="py-2 border-r border-[#d0d0d0]">
                <p className="text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                  {activeTab === 'cash' ? 'Credit' : 'Limit'}
                </p>
                <p className="text-[13px] font-bold text-[#333]">
                  {(client?.credit_remaining || 0).toLocaleString()}
                </p>
              </div>
              <div className="py-2 border-r border-[#d0d0d0]">
                <p className="text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                  {activeTab === 'cash' ? 'Balance' : 'Credit'}
                </p>
                <p className="text-[13px] font-bold text-[#12b886]">
                  {(activeTab === 'cash' ? client.cash : client.credit_remaining || 0).toLocaleString()}
                </p>
              </div>
              <div className="py-2">
                <p className="text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                  Available
                </p>
                <p className="text-[13px] font-bold text-[#12b886]">
                  {Math.max(0, activeTab === 'cash' ? (client.cash || 0) : (client.credit_remaining || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DEPOSIT SECTION */}
        <div className="bg-[#f3f3f3] border border-[#d4d4d4] rounded-[6px] overflow-hidden mb-4">
          <div className="bg-[#ececec] px-3 py-2 border-b border-[#d4d4d4] flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-[#12b886]" />
            <span className="text-[13px] font-bold text-[#333]">DEPOSIT {activeTab.toUpperCase()}</span>
          </div>
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Description</label>
              <input
                type="text"
                value={depositDesc}
                onChange={(e) => setDepositDesc(e.target.value)}
                className="w-full border border-[#cccccc] rounded-[4px] px-3 h-10 text-[13px] focus:outline-none focus:border-[#12b886] bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Amount (Rs.)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full border border-[#cccccc] rounded-[4px] px-3 h-10 text-[14px] font-bold focus:outline-none focus:border-[#12b886] bg-white"
                min="0"
              />
            </div>
            <button
              onClick={handleDeposit}
              disabled={isSubmittingDeposit}
              className="w-full bg-[#12b886] text-white font-bold h-10 rounded-[4px] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 shadow-none"
            >
              {isSubmittingDeposit && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Deposit
            </button>
          </div>
        </div>

        {/* WITHDRAW SECTION */}
        <div className="bg-[#f3f3f3] border border-[#d4d4d4] rounded-[6px] overflow-hidden mb-4">
          <div className="bg-[#ececec] px-3 py-2 border-b border-[#d4d4d4] flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-[#e74c3c]" />
            <span className="text-[13px] font-bold text-[#333]">WITHDRAW {activeTab.toUpperCase()}</span>
          </div>
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Description</label>
              <input
                type="text"
                value={withdrawDesc}
                onChange={(e) => setWithdrawDesc(e.target.value)}
                className="w-full border border-[#cccccc] rounded-[4px] px-3 h-10 text-[13px] focus:outline-none focus:border-[#e74c3c] bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Amount (Rs.)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full border border-[#cccccc] rounded-[4px] px-3 h-10 text-[14px] font-bold focus:outline-none focus:border-[#e74c3c] bg-white"
                min="0"
              />
            </div>
            <button
              onClick={handleWithdraw}
              disabled={isSubmittingWithdraw}
              className="w-full bg-[#e74c3c] text-white font-bold h-10 rounded-[4px] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 shadow-none"
            >
              {isSubmittingWithdraw && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Withdrawal
            </button>
          </div>
        </div>

        {/* RECENT HISTORY */}
        <div className="bg-[#f3f3f3] border border-[#d4d4d4] rounded-[6px] overflow-hidden mb-4">
          <div className="px-3 py-2 border-b border-[#d4d4d4] bg-[#ececec] flex items-center justify-between">
            <h3 className="font-bold text-[#333] text-[13px] flex items-center gap-2">
              <History className="w-4 h-4 text-[#12b886]" />
              {activeTab} History
            </h3>
            <button 
              onClick={() => navigate(`/accounts/ledger/${username}`)}
              className="text-[11px] font-bold text-[#12b886] hover:underline"
            >
              Ledger
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#e8e8e8] border-b border-[#d0d0d0]">
                  <th className="px-3 py-2 font-bold text-[#333] border-r border-[#d0d0d0]">Date</th>
                  <th className="px-3 py-2 font-bold text-[#333] border-r border-[#d0d0d0]">Desc</th>
                  <th className="px-3 py-2 font-bold text-[#333] text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {isFetchingTx ? (
                  <tr><td colSpan={3} className="px-3 py-8 text-center bg-white"><Loader2 className="w-5 h-5 animate-spin text-[#12b886] mx-auto" /></td></tr>
                ) : transactions?.length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-8 text-center text-gray-400 bg-white">No history found</td></tr>
                ) : (
                  transactions?.map((tx: any, idx) => (
                    <tr key={tx.id} className={cn(idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]", "border-b border-[#d0d0d0] h-[34px]")}>
                      <td className="px-3 py-1 text-[#333] border-r border-[#d0d0d0]">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-3 py-1 font-bold text-[#333] border-r border-[#d0d0d0] truncate max-w-[120px]">{tx.description}</td>
                      <td className={cn(
                        "px-3 py-1 font-bold text-right",
                        tx.amount >= 0 ? "text-[#12b886]" : "text-[#e74c3c]"
                      )}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="w-full flex items-center justify-center gap-2 bg-[#ececec] text-[#333] font-bold h-10 rounded-[4px] border border-[#cccccc] transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
          
      </main>
    </div>
  );
}
