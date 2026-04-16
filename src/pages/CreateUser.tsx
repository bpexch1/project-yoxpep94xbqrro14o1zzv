import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
    role: "",
    downlineShare: "80",
    isActive: false,
    phone: "",
    reference: "",
    notes: "",
  });

  const creatableRoles = [
    { value: 'superadmin', label: 'SuperAdmin' },
    { value: 'client', label: 'Bettor' },
  ];

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }
    // Set default role if not set
    if (!formData.role && creatableRoles.length > 0) {
      setFormData(prev => ({ ...prev, role: creatableRoles[0].value }));
    }
  }, [session, navigate, formData.role, creatableRoles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast({ variant: "destructive", title: "Required Fields", description: "Username and Password are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      await ClientEntity.create({
        username: formData.username.trim(),
        password: formData.password,
        full_name: formData.username, // Use username as full_name since field is removed
        phone: formData.phone,
        role: formData.role,
        credit_received: 0,
        credit_remaining: 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: formData.isActive ? "active" : "inactive",
        downline_share: formData.role !== 'client' ? parseFloat(formData.downlineShare) || 0 : 0,
        reference: formData.reference,
        notes: formData.notes,
        commission: 2.0, // Default 2.0%
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

  const labelClass = "block text-[14px] text-[#333] mb-[6px] font-normal";
  const inputClass = "w-full h-[44px] border border-[#ccc] rounded-[4px] px-[12px] text-[15px] text-[#333] outline-none focus:border-[#12b886] box-border";
  const fieldBlockClass = "mb-[20px]";

  return (
    <div className="bg-white min-h-screen font-['Arial']">
      {/* Header Bar */}
      <div className="bg-[#e8e8e8] border-b border-[#ccc] px-4 py-3">
        <h1 className="text-[15px] font-bold text-[#333]">
          Create New User under <strong><em>{session?.username}</em></strong>
        </h1>
      </div>

      <main className="max-w-[600px] mx-auto p-4">
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className={fieldBlockClass}>
            <label className={labelClass}>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div className={fieldBlockClass}>
            <label className={labelClass}>Password</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Type */}
          <div className={fieldBlockClass}>
            <label className={labelClass}>Type</label>
            <div className="flex flex-wrap gap-[24px] pt-1">
              {creatableRoles.map((r) => (
                <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={formData.role === r.value}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-4 h-4 accent-[#3b82f6] cursor-pointer"
                  />
                  <span className="text-[15px] text-[#333]">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Downline Share (Conditional) */}
          {formData.role !== 'client' && (
            <div className={fieldBlockClass}>
              <label className={labelClass}>Downline Share</label>
              <input
                type="number"
                value={formData.downlineShare}
                onChange={(e) => setFormData({ ...formData, downlineShare: e.target.value })}
                className="w-[120px] h-[44px] border border-[#ccc] rounded-[4px] px-[12px] text-[15px] text-[#333] outline-none focus:border-[#12b886]"
              />
              <p className="text-[13px] text-gray-600 mt-1">Max allowed downline share is 0 - 85</p>
            </div>
          )}

          {/* IsActive */}
          <div className={fieldBlockClass}>
            <label className={labelClass}>IsActive</label>
            <div className="pt-1">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-[18px] h-[18px] accent-[#3b82f6] cursor-pointer"
              />
            </div>
          </div>

          {/* Phone */}
          <div className={fieldBlockClass}>
            <label className={labelClass}>Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Reference */}
          <div className={fieldBlockClass}>
            <label className={labelClass}>Reference</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div className={fieldBlockClass}>
            <label className={labelClass}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full h-[100px] border border-[#ccc] rounded-[4px] p-[12px] text-[15px] text-[#333] outline-none focus:border-[#12b886] resize-y box-border"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#12b886] hover:bg-[#0ca678] text-white px-6 py-2.5 rounded text-[15px] font-bold border-none transition-colors disabled:opacity-60 flex items-center justify-center min-w-[100px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
