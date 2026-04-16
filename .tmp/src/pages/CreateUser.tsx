import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getClientSession } from "@/hooks/useClientAuth";
import { cn } from "@/lib/utils";

function getCreatableRole(sessionRole: string): { label: string; role: string } {
  const r = sessionRole?.toLowerCase();
  if (r === 'company') return { label: 'SuperAdmin', role: 'superadmin' };
  if (r === 'superadmin') return { label: 'Admin', role: 'admin' };
  if (r === 'admin') return { label: 'SuperMaster', role: 'supermaster' };
  if (r === 'supermaster') return { label: 'Agent', role: 'agent' };
  return { label: 'Client', role: 'client' }; // agent or below
}

export default function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();
  const creatableRole = getCreatableRole(session?.role || '');

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState<"admin_type" | "bettor">("admin_type");
  const [downlineShare, setDownlineShare] = useState(85);
  const [isActive, setIsActive] = useState(true);
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass = "w-full border border-[#d5d8dc] rounded px-3 py-2 text-sm text-[#2c3e50] focus:outline-none focus:border-[#16a085] bg-white";
  const labelClass = "block text-sm text-[#2c3e50] font-medium";
  const rowClass = "flex flex-col lg:flex-row lg:items-start gap-1 lg:gap-6";
  const labelContainerClass = "lg:w-48 lg:pt-2 lg:text-right shrink-0";
  const inputContainerClass = "flex-1";

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Min 6 characters";
    if (type === "admin_type" && (downlineShare < 0 || downlineShare > 85))
      newErrors.downlineShare = "Must be between 0 and 85";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await Client.create({
        username,
        role: type === "admin_type" ? creatableRole.role : "client",
        credit_received: 0,
        credit_remaining: 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: isActive ? "active" : "inactive",
        parent_username: session?.username || "NomanSA8592",
        phone,
        downline_share: type === "admin_type" ? downlineShare : 0,
        reference,
        notes,
      });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "User Created", description: `${username} created successfully.` });
      navigate("/accounts");
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to create user." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f4f6f7] min-h-screen pb-10">
      <main className="max-w-3xl mx-auto mt-4 border border-[#d5d8dc] shadow-sm overflow-hidden">
        {/* Title bar */}
        <div className="bg-[#ecf0f1] px-4 py-3 border-b border-[#d5d8dc]">
          <h1 className="text-base font-bold text-[#2c3e50]">
            Create New User under <span className="font-bold italic">{session?.username || 'Admin'}</span>
          </h1>
        </div>

        {/* White form body */}
        <div className="bg-white px-4 py-8 space-y-6">

          {/* Username */}
          <div className={rowClass}>
            <div className={labelContainerClass}>
              <label className={labelClass}>Username</label>
            </div>
            <div className={inputContainerClass}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
              />
              {errors.username && <p className="text-xs text-[#e74c3c] mt-1">{errors.username}</p>}
            </div>
          </div>

          {/* Password */}
          <div className={rowClass}>
            <div className={labelContainerClass}>
              <label className={labelClass}>Password</label>
            </div>
            <div className={inputContainerClass}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              {errors.password && <p className="text-xs text-[#e74c3c] mt-1">{errors.password}</p>}
            </div>
          </div>

          {/* Type - Radio buttons */}
          <div className={rowClass}>
            <div className={labelContainerClass}>
              <label className={labelClass}>Type</label>
            </div>
            <div className={inputContainerClass}>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="admin_type"
                    checked={type === "admin_type"}
                    onChange={() => setType("admin_type")}
                    className="w-5 h-5 accent-[#16a085] cursor-pointer"
                  />
                  <span className="text-sm text-[#2c3e50]">{creatableRole.label}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="bettor"
                    checked={type === "bettor"}
                    onChange={() => setType("bettor")}
                    className="w-5 h-5 accent-[#16a085] cursor-pointer"
                  />
                  <span className="text-sm text-[#2c3e50]">Bettor</span>
                </label>
              </div>
            </div>
          </div>

          {/* Downline Share - only when admin type */}
          {type === "admin_type" && (
            <div className={rowClass}>
              <div className={labelContainerClass}>
                <label className={labelClass}>Downline Share</label>
              </div>
              <div className={inputContainerClass}>
                <input
                  type="number"
                  min={0}
                  max={85}
                  value={downlineShare}
                  onChange={(e) => setDownlineShare(Number(e.target.value))}
                  className="w-24 border border-[#d5d8dc] rounded px-3 py-2 text-sm text-[#2c3e50] focus:outline-none focus:border-[#16a085] bg-white"
                />
                <p className="text-sm text-[#7f8c8d] mt-1">Max allowed downline share is 0 - 85</p>
                {errors.downlineShare && <p className="text-xs text-[#e74c3c] mt-1">{errors.downlineShare}</p>}
              </div>
            </div>
          )}

          {/* IsActive */}
          <div className={rowClass}>
            <div className={labelContainerClass}>
              <label className={labelClass}>IsActive</label>
            </div>
            <div className={inputContainerClass}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 accent-[#16a085] cursor-pointer mt-1"
                id="isActive"
              />
            </div>
          </div>

          {/* Phone */}
          <div className={rowClass}>
            <div className={labelContainerClass}>
              <label className={labelClass}>Phone</label>
            </div>
            <div className={inputContainerClass}>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Reference */}
          <div className={rowClass}>
            <div className={labelContainerClass}>
              <label className={labelClass}>Reference</label>
            </div>
            <div className={inputContainerClass}>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Notes */}
          <div className={rowClass}>
            <div className={labelContainerClass}>
              <label className={labelClass}>Notes</label>
            </div>
            <div className={inputContainerClass}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Submit container */}
          <div className="pt-4">
             <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-6">
                <div className="hidden lg:block lg:w-48 shrink-0"></div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full lg:w-48 bg-[#16a085] hover:bg-[#138d75] text-white font-medium py-3 rounded text-sm transition-colors disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
