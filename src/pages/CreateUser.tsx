import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState<"supermaster" | "bettor">("bettor");
  const [downlineShare, setDownlineShare] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (downlineShare < 0 || downlineShare > 85) newErrors.downlineShare = "Must be between 0 and 85";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await Client.create({
        username,
        role: type === "bettor" ? "client" : "supermaster",
        credit_received: 0,
        credit_remaining: 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: isActive ? "active" : "inactive",
        parent_username: "NomanSA8592",
        phone,
        downline_share: downlineShare,
        reference,
        notes,
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "User Created",
        description: `User ${username} has been created successfully.`,
      });
      navigate("/accounts");
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create user. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Title */}
        <h1 className="text-lg font-bold text-gray-900 mb-6 italic">
          Create New User under <span className="italic">NomanSA8592</span>
        </h1>

        <div className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm text-gray-800 mb-1 font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-800 mb-1 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Type — Radio */}
          <div>
            <label className="block text-sm text-gray-800 mb-2 font-medium">Type</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="supermaster"
                  checked={type === "supermaster"}
                  onChange={() => setType("supermaster")}
                  className="w-4 h-4 accent-teal-500"
                />
                <span className="text-sm">SuperMaster</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="bettor"
                  checked={type === "bettor"}
                  onChange={() => setType("bettor")}
                  className="w-4 h-4 accent-teal-500"
                />
                <span className="text-sm">Bettor</span>
              </label>
            </div>
          </div>

          {/* Downline Share */}
          <div>
            <label className="block text-sm text-gray-800 mb-1 font-medium">Downline Share</label>
            <input
              type="number"
              value={downlineShare}
              min={0}
              max={85}
              onChange={(e) => setDownlineShare(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:border-teal-500"
            />
            <p className="text-xs text-gray-500 mt-1">Max allowed downline share is 0 - 85</p>
            {errors.downlineShare && <p className="text-xs text-red-500 mt-1">{errors.downlineShare}</p>}
          </div>

          {/* IsActive checkbox */}
          <div>
            <label className="block text-sm text-gray-800 mb-1 font-medium">IsActive</label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-800 mb-1 font-medium">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm text-gray-800 mb-1 font-medium">Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-800 mb-1 font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Save button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-2.5 rounded text-sm transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
