import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransactionHistoryModal } from "./TransactionHistoryModal";
import { Client, Transaction } from "@/entities";
import { getClientSession } from "@/hooks/useClientAuth";

interface CashCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any | null;
}

export function CashCreditModal({ isOpen, onClose, client }: CashCreditModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();
  
  const [activeTab, setActiveTab] = useState<'cash' | 'credit'>('cash');
  const [showHistory, setShowHistory] = useState(false);
  
  const [depositDesc, setDepositDesc] = useState('');
  const [depositAmount, setDepositAmount] = useState('0');
  const [withdrawDesc, setWithdrawDesc] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('0');
  
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Fetch admin's own record to update balance bidirectional
  const { data: adminClients, refetch: refetchAdmin } = useQuery({
    queryKey: ["admin-own-record", session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username && isOpen,
  });
  const adminClient = adminClients?.[0];

  useEffect(() => {
    if (!client) return;
    setShowHistory(false);
    if (activeTab === 'cash') {
      setDepositDesc(`Cash payment to Book7801 from ${client.username}`);
      setWithdrawDesc(`Cash payment to ${client.username} from Book7801`);
    } else {
      setDepositDesc(`Credit Issued to ${client.username}`);
      setWithdrawDesc(`Credit Withdrawn from ${client.username}`);
    }
    setDepositAmount('0');
    setWithdrawAmount('0');
  }, [client?.username, activeTab, isOpen]);

  const refreshAll = async () => {
    await refetchAdmin();
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["client", client?.username] });
    queryClient.invalidateQueries({ queryKey: ["transactions", client?.username] });
    queryClient.invalidateQueries({ queryKey: ["admin-own-record"] });
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
      const beforeCash = client.cash || 0;
      const beforeCreditReceived = client.credit_received || 0;
      const beforeCreditRemaining = client.credit_remaining || 0;

      let newBalance: number;
      let clientUpdateData: Record<string, number> = {};
      let beforeBalance: number;

      if (activeTab === 'cash') {
        beforeBalance = beforeCash;
        newBalance = beforeCash + amount;
        const newBalanceUpline = (client.balance_upline || 0) + amount;
        const newCreditRemaining = (client.credit_remaining || 0) + amount;
        clientUpdateData = { cash: newBalance, balance_upline: newBalanceUpline, credit_remaining: newCreditRemaining };
      } else {
        beforeBalance = beforeCreditRemaining;
        newBalance = beforeCreditRemaining + amount;
        clientUpdateData = {
          credit_received: beforeCreditReceived + amount,
          credit_remaining: newBalance,
        };
      }

      await Client.update(client.id, clientUpdateData);

      // BIDIRECTIONAL: Update Admin's balance
      if (adminClient) {
        if (activeTab === 'cash') {
          await Client.update(adminClient.id, { 
            cash: (adminClient.cash || 0) - amount 
          });
        } else {
          await Client.update(adminClient.id, { 
            credit_remaining: Math.max(0, (adminClient.credit_remaining || 0) - amount) 
          });
        }
      }

      await Transaction.create({
        client_username: client.username,
        type: activeTab,
        amount: amount,
        description: depositDesc,
        before_balance: beforeBalance,
        after_balance: newBalance,
      });

      await refreshAll();
      toast({ title: "Deposit Successful ✓", description: `${amount.toLocaleString()} Rs. deposited to ${client.username}` });
      setDepositAmount('0');
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error('Deposit error:', err);
      const msg = err?.message || '';
      if (msg.includes('Authentication') || msg.includes('auth') || msg.includes('token') || msg.includes('JWT')) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please refresh the page and try again" });
      } else {
        toast({ variant: "destructive", title: "Deposit Failed", description: msg || "Please try again" });
      }
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
    const availableBalance = activeTab === 'cash' ? (client.cash || 0) : (client.credit_remaining || 0);
    if (amount > availableBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `Available: ${availableBalance.toLocaleString()} Rs. | Requested: ${amount.toLocaleString()} Rs.`,
      });
      return;
    }
    
    setIsSubmittingWithdraw(true);
    try {
      const beforeCash = client.cash || 0;
      const beforeCreditRemaining = client.credit_remaining || 0;

      let newBalance: number;
      let clientUpdateData: Record<string, number> = {};
      let beforeBalance: number;

      if (activeTab === 'cash') {
        beforeBalance = beforeCash;
        newBalance = Math.max(0, beforeCash - amount);
        const newBalanceUpline = Math.max(0, (client.balance_upline || 0) - amount);
        const newCreditRemaining = Math.max(0, (client.credit_remaining || 0) - amount);
        clientUpdateData = { cash: newBalance, balance_upline: newBalanceUpline, credit_remaining: newCreditRemaining };
      } else {
        beforeBalance = beforeCreditRemaining;
        newBalance = Math.max(0, beforeCreditRemaining - amount);
        clientUpdateData = { credit_remaining: newBalance };
      }

      await Client.update(client.id, clientUpdateData);

      // BIDIRECTIONAL: Update Admin's balance
      if (adminClient) {
        if (activeTab === 'cash') {
          await Client.update(adminClient.id, { 
            cash: (adminClient.cash || 0) + amount 
          });
        } else {
          await Client.update(adminClient.id, { 
            credit_remaining: (adminClient.credit_remaining || 0) + amount 
          });
        }
      }

      await Transaction.create({
        client_username: client.username,
        type: activeTab,
        amount: -amount,
        description: withdrawDesc,
        before_balance: beforeBalance,
        after_balance: newBalance,
      });

      await refreshAll();
      toast({ title: "Withdraw Successful ✓", description: `${amount.toLocaleString()} Rs. withdrawn from ${client.username}` });
      setWithdrawAmount('0');
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error('Withdraw error:', err);
      const msg = err?.message || '';
      if (msg.includes('Authentication') || msg.includes('auth') || msg.includes('token') || msg.includes('JWT')) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please refresh the page and try again" });
      } else {
        toast({ variant: "destructive", title: "Withdraw Failed", description: msg || "Please try again" });
      }
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-sm overflow-hidden border-0 shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Cash / Credit</DialogTitle>
        {/* TABS */}
        <div className="flex relative bg-white">
          <button
            onClick={() => setActiveTab('cash')}
            className={cn(
              "flex-1 py-3.5 text-base font-semibold transition-colors",
              activeTab === 'cash'
                ? "bg-[#3498db] text-white"
                : "bg-white text-[#16a085]"
            )}
          >
            Cash
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={cn(
              "flex-1 py-3.5 text-base font-semibold transition-colors",
              activeTab === 'credit'
                ? "bg-[#3498db] text-white"
                : "bg-white text-[#16a085]"
            )}
          >
            Credit
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 text-[#7f8c8d] hover:text-[#2c3e50] z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-px bg-[#d5d8dc]" />
        
        {/* CONTENT - scrollable */}
        <div className="bg-[#f4f6f7] max-h-[85vh] overflow-y-auto">
          
          {/* White card: client name + summary table */}
          <div className="bg-white p-4 mb-3 border-b border-[#d5d8dc]">
            <h2 className="text-xl font-bold text-[#2c3e50] mb-4">{client?.username}</h2>
            
            {/* Summary table */}
            <div className="border border-[#d5d8dc] rounded overflow-hidden text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white">
                    {activeTab === 'cash' ? (
                      <>
                        <th className="px-3 py-2 text-left text-[#2c3e50] font-medium border-r border-[#d5d8dc] w-1/3">Credit</th>
                        <th className="px-3 py-2 text-left text-[#2c3e50] font-medium border-r border-[#d5d8dc] w-1/3">Balance</th>
                        <th className="px-3 py-2 text-left text-[#2c3e50] font-medium w-1/3">Max Withdraw</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-2 text-left text-[#2c3e50] font-medium border-r border-[#d5d8dc] w-1/3">Credit limit</th>
                        <th className="px-3 py-2 text-left text-[#2c3e50] font-medium border-r border-[#d5d8dc] w-1/3">{client?.username} Credit</th>
                        <th className="px-3 py-2 text-left text-[#2c3e50] font-medium w-1/3">{client?.username} Available Balance</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="border-t border-[#d5d8dc]">
                  <tr className="bg-white">
                    {activeTab === 'cash' ? (
                      <>
                        <td 
                          className="px-3 py-2 font-bold border-r border-[#d5d8dc] text-[#212529] underline cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setShowHistory(true)}
                          title="Click to view transaction history"
                        >
                          {(client?.credit_remaining || 0).toLocaleString()} Rs.
                        </td>
                        <td 
                          className="px-3 py-2 font-bold border-r border-[#d5d8dc] text-[#212529] underline cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setShowHistory(true)}
                          title="Click to view transaction history"
                        >
                          {(client?.cash || 0).toLocaleString()} Rs.
                        </td>
                        <td 
                          className="px-3 py-2 font-bold text-[#212529] underline cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setShowHistory(true)}
                          title="Click to view transaction history"
                        >
                          {Math.max(0, client?.cash || 0).toLocaleString()} Rs.
                        </td>
                      </>
                    ) : (
                      <>
                        <td 
                          className="px-3 py-2 font-bold border-r border-[#d5d8dc] text-[#212529] underline cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setShowHistory(true)}
                          title="Click to view transaction history"
                        >
                          {(client?.credit_received || 0).toLocaleString()} Rs.
                        </td>
                        <td 
                          className="px-3 py-2 font-bold border-r border-[#d5d8dc] text-[#212529] underline cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setShowHistory(true)}
                          title="Click to view transaction history"
                        >
                          {(client?.credit_remaining || 0).toLocaleString()} Rs.
                        </td>
                        <td 
                          className="px-3 py-2 font-bold text-[#212529] underline cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setShowHistory(true)}
                          title="Click to view transaction history"
                        >
                          {(client?.credit_remaining || 0).toLocaleString()} Rs.
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#7f8c8d] mt-1 text-right">
              * Click on any amount to view transaction history
            </p>
          </div>
          
          {/* DEPOSIT SECTION */}
          <div className="mb-3 px-2">
            <div className="rounded overflow-hidden border border-[#d5d8dc]">
              {/* Green header */}
              <div className="bg-[#16a085] px-4 py-2.5">
                {activeTab === 'cash' ? (
                  <p className="text-white text-sm">
                    <span className="font-bold uppercase">Deposit</span> Cash in <span className="font-bold">{client?.username}</span> Account
                  </p>
                ) : (
                  <p className="text-white text-sm font-medium">
                    Deposit Credit in {client?.username} Account
                  </p>
                )}
              </div>
              {/* White form */}
              <div className="bg-white px-4 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2c3e50] mb-1.5">Description</label>
                  <input
                    type="text"
                    value={depositDesc}
                    onChange={(e) => setDepositDesc(e.target.value)}
                    className="w-full border border-[#d5d8dc] rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a085]/20 focus:border-[#16a085] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2c3e50] mb-1.5">Amount</label>
                  <div className="flex rounded overflow-hidden shadow-sm border border-[#d5d8dc] focus-within:ring-2 focus-within:ring-[#16a085]/20 focus-within:border-[#16a085] transition-all">
                    <span className="bg-[#ecf0f1] px-4 py-2.5 text-sm text-[#7f8c8d] border-r border-[#d5d8dc] flex items-center font-medium">Rs.</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleDeposit}
                    disabled={isSubmittingDeposit}
                    className="bg-[#16a085] hover:bg-[#138d75] text-white font-bold px-8 py-2 rounded shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {isSubmittingDeposit && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* WITHDRAW SECTION */}
          <div className="mb-6 px-2">
            <div className="rounded overflow-hidden border border-[#d5d8dc]">
              {/* Red header */}
              <div className="bg-[#e74c3c] px-4 py-2.5">
                {activeTab === 'cash' ? (
                  <p className="text-white text-sm">
                    <span className="font-bold uppercase">Withdraw</span> Cash from <span className="font-bold">{client?.username}</span> Account
                  </p>
                ) : (
                  <p className="text-white text-sm font-medium">
                    Withdraw Credit from {client?.username}
                  </p>
                )}
              </div>
              {/* White form */}
              <div className="bg-white px-4 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2c3e50] mb-1.5">Description</label>
                  <input
                    type="text"
                    value={withdrawDesc}
                    onChange={(e) => setWithdrawDesc(e.target.value)}
                    className="w-full border border-[#d5d8dc] rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e74c3c]/20 focus:border-[#e74c3c] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2c3e50] mb-1.5">Amount</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex rounded overflow-hidden shadow-sm border border-[#d5d8dc] focus-within:ring-2 focus-within:ring-[#e74c3c]/20 focus-within:border-[#e74c3c] transition-all">
                      <span className="bg-[#ecf0f1] px-4 py-2.5 text-sm text-[#7f8c8d] border-r border-[#d5d8dc] flex items-center font-medium">Rs.</span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                        min="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const available = activeTab === 'cash' ? (client?.cash || 0) : (client?.credit_remaining || 0);
                        setWithdrawAmount(Math.max(0, available).toString());
                      }}
                      className="px-3 bg-gray-100 hover:bg-gray-200 text-[#2c3e50] font-bold rounded text-xs uppercase transition-colors"
                    >
                      Max
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleWithdraw}
                    disabled={isSubmittingWithdraw}
                    className="bg-[#e74c3c] hover:bg-red-600 text-white font-bold px-8 py-2 rounded shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {isSubmittingWithdraw && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* BACK BUTTON */}
          <div className="px-3 pb-5">
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-[#ecf0f1] hover:bg-[#d5d8dc] text-[#2c3e50] font-semibold px-5 py-2.5 rounded transition-colors active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          
        </div>
        <TransactionHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          client={client}
          filterType={activeTab}
        />
      </DialogContent>
    </Dialog>
  );
}
