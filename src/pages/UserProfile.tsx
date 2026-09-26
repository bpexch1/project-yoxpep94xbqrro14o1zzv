import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getClientSession } from "@/hooks/useClientAuth";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/entities";

export default function UserProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = getClientSession();

  useEffect(() => {
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
  }, [session, navigate]);

  // Stakes & Plus values
  const [stakes, setStakes] = useState({
    stake1: "2000",
    stake2: "5000",
    stake3: "10000",
    stake4: "25000",
    plus1: "1000",
    plus2: "5000",
    plus3: "10000",
    plus4: "25000",
  });

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!session) {
    return null;
  }

  const handleSaveStakes = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("user_custom_stakes", JSON.stringify(stakes));
    toast({
      title: "Success",
      description: "Profile stakes updated successfully.",
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 4 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }
    try {
      if (session?.id) {
        await Client.update(session.id, { password: newPassword });
      }
      toast({ title: "Success", description: "Password changed successfully." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to change password." });
    }
  };

  return (
    <div className="min-h-screen bg-[#ececed] text-[#212529] p-2 sm:p-4 pb-20" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <main className="max-w-[700px] mx-auto space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-[4px] border border-[#dee2e6] shadow-xs overflow-hidden">
          <div className="px-3.5 py-2.5 bg-[#f8f9fa] border-b border-[#dee2e6]">
            <span className="font-bold text-[15px] text-[#212529]">Profile</span>
          </div>

          <form onSubmit={handleSaveStakes} className="p-4 space-y-3.5">
            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">Stake1</label>
              <input
                type="text"
                value={stakes.stake1}
                onChange={(e) => setStakes({ ...stakes, stake1: e.target.value })}
                className="w-full border border-[#ced4da] bg-white px-3 py-1.5 text-[14px] text-[#495057] rounded-[4px] focus:outline-none focus:border-[#00a65a]"
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">Stake2</label>
              <input
                type="text"
                value={stakes.stake2}
                onChange={(e) => setStakes({ ...stakes, stake2: e.target.value })}
                className="w-full border border-[#ced4da] bg-white px-3 py-1.5 text-[14px] text-[#495057] rounded-[4px] focus:outline-none focus:border-[#00a65a]"
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">Stake3</label>
              <input
                type="text"
                value={stakes.stake3}
                onChange={(e) => setStakes({ ...stakes, stake3: e.target.value })}
                className="w-full border border-[#ced4da] bg-white px-3 py-1.5 text-[14px] text-[#495057] rounded-[4px] focus:outline-none focus:border-[#00a65a]"
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">Stake4</label>
              <input
                type="text"
                value={stakes.stake4}
                onChange={(e) => setStakes({ ...stakes, stake4: e.target.value })}
                className="w-full border border-[#ced4da] bg-white px-3 py-1.5 text-[14px] text-[#495057] rounded-[4px] focus:outline-none focus:border-[#00a65a]"
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">Plus1</label>
              <input
                type="text"
                value={stakes.plus1}
                onChange={(e) => setStakes({ ...stakes, plus1: e.target.value })}
                className="w-full border border-[#ced4da] bg-white px-3 py-1.5 text-[14px] text-[#495057] rounded-[4px] focus:outline-none focus:border-[#00a65a]"
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">Plus2</label>
              <input
                type="text"
                value={stakes.plus2}
                onChange={(e) => setStakes({ ...stakes, plus2: e.target.value })}
                className="w-full border border-[#ced4da] bg-white px-3 py-1.5 text-[14px] text-[#495057] rounded-[4px] focus:outline-none focus:border-[#00a65a]"
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">Plus3</label>
              <input
                type="text"
                value={stakes.plus3}
                onChange={(e) => setStakes({ ...stakes, plus3: e.target.value })}
                className="w-full border border-[#ced4da] bg-white px-3 py-1.5 text-[14px] text-[#495057] rounded-[4px] focus:outline-none focus:border-[#00a65a]"
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#212529] mb-1">Plus4</label>
              <input
                type="text"
                value={stakes.plus4}
                onChange={(e) => setStakes({ ...stakes, plus4: e.target.value })}
                className="w-full border border-[#ced4da] bg-white px-3 py-1.5 text-[14px] text-[#495057] rounded-[4px] focus:outline-none focus:border-[#00a65a]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="bg-[#28a745] hover:bg-[#218838] text-white font-medium text-[13px] px-3.5 py-1.5 rounded-[3px] transition-colors cursor-pointer"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="bg-[#dc3545] hover:bg-[#c82333] text-white font-medium text-[13px] px-3.5 py-1.5 rounded-[3px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="p-3 bg-[#d4edda] border border-[#c3e6cb] rounded-[4px] text-[#155724] text-[13.5px] mt-2">
              <span className="font-bold">Note:</span> Updated stakes will be applied to new users.
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
