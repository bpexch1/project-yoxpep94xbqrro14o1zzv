import { cn } from "@/lib/utils";
import "./cashCreditReference.css";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Client } from "@/entities";
import { manualWalletTransfer } from "@/lib/manualWallet";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { getClientSession, updateClientSessionBalance } from "@/hooks/useClientAuth";
import { verifyInHierarchy } from "@/lib/hierarchyCheck";

export default function CashCreditPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();

  const inFlight = useRef(false);
  const pendingRequest = useRef<{ fingerprint: string; id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'cash' | 'credit'>(() =>
    /\/(credit|cr)\//i.test(location.pathname) ? "credit" : "cash"
  );
  const [transferWarning, setTransferWarning] = useState("");
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
      setDepositDesc(`Cash payment to ${session?.username || "Upline"} from ${client.username}`);
      setWithdrawDesc(`Cash payment to ${client.username} from ${session?.username || "Upline"}`);
    } else {
      setDepositDesc(`Credit Issued to ${client.username}`);
      setWithdrawDesc(`Credit Withdrawn from ${client.username}`);
    }
    setDepositAmount('0');
    setWithdrawAmount('0');
    setTransferWarning('');
  }, [client?.username, activeTab, session?.username]);

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

  const submitTransfer = async (direction: "deposit" | "withdraw") => {
    if (!client || !session || inFlight.current) return;
    const amount = direction === "deposit" ? depositAmount : withdrawAmount;
    const description = direction === "deposit" ? depositDesc : withdrawDesc;
    const numericAmount = Number(amount);
    const allowedDeposit = activeTab === "cash"
      ? (adminClient ? Math.max(0, Number(adminClient.cash ?? 0)) : null)
      : (session.role?.toLowerCase() === "company" ? null
        : (adminClient ? Math.max(0, Number(adminClient.credit_remaining ?? 0)) : null));
    const allowedWithdraw = Math.max(0, Number(activeTab === "cash" ? client.cash : client.credit_remaining) || 0);
    if (!/^[0-9]+([.][0-9]{1,2})?$/.test(amount) || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setTransferWarning("Enter a valid amount greater than zero.");
      return;
    }
    if (direction === "deposit" && allowedDeposit !== null && numericAmount > allowedDeposit) {
      setTransferWarning(`Max ${activeTab} deposit is ${allowedDeposit.toLocaleString("en-IN")}`);
      setDepositAmount("0");
      return;
    }
    if (direction === "withdraw" && numericAmount > allowedWithdraw) {
      setTransferWarning(`Max ${activeTab} withdrawal is ${allowedWithdraw.toLocaleString("en-IN")}`);
      setWithdrawAmount("0");
      return;
    }
    setTransferWarning("");
    const fingerprint = JSON.stringify([client.id, activeTab, direction, amount, description]);
    if (pendingRequest.current?.fingerprint !== fingerprint) {
      pendingRequest.current = { fingerprint, id: crypto.randomUUID() };
    }
    inFlight.current = true;
    const setSubmitting = direction === "deposit" ? setIsSubmittingDeposit : setIsSubmittingWithdraw;
    setSubmitting(true);
    try {
      await manualWalletTransfer({
        clientId: client.id, wallet: activeTab, direction, amount, description,
        requestId: pendingRequest.current!.id,
      });
      pendingRequest.current = null;
      if (direction === "deposit") setDepositAmount("0");
      else setWithdrawAmount("0");
      toast({ title: "Success", description: `${activeTab === "cash" ? "Cash" : "Credit"} ${direction === "deposit" ? "deposited" : "withdrawn"} successfully.` });
      // A refresh failure must not turn a confirmed transfer into a failed transfer.
      await refreshAll().catch(() => undefined);
      navigate(`/accounts/ledger/${encodeURIComponent(client.username)}?wallet=${activeTab}`);
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Transfer Failed", description: err instanceof Error ? err.message : "Unable to confirm transfer. Retry with the same details." });
    } finally {
      setSubmitting(false);
      inFlight.current = false;
    }
  };
  const handleDeposit = () => submitTransfer("deposit");
  const handleWithdraw = () => submitTransfer("withdraw");

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
  const maxWithdraw = Math.max(0, clientCash);
  const adminCreditLimit = adminClient ? Number(adminClient.credit_remaining ?? 0) : 0;

  return (
    <div className="reference-cash min-h-screen bg-[rgb(228,229,230)] pb-16 text-[rgb(35,40,44)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <div className="wallet-reference-shell max-w-md mx-auto px-2 py-3">

        <div className="wallet-reference-summary">
        {/* Top 2 Flat Action Buttons: Cash & Credit */}
        <div className="wallet-reference-tabs flex gap-2.5 mb-3">
          <button
            type="button"
            onClick={() => { setActiveTab('cash'); setTransferWarning(''); }}
            className={cn(
              "flex-1 py-2 text-[0.875rem] font-bold rounded-[0.2rem] transition-colors shadow-sm text-center border",
              activeTab === 'cash'
                ? "bg-[#007bff] text-white border-[#007bff]"
                : "bg-white text-[#009678] border-[#009678] hover:bg-gray-50"
            )}
          >
            Cash
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('credit'); setTransferWarning(''); }}
            className={cn(
              "flex-1 py-2 text-[0.875rem] font-bold rounded-[0.2rem] transition-colors shadow-sm text-center border",
              activeTab === 'credit'
                ? "bg-[#007bff] text-white border-[#007bff]"
                : "bg-white text-[#009678] border-[#009678] hover:bg-gray-50"
            )}
          >
            Credit
          </button>
        </div>

        {transferWarning && (
          <div role="alert" className="wallet-reference-warning">{transferWarning}</div>
        )}
        {/* Username Header & 3-Column Info Table Box */}
        <div className="wallet-reference-account bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] p-3 mb-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="font-bold text-[1.1rem] text-[#23282c] mb-2.5">
            {client.username}
          </div>

          {activeTab === 'cash' ? (
            /* Cash Tab Header Table: Credit | Balance | Max Withdraw */
            <table className="wallet-reference-table table table-bordered table-sm mb-0 text-[0.875rem]">
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
            <table className="wallet-reference-table table table-bordered table-sm mb-0 text-[0.875rem]">
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

        </div>
        {/* DEPOSIT FORM BOX (Dark Teal Header #009678) */}
        <div className="wallet-reference-action bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden mb-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="bg-[#00b181] px-3.5 py-2 text-[0.875rem] text-white font-bold">
            {activeTab === 'cash'
              ? `Deposit Cash in ${client.username} Account`
              : `Deposit Credit in ${client.username} Account`}
          </div>

          <div className="cash-form-body p-3.5">
            {/* Description */}
            <div className="mb-3">
              <label className="block text-[0.875rem] text-[rgb(35,40,44)] font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                value={depositDesc}
                onChange={(e) => setDepositDesc(e.target.value)}
                className="w-full border border-[rgb(200,206,211)] rounded-[0.25rem] px-2.5 py-1.5 text-[0.875rem] text-[rgb(35,40,44)] outline-none focus:border-[#009678]"
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
            <div className="cash-form-footer flex justify-end">
              <button
                type="button"
                onClick={handleDeposit}
                disabled={isSubmittingDeposit || isSubmittingWithdraw}
                className="bg-[#00b181] hover:bg-[#007a62] text-white border border-[#009678] rounded-[0.2rem] px-5 py-1.5 text-[0.875rem] font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-75"
              >
                {isSubmittingDeposit ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* WITHDRAW FORM BOX (Red Header) */}
        <div className="wallet-reference-action bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="bg-[#c7254e] px-3.5 py-2 text-[0.875rem] text-white font-bold">
            {activeTab === 'cash'
              ? `Withdraw Cash from ${client.username} Account`
              : `Withdraw Credit from ${client.username}`}
          </div>

          <div className="cash-form-body p-3.5">
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
            <div className="cash-form-footer flex justify-end">
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isSubmittingDeposit || isSubmittingWithdraw}
                className="bg-[#c7254e] hover:bg-[#c82333] text-white border border-[#dc3545] rounded-[0.2rem] px-5 py-1.5 text-[0.875rem] font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-75"
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
