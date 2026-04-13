import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getClientSession } from "@/hooks/useClientAuth";

export default function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState<"company" | "bettor">("company");
  const [downlineShare, setDownlineShare] = useState(85);
  const [isActive, setIsActive] = useState(true);
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass = "w-full border border-[#E0E0E0] rounded px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#26A69A] bg-white";
  const labelClass = "block text-sm text-gray-800 mb-2";

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Min 6 characters";
    if (type === "company" && (downlineShare < 0 || downlineShare > 85))
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
        role: type === "company" ? "supermaster" : "client",
        credit_received: 0,
        credit_remaining: 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: isActive ? "active" : "inactive",
        parent_username: session?.username || "NomanSA8592",
        phone,
        downline_share: type === "company" ? downlineShare : 0,
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
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header />

      <main className="max-w-[480px] mx-auto">
        {/* Title bar */}
        <div className="bg-[#ECEFF1] px-4 py-3 border-b border-[#E0E0E0]">
          <h1 className="text-base font-bold text-gray-900">
            Create New User under <span className="font-bold italic">{session?.username || 'Admin'}</span>
          </h1>
        </div>

        {/* White form body */}
        <div className="bg-white px-4 py-6 space-y-6">

          {/* Username */}
          <div>
            <label className={labelClass}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Type - Radio buttons */}
          <div>
            <label className={labelClass}>Type</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="company"
                  checked={type === "company"}
                  onChange={() => setType("company")}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
                <span className="text-sm text-gray-800">SuperMaster</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="bettor"
                  checked={type === "bettor"}
                  onChange={() => setType("bettor")}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
                <span className="text-sm text-gray-800">Bettor</span>
              </label>
            </div>
          </div>

          {/* Downline Share - only when company */}
          {type === "company" && (
            <div>
              <label className={labelClass}>Downline Share</label>
              <input
                type="number"
                min={0}
                max={85}
                value={downlineShare}
                onChange={(e) => setDownlineShare(Number(e.target.value))}
                className="w-24 border border-[#E0E0E0] rounded px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#26A69A] bg-white"
              />
              <p className="text-sm text-gray-700 mt-1">Max allowed downline share is 0 - 85</p>
              {errors.downlineShare && <p className="text-xs text-red-500 mt-1">{errors.downlineShare}</p>}
            </div>
          )}

          {/* IsActive */}
          <div>
            <label className={labelClass}>IsActive</label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 accent-blue-600 cursor-pointer"
              id="isActive"
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Reference */}
          <div>
            <label className={labelClass}>Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#26A69A] hover:bg-[#00897B] text-white font-medium py-3 rounded text-sm transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>

        </div>
      </main>
    </div>
  );
}
