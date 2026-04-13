import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Client, Transaction } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";

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
    if (isOpen) {
      setAmount("0.00");
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

    if (settleAmount > (client.pl_downline || 0)) {
      toast({
        variant: "destructive",
        title: "Amount exceeds balance",
        description: `Max amount to transfer is ${client.pl_downline || 0} Rs.`,
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
        description: "P/L amount settled successfully",
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
      <DialogContent className="p-0 max-w-sm border-0 bg-[#f0f0f0] [&>button]:hidden">
        <DialogTitle className="sr-only">Settle P/L Account</DialogTitle>
        {/* White card container */}
        <div className="bg-white mx-0 shadow-lg">
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#2c3e50] text-base">Settle P/L Account</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Amount Field */}
            <div>
              <label className="block text-sm font-bold text-[#2c3e50] mb-2.5">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a085]/20 focus:border-[#16a085] transition-all"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs font-medium text-gray-400 mt-2">
                Max amount to transfer: <span className="text-[#2c3e50] font-bold">{(client?.pl_downline || 0).toLocaleString()} Rs.</span>
              </p>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-bold text-[#2c3e50] mb-2.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a085]/20 focus:border-[#16a085] transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#16a085] hover:bg-[#138d75] active:scale-[0.98] text-white font-bold px-10 py-2.5 rounded shadow-sm flex items-center gap-2 transition-all disabled:opacity-70 disabled:active:scale-100"
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
