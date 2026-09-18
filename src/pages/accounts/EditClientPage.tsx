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
import { getClientSession } from "@/hooks/useClientAuth";
import { verifyInHierarchy } from "@/lib/hierarchyCheck";

export default function EditClientPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

      const authorized = await verifyInHierarchy(username, session.username, session.role);
      if (!authorized) {
        setIsAuthorized(false);
        navigate("/accounts", { replace: true });
      } else {
        setIsAuthorized(true);
      }
    }

    checkAuthorization();
  }, [session, navigate, username]);

  const { data: clients, isLoading: isFetching } = useQuery({
    queryKey: ["client", username],
    queryFn: () => Client.filter({ username }),
    enabled: !!username && isAuthorized === true,
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

  if (isAuthorized === null || isFetching) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#16a085]" />
      </div>
    );
  }

  if (isAuthorized === false) return null;

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
    <div className="bg-[#eef2f5] font-sans text-[#333333] pb-16">
      <div className="max-w-[760px] mx-auto px-2 sm:px-4 pt-3">
        {/* Top White Nav Box with 5 Green Buttons & Large Username */}
        <div className="bg-white border border-[#dee2e6] rounded-[2px] p-3 mb-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <button
              type="button"
              className="bg-[#008f66] text-white text-[13px] font-semibold px-3 py-1.5 rounded-[3px] shadow-sm border border-[#007a57]"
            >
              Edit User
            </button>
            <button
              type="button"
              onClick={() => navigate(`/accounts/ledger/${username}`)}
              className="bg-[#00a676] hover:bg-[#008f66] text-white text-[13px] font-semibold px-3 py-1.5 rounded-[3px] shadow-sm transition-colors"
            >
              Ledger
            </button>
            <button
              type="button"
              onClick={() => navigate(`/reports/book-detail`)}
              className="bg-[#00a676] hover:bg-[#008f66] text-white text-[13px] font-semibold px-3 py-1.5 rounded-[3px] shadow-sm transition-colors"
            >
              Bets
            </button>
            <button
              type="button"
              onClick={() => navigate(`/reports/daily-pl`)}
              className="bg-[#00a676] hover:bg-[#008f66] text-white text-[13px] font-semibold px-3 py-1.5 rounded-[3px] shadow-sm transition-colors"
            >
              Profit Loss
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(`/current-position`)}
              className="bg-[#00a676] hover:bg-[#008f66] text-white text-[13px] font-semibold px-3 py-1.5 rounded-[3px] shadow-sm transition-colors"
            >
              Current Position
            </button>

            <span className="text-xl sm:text-2xl font-black text-[#111] tracking-tight">
              {client.username}
            </span>
          </div>
        </div>

        {/* Main Edit Client Table/Card */}
        <div className="bg-white border border-[#dee2e6] rounded-[2px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {/* Header Row */}
          <div className="bg-[#f1f4f8] px-3 py-2 border-b border-[#dee2e6]">
            <h1 className="text-[15px] font-normal text-[#333]">
              Edit Client - <strong className="font-bold text-[#111]">{client.username}</strong>
            </h1>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5">
            <div className="flex flex-col space-y-4 text-[15px]">
              {/* ID */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal">
                  ID
                </div>
                <div className="col-span-8 sm:col-span-9 text-[#212529] font-normal text-[15px]">
                  {client.id?.replace?.(/\D/g, "")?.slice?.(0, 7) || "8501292"}
                </div>
              </div>

              {/* Username */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal">
                  Username
                </div>
                <div className="col-span-8 sm:col-span-9 text-[#212529] font-normal text-[15px]">
                  {client.username}
                </div>
              </div>

              {/* Type */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal">
                  Type
                </div>
                <div className="col-span-8 sm:col-span-9 text-[#212529] font-normal text-[15px]">
                  {client.role === "client" || !client.role ? "Bettor" : (client.role.charAt(0).toUpperCase() + client.role.slice(1))}
                </div>
              </div>

              {/* Currency */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal">
                  Currency
                </div>
                <div className="col-span-8 sm:col-span-9 text-[#212529] font-normal text-[15px]">
                  Rs.
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal">
                  Password
                </div>
                <div className="col-span-8 sm:col-span-9">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Abc12345"
                    className="w-full max-w-[240px] h-[34px] px-2.5 text-[15px] bg-white border-2 border-[#9ed4f4] rounded-[4px] outline-none text-[#333] shadow-inner focus:border-[#4299e1]"
                  />
                </div>
              </div>

              {/* IsActive */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal">
                  IsActive
                </div>
                <div className="col-span-8 sm:col-span-9 flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-[18px] h-[18px] text-[#0d6efd] rounded-[3px] border-[#adb5bd] cursor-pointer"
                  />
                </div>
              </div>

              {/* Betting Allowed */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal leading-tight">
                  Betting<br />Allowed
                </div>
                <div className="col-span-8 sm:col-span-9 flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.bettingAllowed}
                    onChange={(e) => setFormData({ ...formData, bettingAllowed: e.target.checked })}
                    className="w-[18px] h-[18px] text-[#0d6efd] rounded-[3px] border-[#adb5bd] cursor-pointer"
                  />
                </div>
              </div>

              {/* Can Settle PL */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal leading-tight">
                  Can Settle<br />PL
                </div>
                <div className="col-span-8 sm:col-span-9 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableSBtn"
                    checked={formData.canSettlePL}
                    onChange={(e) => setFormData({ ...formData, canSettlePL: e.target.checked })}
                    className="w-[18px] h-[18px] text-[#0d6efd] rounded-[3px] border-[#adb5bd] cursor-pointer"
                  />
                  <label htmlFor="enableSBtn" className="text-[15px] text-[#212529] cursor-pointer select-none">
                    Enable S button
                  </label>
                </div>
              </div>

              {/* Phone */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal">
                  Phone
                </div>
                <div className="col-span-8 sm:col-span-9">
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full max-w-[240px] h-[34px] px-2.5 text-[15px] bg-white border border-[#ced4da] rounded-[4px] outline-none text-[#333] focus:border-[#86b7fe]"
                  />
                </div>
              </div>

              {/* Reference */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal">
                  Reference
                </div>
                <div className="col-span-8 sm:col-span-9">
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full max-w-[240px] h-[34px] px-2.5 text-[15px] bg-white border border-[#ced4da] rounded-[4px] outline-none text-[#333] focus:border-[#86b7fe]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-12 items-start gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal pt-1">
                  Notes
                </div>
                <div className="col-span-8 sm:col-span-9">
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full max-w-[340px] p-2 text-[15px] bg-white border border-[#ced4da] rounded-[4px] outline-none text-[#333] resize-none focus:border-[#86b7fe]"
                  />
                </div>
              </div>

              {/* Commission */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal">
                  Commission (%)
                </div>
                <div className="col-span-8 sm:col-span-9">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    className="w-full max-w-[240px] h-[34px] px-2.5 text-[15px] bg-white border border-[#ced4da] rounded-[4px] outline-none text-[#333] focus:border-[#86b7fe]"
                  />
                  <div className="text-[12px] text-[#6c757d] italic mt-0.5">
                    Minimum commission is 2.00 %
                  </div>
                </div>
              </div>

              {/* UserDomain */}
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 sm:col-span-3 text-[#212529] font-normal">
                  UserDomain
                </div>
                <div className="col-span-8 sm:col-span-9 text-[#495057] text-[15px]">
                  1 ( betproexch.com )
                </div>
              </div>
            </div>

            {/* Submit / Action Buttons */}
            <div className="mt-8 pt-4 border-t border-[#dee2e6] flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#00a676] hover:bg-[#008f66] text-white font-semibold text-[14px] px-5 py-2 rounded-[3px] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Update Client"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-[#6c757d] hover:bg-[#5a6268] text-white font-semibold text-[14px] px-4 py-2 rounded-[3px] transition-colors shadow-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
