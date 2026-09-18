import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Client, checkUsernameExists } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getClientSession } from "@/hooks/useClientAuth";
import { Loader2, Check, ArrowLeft } from "lucide-react";

function getCreatableRole(sessionRole: string): { label: string; role: string } {
  const r = sessionRole?.toLowerCase();
  if (r === 'company') return { label: 'SuperAdmin', role: 'superadmin' };
  if (r === 'superadmin') return { label: 'Admin', role: 'admin' };
  if (r === 'admin') return { label: 'SuperMaster', role: 'supermaster' };
  if (r === 'supermaster') return { label: 'Agent', role: 'agent' };
  return { label: 'SuperAdmin', role: 'superadmin' }; 
}

export default function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();
  const username = session?.username || 'Book';
  const creatableRole = getCreatableRole(session?.role || '');

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    type: "admin_type" as "admin_type" | "bettor",
    downlineShare: 0,
    isActive: false,
    phone: "",
    reference: "",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleUsernameBlur = async () => {
    const raw = formData.username.trim();
    if (!raw) return;
    setCheckingUsername(true);
    try {
      const exists = await checkUsernameExists(raw);
      if (exists) {
        setErrors((prev) => ({
          ...prev,
          username: "Username already exists. Please choose a different username",
        }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          if (next.username === "Username already exists. Please choose a different username") {
            delete next.username;
          }
          return next;
        });
      }
    } catch {
      // ignore
    } finally {
      setCheckingUsername(false);
    }
  };

  const validate = async () => {
    const newErrors: Record<string, string> = {};
    const trimmedUsername = formData.username.trim();
    if (!trimmedUsername) {
      newErrors.username = "Username is required";
    } else if (trimmedUsername.length < 3) {
      newErrors.username = "Min 3 characters";
    } else {
      const exists = await checkUsernameExists(trimmedUsername);
      if (exists) {
        newErrors.username = "Username already exists. Please choose a different username";
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 4) {
      newErrors.password = "Min 4 characters";
    }

    if (formData.downlineShare < 0 || formData.downlineShare > 85) {
      newErrors.downlineShare = "Must be between 0 and 85";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const isValid = await validate();
    if (!isValid) {
      if (errors.username || !formData.username.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: errors.username || "Please fix form errors.",
        });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await Client.create({
        username: formData.username.trim(),
        password: formData.password.trim(),
        role: formData.type === "admin_type" ? creatableRole.role : "client",
        credit_received: 0,
        credit_remaining: 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: formData.isActive ? "active" : "inactive",
        parent_username: username,
        phone: formData.phone,
        downline_share: formData.downlineShare,
        reference: formData.reference,
        notes: formData.notes,
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      navigate("/accounts");
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "Failed to create user.";
      if (msg.includes("Username already exists")) {
        setErrors((prev) => ({
          ...prev,
          username: "Username already exists. Please choose a different username",
        }));
      }
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-50px)] bg-[#f4f6f9] p-2 sm:p-4 pb-24 font-sans antialiased text-[#212529]">
      <div className="max-w-[720px] mx-auto">
        {/* Main Card Container matching screenshot */}
        <div className="bg-white border border-[#dee2e6] rounded-[2px] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-[#f0f3f8] px-4 py-2.5 border-b border-[#dee2e6] flex items-center justify-between">
            <h1 className="text-[15px] font-bold text-[#212529]">
              Create New User under <span className="italic font-bold">{username}</span>
            </h1>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[14.5px] font-medium text-[#212529] mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  if (errors.username) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.username;
                      return next;
                    });
                  }
                }}
                onBlur={handleUsernameBlur}
                className="w-full h-[36px] px-3 text-[14.5px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#86b7fe] focus:ring-1 focus:ring-[#86b7fe] transition-all"
              />
              {checkingUsername && (
                <p className="text-[11.5px] text-[#6c757d] mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                </p>
              )}
              {errors.username && (
                <p className="text-[12px] text-[#dc3545] font-medium mt-1">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[14.5px] font-medium text-[#212529] mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.password;
                      return next;
                    });
                  }
                }}
                className="w-full h-[36px] px-3 text-[14.5px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#86b7fe] focus:ring-1 focus:ring-[#86b7fe] transition-all"
              />
              {errors.password && (
                <p className="text-[12px] text-[#dc3545] font-medium mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Type Radio Options */}
            <div>
              <label className="block text-[14.5px] font-medium text-[#212529] mb-1.5">
                Type
              </label>
              <div className="flex items-center gap-6 pt-0.5">
                <label className="inline-flex items-center gap-2 text-[14px] text-[#212529] cursor-pointer">
                  <input
                    type="radio"
                    name="account_type"
                    checked={formData.type === "admin_type"}
                    onChange={() => setFormData({ ...formData, type: "admin_type" })}
                    className="w-4 h-4 text-[#0d6efd] accent-[#0d6efd] cursor-pointer"
                  />
                  <span>{creatableRole.label}</span>
                </label>

                <label className="inline-flex items-center gap-2 text-[14px] text-[#212529] cursor-pointer">
                  <input
                    type="radio"
                    name="account_type"
                    checked={formData.type === "bettor"}
                    onChange={() => setFormData({ ...formData, type: "bettor" })}
                    className="w-4 h-4 text-[#0d6efd] accent-[#0d6efd] cursor-pointer"
                  />
                  <span>Bettor</span>
                </label>
              </div>
            </div>

            {/* Downline Share */}
            <div>
              <label className="block text-[14.5px] font-medium text-[#212529] mb-1">
                Downline Share
              </label>
              <input
                type="number"
                value={formData.downlineShare}
                onChange={(e) => setFormData({ ...formData, downlineShare: Number(e.target.value) })}
                className="w-[85px] h-[36px] px-3 text-[14.5px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#86b7fe]"
              />
              <p className="text-[13px] text-[#495057] mt-1.5 font-normal">
                Max allowed downline share is 0 - 85
              </p>
              {errors.downlineShare && (
                <p className="text-[12px] text-[#dc3545] font-medium mt-1">
                  {errors.downlineShare}
                </p>
              )}
            </div>

            {/* IsActive Checkbox */}
            <div>
              <label className="block text-[14.5px] font-medium text-[#212529] mb-1">
                IsActive
              </label>
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-[18px] h-[18px] text-[#0d6efd] accent-[#0d6efd] rounded-[3px] border-[#ced4da] cursor-pointer"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[14.5px] font-medium text-[#212529] mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-[36px] px-3 text-[14.5px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#86b7fe] focus:ring-1 focus:ring-[#86b7fe] transition-all"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-[14.5px] font-medium text-[#212529] mb-1">
                Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full h-[36px] px-3 text-[14.5px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#86b7fe] focus:ring-1 focus:ring-[#86b7fe] transition-all"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[14.5px] font-medium text-[#212529] mb-1">
                Notes
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full h-[36px] px-3 text-[14.5px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#86b7fe] focus:ring-1 focus:ring-[#86b7fe] transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#00b181] hover:bg-[#00936b] text-white font-semibold text-[14px] px-6 py-2 rounded-[4px] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Create User</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/accounts")}
                className="bg-[#6c757d] hover:bg-[#5a6268] text-white font-semibold text-[14px] px-4 py-2 rounded-[4px] transition-colors cursor-pointer"
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
