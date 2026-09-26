import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Client, checkUsernameExists } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getClientSession } from "@/hooks/useClientAuth";
import { Loader2 } from "lucide-react";

export default function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();
  const username = session?.username || 'QRT005';

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    type: "SuperMaster" as "SuperMaster" | "Bettor",
    isActive: true,
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
        role: formData.type === "SuperMaster" ? "supermaster" : "client",
        credit_received: 0,
        credit_remaining: 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: formData.isActive ? "active" : "inactive",
        parent_username: username,
        phone: formData.phone,
        downline_share: 85,
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
    <div className="min-h-screen bg-[#ececed] p-2 sm:p-4 pb-24 text-[#212529]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div className="w-full max-w-[800px] mx-auto">
        {/* Main Card Container matching video */}
        <div className="bg-white border border-[#dee2e6] rounded-[4px] shadow-xs overflow-hidden">
          {/* Header */}
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#dee2e6]">
            <h1 className="text-[15px] font-bold text-[#212529]">
              Create New User under <span className="italic font-bold">{username}</span>
            </h1>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">
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
                className="w-full h-[36px] px-3 text-[14px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#00a65a] transition-colors"
              />
              {checkingUsername && (
                <p className="text-[11.5px] text-[#6c757d] mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-[#00a65a]" /> Checking availability...
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
              <label className="block text-[14px] font-medium text-[#212529] mb-1">
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
                className="w-full h-[36px] px-3 text-[14px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#00a65a] transition-colors"
              />
              {errors.password && (
                <p className="text-[12px] text-[#dc3545] font-medium mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Type Radio Options */}
            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1.5">
                Type
              </label>
              <div className="flex items-center gap-6 pt-0.5">
                <label className="inline-flex items-center gap-2 text-[14px] text-[#212529] cursor-pointer">
                  <input
                    type="radio"
                    name="account_type"
                    checked={formData.type === "SuperMaster"}
                    onChange={() => setFormData({ ...formData, type: "SuperMaster" })}
                    className="w-4 h-4 text-[#00a65a] accent-[#00a65a] cursor-pointer"
                  />
                  <span>SuperMaster</span>
                </label>

                <label className="inline-flex items-center gap-2 text-[14px] text-[#212529] cursor-pointer">
                  <input
                    type="radio"
                    name="account_type"
                    checked={formData.type === "Bettor"}
                    onChange={() => setFormData({ ...formData, type: "Bettor" })}
                    className="w-4 h-4 text-[#00a65a] accent-[#00a65a] cursor-pointer"
                  />
                  <span>Bettor</span>
                </label>
              </div>
            </div>

            {/* IsActive Checkbox */}
            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">
                IsActive
              </label>
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#00a65a] accent-[#00a65a] rounded-[3px] border-[#ced4da] cursor-pointer"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-[36px] px-3 text-[14px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#00a65a] transition-colors"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">
                Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full h-[36px] px-3 text-[14px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#00a65a] transition-colors"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#ced4da] rounded-[4px] outline-none focus:border-[#00a65a] transition-colors resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#00a65a] hover:bg-[#00924f] text-white font-medium text-[14px] px-6 py-2 rounded-[3px] transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
