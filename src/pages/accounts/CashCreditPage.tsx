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
    <div style={{ minHeight: "100vh", background: "#e8eff5", fontFamily: 'Roboto, system-ui, -apple-system, sans-serif', paddingBottom: 40 }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "8px 8px" }}>
        
        {/* Top 2 Flat Action Buttons: Cash & Credit */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button 
            type="button"
            onClick={() => setActiveTab('cash')}
            style={{
              flex: 1,
              padding: "9px 0",
              fontSize: 14,
              fontWeight: 700,
              backgroundColor: activeTab === 'cash' ? "#0088cc" : "#ffffff",
              color: activeTab === 'cash' ? "#ffffff" : "#27ae60",
              border: activeTab === 'cash' ? "1px solid #0088cc" : "1px solid #27ae60",
              borderRadius: 4,
              cursor: "pointer",
              textAlign: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            Cash
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credit')}
            style={{
              flex: 1,
              padding: "9px 0",
              fontSize: 14,
              fontWeight: 700,
              backgroundColor: activeTab === 'credit' ? "#0088cc" : "#ffffff",
              color: activeTab === 'credit' ? "#ffffff" : "#27ae60",
              border: activeTab === 'credit' ? "1px solid #0088cc" : "1px solid #27ae60",
              borderRadius: 4,
              cursor: "pointer",
              textAlign: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            Credit
          </button>
        </div>
        
        {/* Username Header & 3-Column Info Table Box */}
        <div style={{ background: "#ffffff", border: "1px solid #d5d8dc", borderRadius: 4, padding: "12px 14px 14px 14px", marginBottom: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#111827", marginBottom: 10 }}>
            {client.username}
          </div>
          
          {activeTab === 'cash' ? (
            /* Cash Tab Header Table: Credit | Balance | Max Withdraw */
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ border: "1px solid #e5e7eb", padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#374151", width: "33%" }}>Credit</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#374151", width: "33%" }}>Balance</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#374151", width: "34%" }}>Max Withdraw</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #e5e7eb", padding: "8px 8px", fontWeight: 700, color: "#111827" }}>
                    {clientCredit.toLocaleString()} Rs.
                  </td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "8px 8px", fontWeight: 700, color: "#111827" }}>
                    {clientTotalBalance.toLocaleString()} Rs.
                  </td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "8px 8px", fontWeight: 700, color: "#111827" }}>
                    {maxWithdraw.toLocaleString()} Rs.
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            /* Credit Tab Header Table: Credit limit | [Username] Credit | [Username] Available Balance */
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ border: "1px solid #e5e7eb", padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#374151", width: "30%", lineHeight: 1.2 }}>Credit limit</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#374151", width: "35%", lineHeight: 1.2 }}>{client.username} Credit</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#374151", width: "35%", lineHeight: 1.2 }}>{client.username} Available Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #e5e7eb", padding: "8px 8px", fontWeight: 700, color: "#111827" }}>
                    {adminCreditLimit.toLocaleString()} Rs.
                  </td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "8px 8px", fontWeight: 700, color: "#111827" }}>
                    {clientCredit.toLocaleString()} Rs.
                  </td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "8px 8px", fontWeight: 700, color: "#111827" }}>
                    {clientTotalBalance.toLocaleString()} Rs.
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        
        {/* DEPOSIT FORM BOX (Green Header) */}
        <div style={{ background: "#ffffff", border: "1px solid #d5d8dc", borderRadius: 4, overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ background: "#00a65a", padding: "9px 14px", fontSize: 13.5, color: "#ffffff", fontWeight: 700 }}>
            {activeTab === 'cash' 
              ? `Deposit Cash in ${client.username} account` 
              : `Deposit Credit in ${client.username} Account`}
          </div>
          
          <div style={{ padding: "14px" }}>
            {/* Description */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, color: "#374151", fontWeight: 500, marginBottom: 5 }}>
                Description
              </label>
              <input
                type="text"
                value={depositDesc}
                onChange={(e) => setDepositDesc(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 3,
                  padding: "7px 10px",
                  fontSize: 13.5,
                  outline: "none",
                  color: "#1f2937",
                  boxSizing: "border-box"
                }}
              />
            </div>
            
            {/* Amount */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, color: "#374151", fontWeight: 500, marginBottom: 5 }}>
                Amount
              </label>
              <div style={{ display: "flex", alignItems: "stretch", width: "100%", border: "1px solid #cbd5e1", borderRadius: 3, overflow: "hidden" }}>
                <span style={{ padding: "7px 12px", fontSize: 13, color: "#4b5563", background: "#f3f4f6", borderRight: "1px solid #cbd5e1", display: "flex", alignItems: "center" }}>
                  Rs.
                </span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0"
                  style={{
                    flex: 1,
                    border: "none",
                    padding: "7px 10px",
                    fontSize: 14,
                    fontWeight: 600,
                    outline: "none",
                    color: "#111827",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
            
            {/* Submit */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleDeposit}
                disabled={isSubmittingDeposit}
                style={{
                  background: "#00a65a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 3,
                  padding: "7px 22px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {isSubmittingDeposit ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* WITHDRAW FORM BOX (Red Header) */}
        <div style={{ background: "#ffffff", border: "1px solid #d5d8dc", borderRadius: 4, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ background: "#dd4b39", padding: "9px 14px", fontSize: 13.5, color: "#ffffff", fontWeight: 700 }}>
            {activeTab === 'cash' 
              ? `Withdraw cash from ${client.username} account` 
              : `Withdraw Credit from ${client.username}`}
          </div>
          
          <div style={{ padding: "14px" }}>
            {/* Description */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, color: "#374151", fontWeight: 500, marginBottom: 5 }}>
                Description
              </label>
              <input
                type="text"
                value={withdrawDesc}
                onChange={(e) => setWithdrawDesc(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 3,
                  padding: "7px 10px",
                  fontSize: 13.5,
                  outline: "none",
                  color: "#1f2937",
                  boxSizing: "border-box"
                }}
              />
            </div>
            
            {/* Amount */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, color: "#374151", fontWeight: 500, marginBottom: 5 }}>
                Amount
              </label>
              <div style={{ display: "flex", alignItems: "stretch", width: "100%", border: "1px solid #cbd5e1", borderRadius: 3, overflow: "hidden" }}>
                <span style={{ padding: "7px 12px", fontSize: 13, color: "#4b5563", background: "#f3f4f6", borderRight: "1px solid #cbd5e1", display: "flex", alignItems: "center" }}>
                  Rs.
                </span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="0"
                  style={{
                    flex: 1,
                    border: "none",
                    padding: "7px 10px",
                    fontSize: 14,
                    fontWeight: 600,
                    outline: "none",
                    color: "#111827",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
            
            {/* Submit */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isSubmittingWithdraw}
                style={{
                  background: "#dd4b39",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 3,
                  padding: "7px 22px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
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
