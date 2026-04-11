import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield } from "lucide-react";

export default function CreateCompanyAccount() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [downlineShare, setDownlineShare] = useState(100);
  const [isActive, setIsActive] = useState(true);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (downlineShare < 0 || downlineShare > 100) {
      newErrors.downlineShare = "Must be between 0 and 100";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await Client.create({
        username,
        full_name: fullName,
        role: "superadmin",
        credit_received: 0,
        credit_remaining: 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: isActive ? "active" : "inactive",
        parent_username: "", // Top level
        phone,
        downline_share: downlineShare,
        reference,
        notes,
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Company Account Created",
        description: `SuperAdmin ${username} has been created successfully.`,
      });
      navigate("/accounts");
    } catch (error) {
      console.error("Error creating company account:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create company account. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Card */}
        <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
          
          {/* Gray title bar */}
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h1 className="text-sm font-bold text-gray-900 uppercase">
                Create Company Account (SuperAdmin)
              </h1>
            </div>
          </div>

          {/* Form body */}
          <div className="p-6 space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Username *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                  placeholder="e.g. company_main"
                />
                {errors.username && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.username}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                />
                {errors.password && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.password}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>
            </div>

            {/* Downline Share */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Downline Share (%)</label>
              <input
                type="number"
                value={downlineShare}
                min={0}
                max={100}
                onChange={(e) => setDownlineShare(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2.5 text-sm w-32 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
              <p className="text-[10px] text-gray-500 mt-1 font-medium">Standard range is 0 - 100 for top level</p>
              {errors.downlineShare && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.downlineShare}</p>}
            </div>

            {/* IsActive */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded border border-gray-200">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-6 h-6 accent-emerald-500 cursor-pointer"
                id="isActive"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-gray-800 cursor-pointer select-none">
                Account Active
                <span className="block text-[10px] font-normal text-gray-500 uppercase mt-0.5">Toggle status for new account</span>
              </label>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>
          </div>

          {/* Footer with Submit button */}
          <div className="bg-gray-100 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-10 py-3 rounded text-sm transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Processing..." : "Create Account"}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
