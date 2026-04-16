import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getClientSession } from "@/hooks/useClientAuth";

export default function CreateUser() {
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
    role: "client",
    commission: "2.00",
  });

  useEffect(() => {
    if (!session) navigate("/login");
  }, [session, navigate]);

  const creatableRoles = [];
  if (session?.role === 'company' || session?.role === 'superadmin') {
    creatableRoles.push({ value: 'superadmin', label: 'SuperAdmin' });
    creatableRoles.push({ value: 'supermaster', label: 'SuperMaster' });
    creatableRoles.push({ value: 'admin', label: 'Admin' });
  } else if (session?.role === 'admin' || session?.role === 'supermaster') {
    creatableRoles.push({ value: 'admin', label: 'Admin' });
  }

  const inputClass = "w-full border border-[#d5d8dc] rounded px-3 py-2 text-sm text-[#333] focus:outline-none focus:border-[#12b886] bg-white";
  const labelClass = "block text-sm text-[#333] font-medium";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.fullName) {
      toast({ variant: "destructive", title: "Required Fields", description: "Username, Password, and Full Name are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      await ClientEntity.create({
        username: formData.username.trim(),
        password: formData.password,
        full_name: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        credit_received: parseFloat(formData.creditLimit) || 0,
        credit_remaining: parseFloat(formData.creditLimit) || 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: "active",
        commission: parseFloat(formData.commission) || 2.0,
        parent_username: session?.username || "system",
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Success", description: `User ${formData.username} created successfully.` });
      navigate("/accounts");
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to create user. Username might be taken." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-10">
      <main className="max-w-xl mx-auto pt-6 px-3 font-roboto">
        <section className="bg-white border border-[#d5d8dc] shadow-sm">
          <div className="bg-[#f5f5f5] px-4 py-3 border-b border-[#d5d8dc]">
            <h1 className="text-base font-bold text-[#333]">
              Add New User
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Account Type</label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {creatableRoles.map((creatableRole) => (
                    <label key={creatableRole.value} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="role"
                        value={creatableRole.value}
                        checked={formData.role === creatableRole.value}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-5 h-5 accent-[#12b886] cursor-pointer"
                      />
                      <span className="text-sm text-[#333]">{creatableRole.label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="role"
                      value="client"
                      checked={formData.role === "client"}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-5 h-5 accent-[#12b886] cursor-pointer"
                    />
                    <span className="text-sm text-[#333]">Bettor</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Credit Limit</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Commission %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    className="w-24 border border-[#d5d8dc] rounded px-3 py-2 text-sm text-[#333] focus:outline-none focus:border-[#12b886] bg-white"
                  />
                  <span className="ml-2 text-[10px] text-gray-500 italic">Default 2.00%</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  className="w-5 h-5 accent-[#12b886] cursor-pointer mt-1"
                />
                <div className="text-[11px] text-gray-500">
                  <p className="font-bold text-gray-700">Account is Active</p>
                  <p>User will be able to log in and place bets immediately.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 pt-6 border-t border-[#d5d8dc]">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full lg:w-48 bg-[#12b886] hover:bg-[#0ca678] text-white font-medium py-3 rounded text-sm transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
