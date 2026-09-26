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

  const handleDeposit = async () => {
    if (!client) return;
    const amount = parseFloat(depositAmount) || 0;
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Enter an amount greater than 0" });
      return;
    }

    const isCompany = session?.role?.toLowerCase() === "company";
    if (!isCompany && adminClient) {
      const dealerRemainingCredit = Number(adminClient.credit_remaining || 0);
      if (amount > dealerRemainingCredit) {
        toast({
          variant: "destructive",
          title: "Credit Limit Exceeded",
          description: `Aapke pass sirf ${dealerRemainingCredit.toLocaleString()} Rs. credit limit remaining hai.`,
        });
        return;
      }
    }

    setIsSubmittingDeposit(true);
    try {
      let newBalance: number;
      let clientUpdateData: Record<string, number> = {};
      let beforeBalance: number;

      if (activeTab === "cash") {
        beforeBalance = Number(client.cash || 0);
        newBalance = beforeBalance + amount;
        clientUpdateData = { cash: newBalance };
      } else {
        beforeBalance = Number(client.credit_remaining || 0);
        newBalance = beforeBalance + amount;
        clientUpdateData = {
          credit_received: Number(client.credit_received || 0) + amount,
          credit_remaining: newBalance,
        };
      }

      await Client.update(client.id, clientUpdateData);

      if (adminClient) {
        const dealerUpdate: Record<string, number> = {
          credit_remaining: Math.max(0, Number(adminClient.credit_remaining || 0) - amount),
        };
        if (activeTab === "cash") {
          dealerUpdate.cash = Number(adminClient.cash || 0) - amount;
        }
        await Client.update(adminClient.id, dealerUpdate);
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
      setDepositAmount("0");
      toast({ title: "Success", description: `${activeTab === "cash" ? "Cash" : "Credit"} deposited successfully.` });
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      console.error("Deposit error:", err);
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

    if (activeTab === "cash" && amount > Number(client.cash || 0) + Number(client.credit_remaining || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `Available: ${(Number(client.cash || 0) + Number(client.credit_remaining || 0)).toLocaleString()} Rs.`,
      });
      return;
    }
    if (activeTab === "credit" && amount > Number(client.credit_remaining || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient Credit",
        description: `Available Credit: ${Number(client.credit_remaining || 0).toLocaleString()} Rs.`,
      });
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      let newBalance: number;
      let clientUpdateData: Record<string, number> = {};
      let beforeBalance: number;

      if (activeTab === "cash") {
        beforeBalance = Number(client.cash || 0);
        newBalance = beforeBalance - amount;
        clientUpdateData = { cash: newBalance };
      } else {
        beforeBalance = Number(client.credit_remaining || 0);
        newBalance = Math.max(0, beforeBalance - amount);
        clientUpdateData = {
          credit_remaining: newBalance,
          credit_received: Math.max(0, Number(client.credit_received || 0) - amount),
        };
      }

      await Client.update(client.id, clientUpdateData);

      if (adminClient) {
        const dealerUpdate: Record<string, number> = {
          credit_remaining: Number(adminClient.credit_remaining || 0) + amount,
        };
        if (activeTab === "cash") {
          dealerUpdate.cash = Number(adminClient.cash || 0) + amount;
        }
        await Client.update(adminClient.id, dealerUpdate);
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
      setWithdrawAmount("0");
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      console.error("Withdraw error:", err);
      toast({ variant: "destructive", title: "Withdraw Failed", description: err?.message || "Please try again" });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

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
                          {Math.max(0, (client?.credit_remaining || 0) + (client?.cash || 0) + (client?.pl_downline || 0)).toLocaleString()} Rs.
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          className="px-2.5 py-1.5 font-bold border-r border-[#dee2e6] text-[#212529] underline cursor-pointer"
                          onClick={() => setShowHistory(true)}
                        >
                          {(adminClient?.credit_remaining ?? 54727).toLocaleString()} Rs.
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
                  disabled={isSubmittingDeposit}
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
                  disabled={isSubmittingWithdraw}
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
