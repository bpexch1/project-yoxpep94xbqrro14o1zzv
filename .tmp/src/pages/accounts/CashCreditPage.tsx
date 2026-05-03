import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Client, Transaction } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getClientSession } from "@/hooks/useClientAuth";
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

  // Admin's own record to update balance bidirectional
  const { data: adminClients, refetch: refetchAdmin } = useQuery({
    queryKey: ["admin-own-record", session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username,
  });
  const adminClient = adminClients?.[0];

  const { data: transactions, isLoading: isFetchingTx, refetch: refetchTx } = useQuery({
    queryKey: ["transactions", username, activeTab],
    queryFn: () => Transaction.filter({ client_username: username, type: activeTab }, "-created_at", 50),
    enabled: !!username && isAuthorized === true,
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
    await refetchAdmin();
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["client", username] });
    queryClient.invalidateQueries({ queryKey: ["transactions", username] });
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
      let clientUpdateData: Record<string, number> = {};
      let afterBalance: number;
      let beforeBalance: number;

      if (activeTab === 'cash') {
        beforeBalance = client.cash || 0;
        afterBalance = beforeBalance + amount;
        const newBalanceUpline = (client.balance_upline || 0) + amount;
        const newCreditRemaining = (client.credit_remaining || 0) + amount;
        clientUpdateData = { cash: afterBalance, balance_upline: newBalanceUpline, credit_remaining: newCreditRemaining };
      } else {
        beforeBalance = client.credit_remaining || 0;
        afterBalance = beforeBalance + amount;
        clientUpdateData = {
          credit_received: (client.credit_received || 0) + amount,
          credit_remaining: afterBalance,
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
        after_balance: afterBalance,
      });

      await refreshAll();
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
        const newCreditRemaining = Math.max(0, (client.credit_remaining || 0) - amount);
        clientUpdateData = { cash: afterBalance, balance_upline: newBalanceUpline, credit_remaining: newCreditRemaining };
      } else {
        beforeBalance = client.credit_remaining || 0;
        afterBalance = Math.max(0, beforeBalance - amount);
        clientUpdateData = { credit_remaining: afterBalance };
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
        after_balance: afterBalance,
      });

      await refreshAll();
      setWithdrawAmount('0');
    } catch (err: any) {
      console.error('Withdraw error:', err);
      toast({ variant: "destructive", title: "Withdraw Failed", description: err?.message || "Please try again" });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  if (isAuthorized === null || isFetchingClient) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#16a085]" />
      </div>
    );
  }

  if (isAuthorized === false) return null;

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
    <div style={{ minHeight: "100vh", background: "#f0f0f0", fontFamily: "Roboto, sans-serif" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 5px" }}>
        
        {/* 1. TAB SWITCHER - full width flat buttons, no border-radius */}
        <div style={{ display: "flex", background: "#fff", marginBottom: "0" }}>
          <button 
            onClick={() => setActiveTab('cash')}
            style={{
              flex: 1, padding: "12px", fontSize: "14px", fontWeight: 700,
              background: activeTab === 'cash' ? "#3498db" : "#fff",
              color: activeTab === 'cash' ? "#fff" : "#16a085",
              border: "none", cursor: "pointer"
            }}
          >
            Cash
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            style={{
              flex: 1, padding: "12px", fontSize: "14px", fontWeight: 700,
              background: activeTab === 'credit' ? "#3498db" : "#fff",
              color: activeTab === 'credit' ? "#fff" : "#16a085",
              border: "none", cursor: "pointer"
            }}
          >
            Credit
          </button>
        </div>
        
        {/* 2. CLIENT NAME */}
        <div style={{ background: "#fff", padding: "16px 16px 8px", fontWeight: 700, fontSize: "15px", color: "#212529" }}>
          {client.username}
        </div>
        
        {/* 3. INFO TABLE: Credit | Balance | Max Withdraw */}
        <div style={{ background: "#fff", padding: "0 16px 16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #dee2e6", fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #dee2e6", padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#212529" }}>Credit</th>
                <th style={{ border: "1px solid #dee2e6", padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#212529" }}>Balance</th>
                <th style={{ border: "1px solid #dee2e6", padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#212529" }}>Max Withdraw</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #dee2e6", padding: "8px 12px", color: "#212529" }}>
                  {(client.credit_remaining || 0).toLocaleString()} Rs.
                </td>
                <td style={{ border: "1px solid #dee2e6", padding: "8px 12px", color: "#212529" }}>
                  {(client.cash || 0).toLocaleString()} Rs.
                </td>
                <td style={{ border: "1px solid #dee2e6", padding: "8px 12px", color: "#212529" }}>
                  {Math.max(0, client.cash || 0).toLocaleString()} Rs.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* 4. DEPOSIT SECTION */}
        <div style={{ background: "#fff", marginTop: "16px", border: "1px solid #dee2e6" }}>
          {/* Green header */}
          <div style={{ background: "#00b181", padding: "10px 16px", fontSize: "13px", color: "#fff", fontWeight: 700 }}>
            Deposit {activeTab === 'cash' ? 'Cash' : 'Credit'} in <strong>{client.username}</strong> account
          </div>
          {/* Form body */}
          <div style={{ padding: "16px" }}>
            {/* Description row */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ width: "100px", fontSize: "13px", color: "#212529" }}>Description</div>
              <input
                type="text"
                value={depositDesc}
                onChange={(e) => setDepositDesc(e.target.value)}
                style={{ flex: 1, border: "1px solid #ccc", borderRadius: "3px", padding: "5px 8px", fontSize: "13px", outline: "none" }}
              />
            </div>
            {/* Amount row */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ width: "100px", fontSize: "13px", color: "#212529" }}>Amount</div>
              <div style={{ display: "flex", alignItems: "center", flex: 1, border: "1px solid #ccc", borderRadius: "3px" }}>
                <span style={{ padding: "5px 8px", fontSize: "13px", color: "#555", background: "#f9f9f9", borderRight: "1px solid #ccc" }}>Rs.</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0"
                  style={{ flex: 1, border: "none", padding: "5px 8px", fontSize: "13px", outline: "none" }}
                />
              </div>
            </div>
            {/* Submit */}
            <button
              onClick={handleDeposit}
              disabled={isSubmittingDeposit}
              style={{
                background: "#00b181", color: "#fff", border: "none", borderRadius: "3px",
                padding: "6px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer"
              }}
            >
              {isSubmittingDeposit ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
        
        {/* 5. WITHDRAW SECTION */}
        <div style={{ background: "#fff", marginTop: "16px", border: "1px solid #dee2e6" }}>
          {/* Red header */}
          <div style={{ background: "#dd4b39", padding: "10px 16px", fontSize: "13px", color: "#fff", fontWeight: 700 }}>
            Withdraw {activeTab === 'cash' ? 'cash' : 'credit'} from <strong>{client.username}</strong> account
          </div>
          {/* Form body */}
          <div style={{ padding: "16px" }}>
            {/* Description row */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ width: "100px", fontSize: "13px", color: "#212529" }}>Description</div>
              <input
                type="text"
                value={withdrawDesc}
                onChange={(e) => setWithdrawDesc(e.target.value)}
                style={{ flex: 1, border: "1px solid #ccc", borderRadius: "3px", padding: "5px 8px", fontSize: "13px", outline: "none" }}
              />
            </div>
            {/* Amount row */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ width: "100px", fontSize: "13px", color: "#212529" }}>Amount</div>
              <div style={{ display: "flex", alignItems: "center", flex: 1, border: "1px solid #ccc", borderRadius: "3px" }}>
                <span style={{ padding: "5px 8px", fontSize: "13px", color: "#555", background: "#f9f9f9", borderRight: "1px solid #ccc" }}>Rs.</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="0"
                  style={{ flex: 1, border: "none", padding: "5px 8px", fontSize: "13px", outline: "none" }}
                />
              </div>
            </div>
            {/* Submit */}
            <button
              onClick={handleWithdraw}
              disabled={isSubmittingWithdraw}
              style={{
                background: "#dd4b39", color: "#fff", border: "none", borderRadius: "3px",
                padding: "6px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer"
              }}
            >
              {isSubmittingWithdraw ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        {/* BACK BUTTON */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "24px", paddingBottom: "40px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "#fff", color: "#2c3e50", border: "1px solid #dee2e6",
              padding: "8px 24px", fontSize: "13px", fontWeight: 700, borderRadius: "4px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <ChevronLeft style={{ width: "16px", height: "16px" }} />
            Back to Accounts
          </button>
        </div>
        
      </div>
    </div>
  );
}
