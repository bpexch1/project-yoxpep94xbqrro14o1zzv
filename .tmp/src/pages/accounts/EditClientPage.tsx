import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Client } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function EditClientPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: clients, isLoading: isFetching } = useQuery({
    queryKey: ["client", username],
    queryFn: () => Client.filter({ username }),
    enabled: !!username,
  });

  const client = clients?.[0];

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
        bettingAllowed: client.betting_allowed !== false,
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
      const commission = parseFloat(formData.commission);

      const updateData: any = {
        status: formData.isActive ? "active" : "inactive",
        betting_allowed: formData.bettingAllowed,
        can_settle_pl: formData.canSettlePL,
      };

      if (formData.phone !== undefined) updateData.phone = formData.phone || "";
      if (formData.reference !== undefined) updateData.reference = formData.reference || "";
      if (formData.notes !== undefined) updateData.notes = formData.notes || "";

      if (!isNaN(commission) && commission >= 0) {
        updateData.commission = commission;
      }

      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password.trim();
      }

      await Client.update(client.id, updateData);

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", username] });
      
      toast({
        title: "Success",
        description: `Account for ${client.username} has been updated.`,
      });
      navigate(-1);
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error?.message || "An error occurred while saving changes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#16a085]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Client not found</h1>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-roboto">
      <main className="max-w-[720px] mx-auto px-[5px] py-4 lg:py-6">
        {/* Header Bar */}
        <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#2c3e50]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#2c3e50]">Edit: @{client.username}</h1>
            <p className="text-sm text-[#7f8c8d] font-medium uppercase tracking-wider">
              {client.role || "Client"} Account
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-0">
            {/* Password Row */}
            <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-100 gap-2 sm:gap-4">
              <label className="sm:w-48 text-sm font-bold text-[#2c3e50]">Password</label>
              <Input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 h-10 bg-gray-50 border-gray-200 text-sm focus:ring-1 focus:ring-[#16a085]"
                placeholder="Enter new password to change"
              />
            </div>

            {/* IsActive Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-48 text-sm font-bold text-[#2c3e50]">IsActive</label>
              <div className="flex-1">
                <Checkbox
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
                  className="w-5 h-5 border-gray-300 data-[state=checked]:bg-[#16a085] data-[state=checked]:border-[#16a085]"
                />
              </div>
            </div>

            {/* Betting Allowed Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-48 text-sm font-bold text-[#2c3e50]">Betting Allowed</label>
              <div className="flex-1">
                <Checkbox
                  checked={formData.bettingAllowed}
                  onCheckedChange={(checked) => setFormData({ ...formData, bettingAllowed: checked === true })}
                  className="w-5 h-5 border-gray-300 data-[state=checked]:bg-[#16a085] data-[state=checked]:border-[#16a085]"
                />
              </div>
            </div>

            {/* Can Settle PL Row */}
            <div className="flex items-center py-4 border-b border-gray-100">
              <label className="w-48 text-sm font-bold text-[#2c3e50]">Can Settle PL</label>
              <div className="flex-1 flex items-center gap-2">
                <Checkbox
                  checked={formData.canSettlePL}
                  onCheckedChange={(checked) => setFormData({ ...formData, canSettlePL: checked === true })}
                  className="w-5 h-5 border-gray-300 data-[state=checked]:bg-[#16a085] data-[state=checked]:border-[#16a085]"
                />
                <span className="text-xs text-gray-500 italic">Enables settlement features</span>
              </div>
            </div>

            {/* Phone Row */}
            <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-100 gap-2 sm:gap-4">
              <label className="sm:w-48 text-sm font-bold text-[#2c3e50]">Phone</label>
              <Input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="flex-1 h-10 bg-gray-50 border-gray-200 text-sm focus:ring-1 focus:ring-[#16a085]"
              />
            </div>

            {/* Reference Row */}
            <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-100 gap-2 sm:gap-4">
              <label className="sm:w-48 text-sm font-bold text-[#2c3e50]">Reference</label>
              <Input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="flex-1 h-10 bg-gray-50 border-gray-200 text-sm focus:ring-1 focus:ring-[#16a085]"
              />
            </div>

            {/* Notes Row */}
            <div className="flex flex-col sm:flex-row sm:items-start py-4 border-b border-gray-100 gap-2 sm:gap-4">
              <label className="sm:w-48 text-sm font-bold text-[#2c3e50] pt-2">Notes</label>
              <Textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="flex-1 bg-gray-50 border-gray-200 text-sm focus:ring-1 focus:ring-[#16a085] resize-none"
              />
            </div>

            {/* Commission Row */}
            <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-100 gap-2 sm:gap-4">
              <label className="sm:w-48 text-sm font-bold text-[#2c3e50]">Commission (%)</label>
              <div className="flex-1 space-y-1">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  className="w-full h-10 bg-gray-50 border-gray-200 text-sm focus:ring-1 focus:ring-[#16a085]"
                />
                <p className="text-[10px] text-gray-500 italic">Minimum commission is 2.00 %</p>
              </div>
            </div>

            {/* UserDomain Row */}
            <div className="flex items-center py-4">
              <label className="w-48 text-sm font-bold text-[#2c3e50]">UserDomain</label>
              <div className="flex-1 text-sm text-[#7f8c8d] font-semibold">
                1 ( betproexch.com )
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#16a085] hover:bg-[#138d75] text-white px-10 py-2.5 h-auto rounded-lg font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
