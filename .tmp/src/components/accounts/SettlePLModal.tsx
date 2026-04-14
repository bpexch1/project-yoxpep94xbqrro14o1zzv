import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Client, Transaction } from "@/entities";
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
      setAmount(plAmount > 0 ? plAmount.toString() : "0");
      setDescription("P/L to Cash transfer");
    }
  }, [isOpen, client]);

  const handleSubmit = async () => {
    if (!client) return;

    const settleAmount = parseFloat(amount);
    if (isNaN(settleAmount) || settleAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter an amount greater than 0",
      });
      return;
    }

    const maxAmount = client.pl_downline || 0;
    if (maxAmount <= 0) {
      toast({
        variant: "destructive",
        title: "No P/L to settle",
        description: "This client has no P/L balance available to settle.",
      });
      return;
    }

    if (settleAmount > maxAmount) {
      toast({
        variant: "destructive",
        title: "Amount exceeds balance",
        description: `Max amount to transfer is ${maxAmount.toLocaleString()} Rs.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update client: deduct pl_downline, add to cash
      await Client.update(client.id, {
        pl_downline: (client.pl_downline || 0) - settleAmount,
        cash: (client.cash || 0) + settleAmount,
      });

      // Create transaction record
      await Transaction.create({
        client_username: client.username,
        type: 'cash',
        amount: settleAmount,
        description: description,
        before_balance: client.cash || 0,
        after_balance: (client.cash || 0) + settleAmount,
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Success",
        description: `Rs. ${settleAmount.toLocaleString()} settled to cash for ${client.username}`,
      });
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
