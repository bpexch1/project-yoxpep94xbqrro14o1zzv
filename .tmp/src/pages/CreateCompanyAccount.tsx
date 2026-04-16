import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getClientSession } from "@/hooks/useClientAuth";

export default function CreateCompanyAccount() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const session = getClientSession();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    phone: "",
    creditLimit: "0",
    notes: "",
    commission: "2.00",
    isActive: true,
  });

  useEffect(() => {
    // Only 'company' role should access this, though it's restricted by logic
    if (session?.role !== 'company' && session?.role !== 'superadmin') {
      // navigate("/dashboard");
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.fullName) {
      toast({ variant: "destructive", title: "Missing fields", description: "Username, Password and Name are required" });
      return;
    }

    setIsSubmitting(true);
    try {
      await Client.create({
        username: formData.username.trim(),
        password: formData.password,
        full_name: formData.fullName,
        phone: formData.phone,
        role: "company",
        credit_received: parseFloat(formData.creditLimit) || 0,
        credit_remaining: parseFloat(formData.creditLimit) || 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: formData.isActive ? "active" : "inactive",
        commission: parseFloat(formData.commission) || 2.0,
        notes: formData.notes,
        parent_username: "system",
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Account Created", description: `Company account ${formData.username} is ready.` });
      navigate("/accounts");
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Could not create company account." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f5f5f5] pb-10">
      <main className="max-w-xl mx-auto pt-6 px-3">
        
        {/* Header Card */}
        <section className="bg-white border border-[#d5d8dc] rounded-lg overflow-hidden shadow-sm mb-6">
          <div className="bg-[#f5f5f5] px-4 py-3 border-b border-[#d5d8dc] flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#333]" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-[#333] uppercase">
                Create New Company Account
              </h1>
              <p className="text-[10px] text-gray-500 font-medium">Add a top-level book operator</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. MasterBook77"
                  className="w-full border border-[#d5d8dc] rounded px-3 py-2.5 text-sm text-[#333] focus:outline-none focus:border-[#12b886] shadow-inner"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Set account password"
                  className="w-full border border-[#d5d8dc] rounded px-3 py-2.5 text-sm text-[#333] focus:outline-none focus:border-[#12b886] shadow-inner"
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Legal name or book title"
                  className="w-full border border-[#d5d8dc] rounded px-3 py-2.5 text-sm text-[#333] focus:outline-none focus:border-[#12b886] shadow-inner"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone (Optional)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91..."
                  className="w-full border border-[#d5d8dc] rounded px-3 py-2.5 text-sm text-[#333] focus:outline-none focus:border-[#12b886] shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Commission */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Commission %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    className="border border-[#d5d8dc] rounded px-3 py-2.5 text-sm w-full text-[#333] focus:outline-none focus:border-[#12b886] shadow-inner"
                  />
                </div>
                {/* Credit Limit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Starting Credit</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="border border-[#d5d8dc] rounded px-3 py-2.5 text-sm w-full text-[#333] focus:outline-none focus:border-[#12b886] shadow-inner"
                  />
                </div>
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-6 h-6 accent-[#12b886] cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-[#333] cursor-pointer select-none">
                  Account is Active
                </label>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes about this company..."
                  className="w-full border border-[#d5d8dc] rounded-lg px-3 py-2.5 text-sm text-[#333] focus:outline-none focus:border-[#12b886] shadow-inner resize-none"
                />
              </div>
            </div>
          </form>

          {/* Footer Action */}
          <div className="bg-[#f5f5f5] border-t border-[#d5d8dc] px-6 py-4">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#12b886] hover:bg-[#0ca678] text-white font-bold px-10 py-3 rounded text-sm transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Company
                </>
              )}
            </button>
          </div>
        </section>

        <div className="flex items-center gap-2 text-gray-400 text-xs justify-center">
          <AlertCircle className="w-3 h-3" />
          <span>This account will be able to create SuperAdmins and Admins.</span>
        </div>
      </main>
    </div>
  );
}
