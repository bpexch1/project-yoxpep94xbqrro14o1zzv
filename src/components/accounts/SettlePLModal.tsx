import { validPLTransfer } from "@/lib/accountingValidation";
import { serviceRequest } from "@/services/client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SettlePLModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any | null;
}

export function SettlePLModal({ isOpen, onClose, client }: SettlePLModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [amount, setAmount] = useState("0.00");
  const [description, setDescription] = useState("P/L to Cash transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && client) {
      const plAmount = client.pl_downline || 0;
      try {
        const saved = JSON.parse(sessionStorage.getItem(`pendingPL:${client.id}`) || "null");
        if (saved?.requestId && saved?.fingerprint) {
          const details = JSON.parse(saved.fingerprint);
          setAmount(String(details.amount)); setDescription(details.reason); return;
        }
      } catch { /* Ignore malformed local cache. */ }
      setAmount(plAmount.toString());
      setDescription("P/L to Cash transfer");
    }
  }, [isOpen, client]);

  const handleSubmit = async () => {
    if (!client || isSubmitting) return;
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(`pendingPL:${client.id}`) || "null"); } catch { /* Ignore malformed local cache. */ }
    const replay = saved?.fingerprint === JSON.stringify({amount:parseFloat(amount),reason:description});

    const settleAmount = parseFloat(amount);
    if (!validPLTransfer(amount, replay ? settleAmount : Number(client.pl_downline || 0))) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Enter an amount with the same sign as the outstanding P/L, within its limit",
      });
      return;
    }

    const maxAmount = client.pl_downline || 0;
    if (!replay && maxAmount === 0) {
      toast({
        variant: "destructive",
        title: "No P/L to settle",
        description: "This client has no P/L balance available to settle.",
      });
      return;
    }

    if (!replay && Math.abs(settleAmount) > Math.abs(maxAmount)) {
      toast({
        variant: "destructive",
        title: "Amount exceeds balance",
        description: `Max amount to transfer is ${maxAmount.toLocaleString()} Rs.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const key=`pendingPL:${client.id}`;
      const fingerprint=JSON.stringify({amount:settleAmount,reason:description});
      const pending=saved;
      if(pending&&pending.fingerprint!==fingerprint) throw new Error('Retry the previous unconfirmed P/L transfer first');
      const requestId=pending?.requestId||crypto.randomUUID();
      sessionStorage.setItem(key,JSON.stringify({requestId,fingerprint}));
      await serviceRequest('settlePL',{requestId,clientId:client.id,amount:settleAmount,reason:description});
      sessionStorage.removeItem(key);

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onClose();
    } catch (err) {
      console.error("Settle P/L Error:", err);
      toast({
        variant: "destructive",
        title: "Settlement Failed",
        description: "An error occurred while settling the account.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-md border border-gray-200 bg-white [&>button]:hidden">
        <DialogTitle className="sr-only">Settle P/L Account</DialogTitle>
        <div className="bg-white">
          {/* Title */}
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="font-bold text-[#2c3e50] text-base">Settle P/L Account</h2>
          </div>
          {/* Form */}
          <div className="px-5 py-6 space-y-5">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-[#2c3e50] mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a9e71]"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Max amount to transfer: {(client?.pl_downline || 0).toLocaleString()} Rs.
              </p>
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#2c3e50] mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a9e71]"
              />
            </div>
            {/* Submit */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#1a9e71] hover:bg-[#158c61] text-white font-bold px-10 py-2.5 rounded flex items-center gap-2 transition-colors disabled:opacity-70"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
