import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransactionHistoryModal } from "./TransactionHistoryModal";
import { Client } from "@/entities";
import { manualWalletTransfer } from "@/lib/manualWallet";
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

  const [operatorPassword, setOperatorPassword] = useState("");
  const inFlight = useRef(false);
  const pendingRequest = useRef<{ fingerprint: string; id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"cash" | "credit">("cash");
  const [showHistory, setShowHistory] = useState(false);

  const [depositDesc, setDepositDesc] = useState("");
  const [depositAmount, setDepositAmount] = useState("0");
  const [withdrawDesc, setWithdrawDesc] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("0");

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
    setOperatorPassword("");
    if (activeTab === "cash") {
      setDepositDesc(`Cash deposit in ${client.username}`);
      setWithdrawDesc(`Cash withdrawn from ${client.username}`);
    } else {
      setDepositDesc(`Credit Issued to ${client.username}`);
      setWithdrawDesc(`Credit Withdrawn from ${client.username}`);
    }
    setDepositAmount("0");
    setWithdrawAmount("0");
  }, [client?.username, activeTab, isOpen]);

  const refreshAll = async () => {
    await refetchAdmin();
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["client", client?.username] });
    queryClient.invalidateQueries({ queryKey: ["transactions", client?.username] });
    queryClient.invalidateQueries({ queryKey: ["admin-own-record"] });
  };

  const submitTransfer = async (direction: "deposit" | "withdraw") => {
    if (!client || !session || inFlight.current) return;
    const amount = direction === "deposit" ? depositAmount : withdrawAmount;
    const description = direction === "deposit" ? depositDesc : withdrawDesc;
    const fingerprint = JSON.stringify([client.id, activeTab, direction, amount, description]);
    if (pendingRequest.current?.fingerprint !== fingerprint) {
      pendingRequest.current = { fingerprint, id: crypto.randomUUID() };
    }
    inFlight.current = true;
    const setSubmitting = direction === "deposit" ? setIsSubmittingDeposit : setIsSubmittingWithdraw;
    setSubmitting(true);
    try {
      await manualWalletTransfer({
        operatorUsername: session.username, operatorPassword,
        clientId: client.id, wallet: activeTab, direction, amount, description,
        requestId: pendingRequest.current!.id,
      });
      pendingRequest.current = null;
      setOperatorPassword("");
      if (direction === "deposit") setDepositAmount("0");
      else setWithdrawAmount("0");
      toast({ title: "Success", description: `${activeTab === "cash" ? "Cash" : "Credit"} ${direction === "deposit" ? "deposited" : "withdrawn"} successfully.` });
      // A refresh failure must not turn a confirmed transfer into a failed transfer.
      await refreshAll().catch(() => undefined);
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Transfer Failed", description: err instanceof Error ? err.message : "Unable to confirm transfer. Retry with the same details." });
    } finally {
      setSubmitting(false);
      inFlight.current = false;
    }
  };
  const handleDeposit = () => submitTransfer("deposit");
  const handleWithdraw = () => submitTransfer("withdraw");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="p-0 max-w-sm overflow-hidden border border-[#dee2e6] shadow-2xl [&>button]:hidden rounded-[4px]"
        style={{
          fontFamily: '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <DialogTitle className="sr-only">Cash / Credit</DialogTitle>

        {/* TABS HEADER */}
        <div className="flex relative bg-white border-b border-[#dee2e6]">
          <button
            onClick={() => setActiveTab("cash")}
            className={cn(
              "flex-1 py-2.5 text-[15px] font-bold transition-colors select-none",
              activeTab === "cash" ? "bg-[#0088cc] text-white" : "bg-white text-[#00a676] hover:bg-gray-50"
            )}
          >
            Cash
          </button>
          <button
            onClick={() => setActiveTab("credit")}
            className={cn(
              "flex-1 py-2.5 text-[15px] font-bold transition-colors select-none",
              activeTab === "credit" ? "bg-[#0088cc] text-white" : "bg-white text-[#00a676] hover:bg-gray-50"
            )}
          >
            Credit
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="bg-[#f8f9fa] max-h-[85vh] overflow-y-auto p-3 space-y-3">
          {/* Client summary info box */}
          <div className="bg-white p-3 border border-[#dee2e6] rounded-[4px] shadow-sm">
            <h2 className="text-[16px] font-bold text-[#212529] mb-2">{client?.username}</h2>

            <div className="border border-[#dee2e6] rounded-[3px] overflow-hidden text-[12px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa]">
                    {activeTab === "cash" ? (
                      <>
                        <th className="px-2.5 py-1.5 text-left text-[#212529] font-bold border-r border-[#dee2e6] w-1/3">
                          Credit
                        </th>
                        <th className="px-2.5 py-1.5 text-left text-[#212529] font-bold border-r border-[#dee2e6] w-1/3">
                          Balance
                        </th>
                        <th className="px-2.5 py-1.5 text-left text-[#212529] font-bold w-1/3">
                          Max Withdraw
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-2.5 py-1.5 text-left text-[#212529] font-bold border-r border-[#dee2e6] w-1/3">
                          Credit limit
                        </th>
                        <th className="px-2.5 py-1.5 text-left text-[#212529] font-bold border-r border-[#dee2e6] w-1/3">
                          {client?.username} Credit
                        </th>
                        <th className="px-2.5 py-1.5 text-left text-[#212529] font-bold w-1/3">
                          Available Balance
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="border-t border-[#dee2e6]">
                  <tr className="bg-white">
                    {activeTab === "cash" ? (
                      <>
                        <td
                          className="px-2.5 py-1.5 font-bold border-r border-[#dee2e6] text-[#00a676] underline cursor-pointer"
                          onClick={() => setShowHistory(true)}
                        >
                          {(client?.credit_remaining || 0).toLocaleString()} Rs.
                        </td>
                        <td
                          className="px-2.5 py-1.5 font-bold border-r border-[#dee2e6] text-[#212529] underline cursor-pointer"
                          onClick={() => setShowHistory(true)}
                        >
                          {((client?.credit_remaining || 0) + (client?.cash || 0) + (client?.pl_downline || 0)).toLocaleString()} Rs.
                        </td>
                        <td
                          className="px-2.5 py-1.5 font-bold text-[#212529] underline cursor-pointer"
                          onClick={() => setShowHistory(true)}
                        >
                          {Math.max(0, client?.cash || 0).toLocaleString()} Rs.
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          className="px-2.5 py-1.5 font-bold border-r border-[#dee2e6] text-[#212529] underline cursor-pointer"
                          onClick={() => setShowHistory(true)}
                        >
                          {(adminClient?.credit_remaining ?? 0).toLocaleString()} Rs.
                        </td>
                        <td
                          className="px-2.5 py-1.5 font-bold border-r border-[#dee2e6] text-[#00a676] underline cursor-pointer"
                          onClick={() => setShowHistory(true)}
                        >
                          {(client?.credit_remaining || 0).toLocaleString()} Rs.
                        </td>
                        <td
                          className="px-2.5 py-1.5 font-bold text-[#212529] underline cursor-pointer"
                          onClick={() => setShowHistory(true)}
                        >
                          {((client?.credit_remaining || 0) + (client?.cash || 0) + (client?.pl_downline || 0)).toLocaleString()} Rs.
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 text-right">
              * Click on any amount to view history
            </p>
          </div>

          <div className="bg-white border border-gray-300 rounded p-3 mb-3">
            <label className="block text-sm font-semibold mb-1" htmlFor="wallet-operator-password">Your administrator password</label>
            <input id="wallet-operator-password" type="password" autoComplete="current-password" value={operatorPassword} onChange={(e) => setOperatorPassword(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Confirm your identity" />
          </div>
          {/* DEPOSIT SECTION (Green Header) */}
          <div className="rounded-[4px] overflow-hidden border border-[#dee2e6] bg-white shadow-sm">
            <div className="bg-[#00a676] px-3 py-2 text-white font-bold text-[13px]">
              {activeTab === "cash"
                ? `Deposit Cash in ${client?.username} account`
                : `Deposit Credit in ${client?.username} Account`}
            </div>
            <div className="p-3 space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-[#212529] mb-1">Description</label>
                <input
                  type="text"
                  value={depositDesc}
                  onChange={(e) => setDepositDesc(e.target.value)}
                  className="w-full border border-[#ced4da] rounded-[3px] px-2.5 py-1.5 text-[13px] outline-none focus:border-[#00a676]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#212529] mb-1">Amount</label>
                <div className="flex rounded-[3px] border border-[#ced4da] overflow-hidden">
                  <span className="bg-[#e9ecef] px-3 py-1.5 text-[12px] text-gray-600 border-r border-[#ced4da] flex items-center font-bold">
                    Rs.
                  </span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-[13px] font-semibold outline-none"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleDeposit}
                  disabled={isSubmittingDeposit || isSubmittingWithdraw || !operatorPassword}
                  className="bg-[#00a676] hover:bg-[#008f65] text-white font-bold px-6 py-1.5 rounded-[3px] text-[13px] shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-70"
                >
                  {isSubmittingDeposit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* WITHDRAW SECTION (Red Header) */}
          <div className="rounded-[4px] overflow-hidden border border-[#dee2e6] bg-white shadow-sm">
            <div className="bg-[#dc3545] px-3 py-2 text-white font-bold text-[13px]">
              {activeTab === "cash"
                ? `Withdraw cash from ${client?.username} account`
                : `Withdraw Credit from ${client?.username}`}
            </div>
            <div className="p-3 space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-[#212529] mb-1">Description</label>
                <input
                  type="text"
                  value={withdrawDesc}
                  onChange={(e) => setWithdrawDesc(e.target.value)}
                  className="w-full border border-[#ced4da] rounded-[3px] px-2.5 py-1.5 text-[13px] outline-none focus:border-[#dc3545]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#212529] mb-1">Amount</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex rounded-[3px] border border-[#ced4da] overflow-hidden">
                    <span className="bg-[#e9ecef] px-3 py-1.5 text-[12px] text-gray-600 border-r border-[#ced4da] flex items-center font-bold">
                      Rs.
                    </span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-[13px] font-semibold outline-none"
                      min="0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const available = activeTab === "cash" ? client?.cash || 0 : client?.credit_remaining || 0;
                      setWithdrawAmount(Math.max(0, available).toString());
                    }}
                    className="px-2.5 bg-gray-100 hover:bg-gray-200 text-[#212529] font-bold rounded-[3px] text-[11px] uppercase transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleWithdraw}
                  disabled={isSubmittingDeposit || isSubmittingWithdraw || !operatorPassword}
                  className="bg-[#dc3545] hover:bg-[#c82333] text-white font-bold px-6 py-1.5 rounded-[3px] text-[13px] shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-70"
                >
                  {isSubmittingWithdraw && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* BACK BUTTON */}
          <div className="pt-1 flex justify-start">
            <button
              onClick={onClose}
              className="flex items-center gap-1 bg-[#e9ecef] hover:bg-[#dee2e6] text-[#212529] font-bold px-4 py-1.5 rounded-[3px] text-[12px] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
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
