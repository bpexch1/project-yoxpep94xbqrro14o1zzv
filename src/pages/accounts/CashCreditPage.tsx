import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Client, Transaction } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { getClientSession, updateClientSessionBalance } from "@/hooks/useClientAuth";
import { verifyInHierarchy } from "@/lib/hierarchyCheck";

export default function CashCreditPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();
  
  const [activeTab, setActiveTab] = useState<'cash' | 'credit'>('cash');
  const [depositDesc, setDepositDesc] = useState('');
  const [depositAmount, setDepositAmount] = useState('0');
  const [withdrawDesc, setWithdrawDesc] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('0');
  
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }

    async function checkAuthorization() {
      if (!username) {
        setIsAuthorized(false);
        navigate("/accounts", { replace: true });
        return;
      }

      const authorized = await verifyInHierarchy(username, session!.username, session!.role);
      if (!authorized) {
        setIsAuthorized(false);
        navigate("/accounts", { replace: true });
      } else {
        setIsAuthorized(true);
      }
    }

    checkAuthorization();
  }, [session, navigate, username]);

  const { data: clients, isLoading: isFetchingClient, refetch: refetchClient } = useQuery({
    queryKey: ["client", username],
    queryFn: () => Client.filter({ username }),
    enabled: !!username && isAuthorized === true,
  });

  const client = clients?.[0];

  // Admin's own record to update balance bidirectional & show credit limit
  const { data: adminClients, refetch: refetchAdmin } = useQuery({
    queryKey: ["admin-own-record", session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username,
  });
  const adminClient = adminClients?.[0];

  useEffect(() => {
    if (!client) return;
    if (activeTab === 'cash') {
      setDepositDesc(`Cash deposit in ${client.username}`);
      setWithdrawDesc(`Cash withdrawn from ${client.username}`);
    } else {
      setDepositDesc(`Credit Issued to ${client.username}`);
      setWithdrawDesc(`Credit Withdrawn from ${client.username}`);
    }
    setDepositAmount('0');
    setWithdrawAmount('0');
  }, [client?.username, activeTab]);

  const refreshAll = async (updatedClientCash?: number) => {
    if (updatedClientCash !== undefined && client && session?.username === client.username) {
      updateClientSessionBalance(updatedClientCash);
    }
    window.dispatchEvent(new CustomEvent("balance-updated"));
    await Promise.all([
      refetchClient(),
      refetchAdmin(),
      queryClient.invalidateQueries({ queryKey: ["clients"] }),
      queryClient.invalidateQueries({ queryKey: ["client", username] }),
      queryClient.invalidateQueries({ queryKey: ["transactions", username] }),
      queryClient.invalidateQueries({ queryKey: ["admin-own-record"] }),
      queryClient.invalidateQueries({ queryKey: ["user-header-balance"] }),
      queryClient.invalidateQueries({ queryKey: ["header-balance"] }),
    ]);
  };

  const handleDeposit = async () => {
    if (!client) return;
    const amount = parseFloat(depositAmount) || 0;
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Enter an amount greater than 0" });
      return;
    }

    // Dealer Credit Limit Validation: Dealer cannot deposit more Cash or Credit than their remaining credit limit
    const isCompany = session?.role?.toLowerCase() === "company";
    if (!isCompany && adminClient) {
      const dealerRemainingCredit = Number(adminClient.credit_remaining || 0);
      if (amount > dealerRemainingCredit) {
        toast({
          variant: "destructive",
          title: "Credit Limit Exceeded",
          description: `Aapke pass sirf ${dealerRemainingCredit.toLocaleString()} Rs. credit limit remaining hai. Aap is se zyada Cash ya Credit deposit nahi kar sakte.`
        });
        return;
      }
    }

    setIsSubmittingDeposit(true);
    try {
      let clientUpdateData: Record<string, number> = {};
      let afterBalance: number;
      let beforeBalance: number;

      if (activeTab === 'cash') {
        beforeBalance = Number(client.cash || 0);
        afterBalance = beforeBalance + amount;
        clientUpdateData = { 
          cash: afterBalance,
          balance_upline: afterBalance,
        };
      } else {
        beforeBalance = Number(client.credit_remaining || 0);
        afterBalance = beforeBalance + amount;
        clientUpdateData = {
          credit_remaining: afterBalance,
          credit_received: Number(client.credit_received || 0) + amount,
        };
      }

      await Client.update(client.id, clientUpdateData);

      // BIDIRECTIONAL: Deduct from Dealer/Admin's remaining credit pool
      if (adminClient) {
        const dealerUpdate: Record<string, number> = {
          credit_remaining: Math.max(0, Number(adminClient.credit_remaining || 0) - amount),
        };
        if (activeTab === 'cash') {
          dealerUpdate.cash = Number(adminClient.cash || 0) - amount;
        }
        await Client.update(adminClient.id, dealerUpdate);
      }

      // Record transaction with clean format
      await Transaction.create({
        client_username: client.username,
        type: activeTab,
        amount: amount,
        description: activeTab === 'cash' 
          ? (depositDesc.includes('(Cash)') ? depositDesc : `${depositDesc} (Cash)`) 
          : (depositDesc.includes('(Credit)') ? depositDesc : `${depositDesc} (Credit)`),
        before_balance: beforeBalance,
        after_balance: afterBalance,
      });

      const newCash = activeTab === 'cash' ? afterBalance : Number(client.cash || 0);
      await refreshAll(newCash);
      setDepositAmount('0');
      toast({ title: "Success", description: `${activeTab === 'cash' ? 'Cash' : 'Credit'} deposited successfully.` });
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
    if (activeTab === 'cash' && amount > Number(client.cash || 0) + Number(client.credit_remaining || 0)) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: `Available: ${(Number(client.cash || 0) + Number(client.credit_remaining || 0)).toLocaleString()} Rs.` });
      return;
    }
    if (activeTab === 'credit' && amount > Number(client.credit_remaining || 0)) {
      toast({ variant: "destructive", title: "Insufficient Credit", description: `Available Credit: ${Number(client.credit_remaining || 0).toLocaleString()} Rs.` });
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      let clientUpdateData: Record<string, number> = {};
      let afterBalance: number;
      let beforeBalance: number;

      if (activeTab === 'cash') {
        beforeBalance = Number(client.cash || 0);
        afterBalance = beforeBalance - amount;
        clientUpdateData = { 
          cash: afterBalance,
          balance_upline: afterBalance,
        };
      } else {
        beforeBalance = Number(client.credit_remaining || 0);
        afterBalance = Math.max(0, beforeBalance - amount);
        clientUpdateData = { 
          credit_remaining: afterBalance,
          credit_received: Math.max(0, Number(client.credit_received || 0) - amount),
        };
      }

      await Client.update(client.id, clientUpdateData);

      // BIDIRECTIONAL: Restore Dealer/Admin's remaining credit pool
      if (adminClient) {
        const dealerUpdate: Record<string, number> = {
          credit_remaining: Number(adminClient.credit_remaining || 0) + amount,
        };
        if (activeTab === 'cash') {
          dealerUpdate.cash = Number(adminClient.cash || 0) + amount;
        }
        await Client.update(adminClient.id, dealerUpdate);
      }

      // Record transaction with clean format
      await Transaction.create({
        client_username: client.username,
        type: activeTab,
        amount: -amount,
        description: activeTab === 'cash'
          ? (withdrawDesc.includes('(Cash)') ? withdrawDesc : `${withdrawDesc} (Cash)`)
          : (withdrawDesc.includes('(Credit)') ? withdrawDesc : `${withdrawDesc} (Credit)`),
        before_balance: beforeBalance,
        after_balance: afterBalance,
      });

      const newCash = activeTab === 'cash' ? afterBalance : Number(client.cash || 0);
      await refreshAll(newCash);
      setWithdrawAmount('0');
      toast({ title: "Success", description: `${activeTab === 'cash' ? 'Cash' : 'Credit'} withdrawn successfully.` });
    } catch (err: any) {
      console.error('Withdraw error:', err);
      toast({ variant: "destructive", title: "Withdraw Failed", description: err?.message || "Please try again" });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  if (isAuthorized === null || isFetchingClient) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 32, height: 32, animation: "spin 1s linear infinite", color: "#00a65a" }} />
      </div>
    );
  }

  if (isAuthorized === false) return null;

  if (!client) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f0f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#212529", marginBottom: 12 }}>Client not found</h1>
        <button onClick={() => navigate("/accounts")} style={{ background: "#fff", border: "1px solid #ccc", padding: "6px 16px", borderRadius: 3, fontWeight: 600, cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    );
  }

  const clientCredit = Number(client.credit_remaining ?? 0);
  const clientCash = Number(client.cash ?? 0);
  const clientPL = Number(client.pl_downline ?? 0);
  const clientTotalBalance = clientCredit + clientCash + clientPL;
  const maxWithdraw = clientTotalBalance;
  const adminCreditLimit = adminClient ? Number(adminClient.credit_remaining ?? 0) : 54727;

  return (
    <div className="min-h-screen bg-[rgb(228,229,230)] pb-16 text-[rgb(35,40,44)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <div className="max-w-md mx-auto px-2 py-3">
        
        {/* Top 2 Flat Action Buttons: Cash & Credit */}
        <div className="flex gap-2.5 mb-3">
          <button 
            type="button"
            onClick={() => setActiveTab('cash')}
            className={cn(
              "flex-1 py-2 text-[0.875rem] font-bold rounded-[0.2rem] transition-colors shadow-sm text-center border",
              activeTab === 'cash' 
                ? "bg-[#0088cc] text-white border-[#0088cc]" 
                : "bg-white text-[#00b98a] border-[#00b98a] hover:bg-gray-50"
            )}
          >
            Cash
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credit')}
            className={cn(
              "flex-1 py-2 text-[0.875rem] font-bold rounded-[0.2rem] transition-colors shadow-sm text-center border",
              activeTab === 'credit' 
                ? "bg-[#0088cc] text-white border-[#0088cc]" 
                : "bg-white text-[#00b98a] border-[#00b98a] hover:bg-gray-50"
            )}
          >
            Credit
          </button>
        </div>
        
        {/* Username Header & 3-Column Info Table Box */}
        <div className="bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] p-3 mb-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="font-bold text-[1rem] text-[rgb(35,40,44)] mb-2.5">
            {client.username}
          </div>
          
          {activeTab === 'cash' ? (
            /* Cash Tab Header Table: Credit | Balance | Max Withdraw */
            <table className="table table-bordered table-sm mb-0 text-[0.875rem]">
              <thead>
                <tr className="bg-[#f0f3f5] text-[rgb(35,40,44)]">
                  <th className="border border-[rgb(200,206,211)] p-1.5 text-left font-bold w-1/3">Credit</th>
                  <th className="border border-[rgb(200,206,211)] p-1.5 text-left font-bold w-1/3">Balance</th>
                  <th className="border border-[rgb(200,206,211)] p-1.5 text-left font-bold w-1/3">Max Withdraw</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white font-bold text-[rgb(35,40,44)]">
                  <td className="border border-[rgb(200,206,211)] p-2">
                    {clientCredit.toLocaleString()} Rs.
                  </td>
                  <td className="border border-[rgb(200,206,211)] p-2">
                    {clientTotalBalance.toLocaleString()} Rs.
                  </td>
                  <td className="border border-[rgb(200,206,211)] p-2">
                    {maxWithdraw.toLocaleString()} Rs.
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            /* Credit Tab Header Table: Credit limit | [Username] Credit | [Username] Available Balance */
            <table className="table table-bordered table-sm mb-0 text-[0.875rem]">
              <thead>
                <tr className="bg-[#f0f3f5] text-[rgb(35,40,44)]">
                  <th className="border border-[rgb(200,206,211)] p-1.5 text-left font-bold w-[30%] leading-tight">Credit limit</th>
                  <th className="border border-[rgb(200,206,211)] p-1.5 text-left font-bold w-[35%] leading-tight">{client.username} Credit</th>
                  <th className="border border-[rgb(200,206,211)] p-1.5 text-left font-bold w-[35%] leading-tight">{client.username} Available Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white font-bold text-[rgb(35,40,44)]">
                  <td className="border border-[rgb(200,206,211)] p-2">
                    {adminCreditLimit.toLocaleString()} Rs.
                  </td>
                  <td className="border border-[rgb(200,206,211)] p-2">
                    {clientCredit.toLocaleString()} Rs.
                  </td>
                  <td className="border border-[rgb(200,206,211)] p-2">
                    {clientTotalBalance.toLocaleString()} Rs.
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        
        {/* DEPOSIT FORM BOX (Green Header) */}
        <div className="bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden mb-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="bg-[#00b98a] px-3.5 py-2 text-[0.875rem] text-white font-bold">
            {activeTab === 'cash' 
              ? `Deposit Cash in ${client.username} account` 
              : `Deposit Credit in ${client.username} Account`}
          </div>
          
          <div className="p-3.5">
            {/* Description */}
            <div className="mb-3">
              <label className="block text-[0.875rem] text-[rgb(35,40,44)] font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                value={depositDesc}
                onChange={(e) => setDepositDesc(e.target.value)}
                className="w-full border border-[rgb(200,206,211)] rounded-[0.25rem] px-2.5 py-1.5 text-[0.875rem] text-[rgb(35,40,44)] outline-none focus:border-[#00b98a]"
              />
            </div>
            
            {/* Amount */}
            <div className="mb-3.5">
              <label className="block text-[0.875rem] text-[rgb(35,40,44)] font-medium mb-1">
                Amount
              </label>
              <div className="flex items-stretch w-full border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden">
                <span className="px-3 py-1.5 text-[0.875rem] text-[#6c757d] bg-[#f0f3f5] border-r border-[rgb(200,206,211)] flex items-center">
                  Rs.
                </span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0"
                  className="flex-1 border-0 px-2.5 py-1.5 text-[0.875rem] font-bold text-[rgb(35,40,44)] outline-none"
                />
              </div>
            </div>
            
            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDeposit}
                disabled={isSubmittingDeposit}
                className="bg-[#00b98a] hover:bg-[#138a72] text-white border border-[#00b98a] rounded-[0.2rem] px-5 py-1.5 text-[0.875rem] font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-75"
              >
                {isSubmittingDeposit ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* WITHDRAW FORM BOX (Red Header) */}
        <div className="bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="bg-[#dc3545] px-3.5 py-2 text-[0.875rem] text-white font-bold">
            {activeTab === 'cash' 
              ? `Withdraw cash from ${client.username} account` 
              : `Withdraw Credit from ${client.username}`}
          </div>
          
          <div className="p-3.5">
            {/* Description */}
            <div className="mb-3">
              <label className="block text-[0.875rem] text-[rgb(35,40,44)] font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                value={withdrawDesc}
                onChange={(e) => setWithdrawDesc(e.target.value)}
                className="w-full border border-[rgb(200,206,211)] rounded-[0.25rem] px-2.5 py-1.5 text-[0.875rem] text-[rgb(35,40,44)] outline-none focus:border-[#00b98a]"
              />
            </div>
            
            {/* Amount */}
            <div className="mb-3.5">
              <label className="block text-[0.875rem] text-[rgb(35,40,44)] font-medium mb-1">
                Amount
              </label>
              <div className="flex items-stretch w-full border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden">
                <span className="px-3 py-1.5 text-[0.875rem] text-[#6c757d] bg-[#f0f3f5] border-r border-[rgb(200,206,211)] flex items-center">
                  Rs.
                </span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="0"
                  className="flex-1 border-0 px-2.5 py-1.5 text-[0.875rem] font-bold text-[rgb(35,40,44)] outline-none"
                />
              </div>
            </div>
            
            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isSubmittingWithdraw}
                className="bg-[#dc3545] hover:bg-[#c82333] text-white border border-[#dc3545] rounded-[0.2rem] px-5 py-1.5 text-[0.875rem] font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-75"
              >
                {isSubmittingWithdraw ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
