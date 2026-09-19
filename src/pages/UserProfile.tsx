import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getClientSession } from "@/hooks/useClientAuth";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";

export default function UserProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = getClientSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    const r = session.role?.toLowerCase()?.trim();
    if (r && r !== "client" && r !== "user" && r !== "bettor") {
      navigate("/dashboard", { replace: true });
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

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast({ variant: "destructive", title: "Error", description: "Please enter new password." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }
    toast({ title: "Success", description: "Password changed successfully." });
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div
      className="min-h-screen text-[#212529] select-none"
      style={{
        backgroundColor: "#e8eff5",
        fontFamily:
          '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="max-w-4xl mx-auto p-2 sm:p-4 pb-20">
        {/* Profile Card */}
        <div className="bg-white rounded-none border border-[#c8d4e2] shadow-sm mb-4">
          <div className="px-3 py-2 bg-[#eaeff5] border-b border-[#cbd7e6]">
            <span className="font-bold text-[14px] text-[#142a45]">Profile</span>
          </div>

          <form onSubmit={handleSaveStakes} className="p-4 space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-[#142a45] mb-1">Stake1</label>
              <input
                type="text"
                value={stakes.stake1}
                onChange={(e) => setStakes({ ...stakes, stake1: e.target.value })}
                className="w-full border border-[#c8d4e2] bg-white px-3 py-2 text-sm text-[#142a45] rounded-none focus:outline-none focus:border-[#00a676]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#142a45] mb-1">Stake2</label>
              <input
                type="text"
                value={stakes.stake2}
                onChange={(e) => setStakes({ ...stakes, stake2: e.target.value })}
                className="w-full border border-[#c8d4e2] bg-white px-3 py-2 text-sm text-[#142a45] rounded-none focus:outline-none focus:border-[#00a676]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#142a45] mb-1">Stake3</label>
              <input
                type="text"
                value={stakes.stake3}
                onChange={(e) => setStakes({ ...stakes, stake3: e.target.value })}
                className="w-full border border-[#c8d4e2] bg-white px-3 py-2 text-sm text-[#142a45] rounded-none focus:outline-none focus:border-[#00a676]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#142a45] mb-1">Stake4</label>
              <input
                type="text"
                value={stakes.stake4}
                onChange={(e) => setStakes({ ...stakes, stake4: e.target.value })}
                className="w-full border border-[#c8d4e2] bg-white px-3 py-2 text-sm text-[#142a45] rounded-none focus:outline-none focus:border-[#00a676]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#142a45] mb-1">Plus1</label>
              <input
                type="text"
                value={stakes.plus1}
                onChange={(e) => setStakes({ ...stakes, plus1: e.target.value })}
                className="w-full border border-[#c8d4e2] bg-white px-3 py-2 text-sm text-[#142a45] rounded-none focus:outline-none focus:border-[#00a676]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#142a45] mb-1">Plus2</label>
              <input
                type="text"
                value={stakes.plus2}
                onChange={(e) => setStakes({ ...stakes, plus2: e.target.value })}
                className="w-full border border-[#c8d4e2] bg-white px-3 py-2 text-sm text-[#142a45] rounded-none focus:outline-none focus:border-[#00a676]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#142a45] mb-1">Plus3</label>
              <input
                type="text"
                value={stakes.plus3}
                onChange={(e) => setStakes({ ...stakes, plus3: e.target.value })}
                className="w-full border border-[#c8d4e2] bg-white px-3 py-2 text-sm text-[#142a45] rounded-none focus:outline-none focus:border-[#00a676]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#142a45] mb-1">Plus4</label>
              <input
                type="text"
                value={stakes.plus4}
                onChange={(e) => setStakes({ ...stakes, plus4: e.target.value })}
                className="w-full border border-[#c8d4e2] bg-white px-3 py-2 text-sm text-[#142a45] rounded-none focus:outline-none focus:border-[#00a676]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="bg-[#28a745] hover:bg-[#218838] text-white font-medium text-xs px-4 py-2 rounded-none transition-colors"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => navigate("/play")}
                className="bg-[#dc3545] hover:bg-[#c82333] text-white font-medium text-xs px-4 py-2 rounded-none transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-none border border-[#c8d4e2] shadow-sm">
          <div className="px-3 py-2 bg-[#eaeff5] border-b border-[#cbd7e6]">
            <span className="font-bold text-[14px] text-[#142a45]">Change Password</span>
          </div>

          <form onSubmit={handlePasswordChange} className="p-4 space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-[#142a45] mb-1">NewPassword</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-[#c8d4e2] bg-white px-3 py-2 text-sm text-[#142a45] rounded-none focus:outline-none focus:border-[#00a676]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#142a45] mb-1">ConfirmPassword</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-[#c8d4e2] bg-white px-3 py-2 text-sm text-[#142a45] rounded-none focus:outline-none focus:border-[#00a676]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-[#28a745] hover:bg-[#218838] text-white font-medium text-xs px-4 py-2 rounded-none transition-colors"
              >
                Change password
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

