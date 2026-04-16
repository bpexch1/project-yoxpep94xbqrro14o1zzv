import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Client } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Save } from "lucide-react";

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

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#ececec] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#12b886]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#ececec] flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-[#333] mb-4">Client not found</h1>
        <button onClick={() => navigate(-1)} className="bg-white border border-[#cccccc] px-4 h-10 rounded-[4px] font-bold text-[#333]">
          Go Back
        </button>
      </div>
    );
  }

  const InputRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex items-center py-2.5 border-b border-[#d4d4d4] gap-3">
      <label className="w-24 text-[13px] font-bold text-[#333]">{label}</label>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#ececec] pb-12" style={arialFont}>
      <main className="max-w-[420px] mx-auto p-3">
        {/* Header Bar */}
        <div className="flex items-center gap-3 mb-3 bg-[#f3f3f3] p-3 rounded-[6px] border border-[#d4d4d4]">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#333]" />
          </button>
          <div>
            <h1 className="text-[15px] font-bold text-[#333]">Edit: {client.username}</h1>
            <p className="text-[11px] text-[#12b886] font-bold uppercase tracking-wider">
              {client.role || "Client"}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-[#f3f3f3] rounded-[6px] border border-[#d4d4d4] overflow-hidden">
          <div className="p-3 pt-1">
            <InputRow label="Password">
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-[40px] bg-white border border-[#cccccc] rounded-[4px] px-3 text-[13px] focus:outline-none focus:border-[#12b886]"
                placeholder="New password"
              />
            </InputRow>

            <InputRow label="IsActive">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 accent-[#12b886]"
              />
            </InputRow>

            <InputRow label="Betting">
              <input
                type="checkbox"
                checked={formData.bettingAllowed}
                onChange={(e) => setFormData({ ...formData, bettingAllowed: e.target.checked })}
                className="w-5 h-5 accent-[#12b886]"
              />
            </InputRow>

            <InputRow label="Settle PL">
              <input
                type="checkbox"
                checked={formData.canSettlePL}
                onChange={(e) => setFormData({ ...formData, canSettlePL: e.target.checked })}
                className="w-5 h-5 accent-[#12b886]"
              />
            </InputRow>

            <InputRow label="Phone">
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-[40px] bg-white border border-[#cccccc] rounded-[4px] px-3 text-[13px] focus:outline-none focus:border-[#12b886]"
              />
            </InputRow>

            <InputRow label="Reference">
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full h-[40px] bg-white border border-[#cccccc] rounded-[4px] px-3 text-[13px] focus:outline-none focus:border-[#12b886]"
              />
            </InputRow>

            <div className="py-2.5 border-b border-[#d4d4d4]">
              <label className="block text-[13px] font-bold text-[#333] mb-1.5">Notes</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-white border border-[#cccccc] rounded-[4px] p-2 text-[13px] focus:outline-none focus:border-[#12b886] resize-none"
              />
            </div>

            <InputRow label="Comm (%)">
              <input
                type="number"
                step="0.01"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                className="w-full h-[40px] bg-white border border-[#cccccc] rounded-[4px] px-3 text-[13px] focus:outline-none focus:border-[#12b886]"
              />
            </InputRow>
          </div>

          {/* Action Footer */}
          <div className="p-3 bg-[#ececec] flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#12b886] text-white px-8 h-[40px] rounded-[4px] font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
