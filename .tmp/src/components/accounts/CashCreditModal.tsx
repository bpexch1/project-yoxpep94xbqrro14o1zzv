import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Transaction as TransactionEntity, Client as ClientEntity } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CashCreditModalProps {
  client: any;
  isOpen: boolean;
  onClose: () => void;
}

export function CashCreditModal({ client, isOpen, onClose }: CashCreditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: "cash",
    amount: "",
    description: "",
  });

  if (!client) return null;

  const currentBalance = client.cash || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const amount = parseFloat(formData.amount) || 0;
    const afterBalance = currentBalance + amount;

    try {
      // Create transaction record
      await TransactionEntity.create({
        client_username: client.username,
        type: formData.type,
        amount: amount,
        description: formData.description,
        before_balance: currentBalance,
        after_balance: afterBalance,
      });

      // Update client balance
      await ClientEntity.update(client.id, {
        cash: afterBalance,
      });

      toast({
        title: "Success",
        description: "Transaction completed successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onClose();
      setFormData({
        type: "cash",
        amount: "",
        description: "",
      });
    } catch (error) {
      console.error("Error processing transaction:", error);
      toast({
        title: "Error",
        description: "Failed to process transaction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 uppercase tracking-tight">
            Balance Adjustment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Account</div>
            <div className="text-sm font-bold text-emerald-600">{client.username}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-xs font-bold uppercase text-slate-500">Transaction Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="before_balance" className="text-xs font-bold uppercase text-slate-500">Current Balance</Label>
              <Input
                id="before_balance"
                value={currentBalance.toLocaleString()}
                disabled
                className="bg-slate-50 rounded-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-bold uppercase text-slate-500">Add Amount</Label>
              <Input
                id="amount"
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase text-slate-500">Note / Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Internal reference note"
              rows={2}
              className="rounded-lg"
            />
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center text-sm">
            <span className="font-bold text-emerald-800 uppercase tracking-tighter text-xs">New Total Balance:</span>
            <span className="font-black text-emerald-600 text-lg">
              {(currentBalance + (parseFloat(formData.amount) || 0)).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg px-6">
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 rounded-lg px-6 font-bold shadow-sm" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
