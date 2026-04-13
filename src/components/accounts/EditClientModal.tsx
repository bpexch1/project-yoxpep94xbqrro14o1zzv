import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any | null;
}

export function EditClientModal({ isOpen, onClose, client }: EditClientModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    isActive: true,
    bettingAllowed: true,
    canSettlePL: false,
    phone: "",
    reference: "",
    notes: "",
    commission: "2.00",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        password: "",
        isActive: client.status === "active",
        bettingAllowed: client.betting_allowed !== false, // default true if undefined
        canSettlePL: client.can_settle_pl === true,
        phone: client.phone || "",
        reference: client.reference || "",
        notes: client.notes || "",
        commission: (client.commission ?? 2.00).toString(),
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsSubmitting(true);
    try {
      const updateData: any = {
        status: formData.isActive ? "active" : "inactive",
        betting_allowed: formData.bettingAllowed,
        can_settle_pl: formData.canSettlePL,
        phone: formData.phone,
        reference: formData.reference,
        notes: formData.notes,
        commission: Number(formData.commission),
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await Client.update(client.id, updateData);

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Success",
        description: `Account for ${client.username} has been updated.`,
      });
      onClose();
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An error occurred while saving changes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-sm w-[90vw] h-[90vh] overflow-hidden flex flex-col border-0 shadow-2xl [&>button]:hidden bg-white rounded-none sm:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-gray-400 text-sm font-medium">Edit: @{client.username}</span>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 px-4 py-2 space-y-0">
            {/* Type Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-32 text-sm text-gray-700 flex-shrink-0">Type</label>
              <div className="flex-1 text-sm font-semibold text-gray-900 capitalize">
                {client.role || "Client"}
              </div>
            </div>

            {/* Currency Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-32 text-sm text-gray-700 flex-shrink-0">Currency</label>
              <div className="flex-1 text-sm font-semibold text-gray-900">Rs.</div>
            </div>

            {/* Password Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-32 text-sm text-gray-700 flex-shrink-0">Password</label>
              <Input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 h-9 bg-gray-50 border-gray-200 text-sm focus:ring-1 focus:ring-[#16a085]"
              />
            </div>

            {/* IsActive Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-32 text-sm text-gray-700 flex-shrink-0">IsActive</label>
              <div className="flex-1 flex items-center">
                <Checkbox
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
                  className="w-5 h-5 border-gray-300 data-[state=checked]:bg-[#16a085] data-[state=checked]:border-[#16a085]"
                />
              </div>
            </div>

            {/* Betting Allowed Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-32 text-sm text-gray-700 flex-shrink-0">Betting Allowed</label>
              <div className="flex-1 flex items-center">
                <Checkbox
                  checked={formData.bettingAllowed}
                  onCheckedChange={(checked) => setFormData({ ...formData, bettingAllowed: checked === true })}
                  className="w-5 h-5 border-gray-300 data-[state=checked]:bg-[#16a085] data-[state=checked]:border-[#16a085]"
                />
              </div>
            </div>

            {/* Can Settle PL Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-32 text-sm text-gray-700 flex-shrink-0">Can Settle PL</label>
              <div className="flex-1 flex items-center gap-2">
                <Checkbox
                  checked={formData.canSettlePL}
                  onCheckedChange={(checked) => setFormData({ ...formData, canSettlePL: checked === true })}
                  className="w-5 h-5 border-gray-300 data-[state=checked]:bg-[#16a085] data-[state=checked]:border-[#16a085]"
                />
                <span className="text-sm text-gray-600 italic">Enable S button</span>
              </div>
            </div>

            {/* Phone Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-32 text-sm text-gray-700 flex-shrink-0">Phone</label>
              <Input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="flex-1 h-9 bg-gray-50 border-gray-200 text-sm focus:ring-1 focus:ring-[#16a085]"
              />
            </div>

            {/* Reference Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-32 text-sm text-gray-700 flex-shrink-0">Reference</label>
              <Input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="flex-1 h-9 bg-gray-50 border-gray-200 text-sm focus:ring-1 focus:ring-[#16a085]"
              />
            </div>

            {/* Notes Row */}
            <div className="flex items-start py-4 border-b border-gray-100">
              <label className="w-32 text-sm text-gray-700 flex-shrink-0 pt-1">Notes</label>
              <Textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="flex-1 bg-gray-50 border-gray-200 text-sm focus:ring-1 focus:ring-[#16a085] resize-none"
              />
            </div>

            {/* Commission Row */}
            <div className="flex flex-col border-b border-gray-100">
              <div className="flex items-center py-4">
                <label className="w-32 text-sm text-gray-700 flex-shrink-0">Commission</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  className="flex-1 h-9 bg-gray-50 border-gray-200 text-sm focus:ring-1 focus:ring-[#16a085]"
                />
              </div>
              <div className="pl-32 pb-4">
                <p className="text-[10px] text-gray-500 italic">Min commission is 2.00 %</p>
              </div>
            </div>

            {/* UserDomain Row */}
            <div className="flex items-center py-4">
              <label className="w-32 text-sm text-gray-700 flex-shrink-0">UserDomain</label>
              <div className="flex-1 text-sm text-gray-600 font-medium">
                1 ( betproexch.com )
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-4 border-t flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#16a085] hover:bg-[#138d75] text-white px-10 py-2 h-auto rounded font-bold transition-all shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
