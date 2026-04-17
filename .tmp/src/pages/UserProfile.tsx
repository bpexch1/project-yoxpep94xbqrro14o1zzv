import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, User as UserIcon, Lock, Shield, Phone, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function UserProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const session = getClientSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch live client data
  const { data: clients, isLoading } = useQuery({
    queryKey: ["client-profile", session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username,
  });

  const clientData = clients?.[0];

  if (!session) {
    navigate("/login");
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientData) return;
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "New passwords do not match." });
      return;
    }
    if (oldPassword !== clientData.password) {
      toast({ variant: "destructive", title: "Error", description: "Current password is incorrect." });
      return;
    }
    if (newPassword.length < 4) {
      toast({ variant: "destructive", title: "Error", description: "New password must be at least 4 characters." });
      return;
    }
    setChangingPassword(true);
    try {
      await Client.update(clientData.id, { password: newPassword });
      toast({ title: "Password Changed", description: "Your password has been updated successfully." });
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["client-profile"] });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not update password. Try again." });
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = (clientData?.full_name || session.username || "U").slice(0, 2).toUpperCase();

  const balanceCards = [
    { label: "Cash Balance", value: clientData?.cash ?? 0, color: "#16a085", prefix: "₹" },
    { label: "Credit Received", value: clientData?.credit_received ?? 0, color: "#2980b9", prefix: "₹" },
    { label: "Credit Remaining", value: clientData?.credit_remaining ?? 0, color: "#8e44ad", prefix: "₹" },
    { label: "P/L Downline", value: clientData?.pl_downline ?? 0, color: (clientData?.pl_downline ?? 0) >= 0 ? "#16a085" : "#e74c3c", prefix: "₹" },
    { label: "Balance Upline", value: clientData?.balance_upline ?? 0, color: "#e67e22", prefix: "₹" },
  ];

  return (
    <div className="min-h-screen bg-[#d6e4f0] text-[#1e3a5c]">
      <UserHeader
        userEmail={session.username}
        clientBalance={clientData?.cash ?? 0}
        creditRemaining={clientData?.credit_remaining ?? 0}
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="max-w-2xl mx-auto px-3 py-4 pb-12">
        {/* Back button */}
        <button
          onClick={() => navigate("/play")}
          className="flex items-center gap-1 text-[#1e3a5c] mb-4 hover:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back to Dashboard</span>
        </button>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1e3a5c] animate-spin" />
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="rounded-2xl overflow-hidden shadow-lg mb-4" style={{ background: "linear-gradient(135deg, #1e3a5c 0%, #254465 100%)" }}>
              {/* Top section */}
              <div className="flex flex-col items-center pt-8 pb-6 px-6">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg" style={{ background: "#3dd6c8" }}>
                  <span style={{ fontFamily: "Pacifico, cursive", fontSize: "1.8rem", color: "#0d2640", lineHeight: 1 }}>{initials}</span>
                </div>
                <h2 className="text-white text-xl font-bold">{clientData?.full_name || session.username}</h2>
                <p className="text-white/60 text-sm mt-0.5">@{session.username}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide" style={{ background: "#3dd6c8", color: "#0d2640" }}>
                    {clientData?.role || session.role}
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase" style={{ background: clientData?.status === "active" ? "rgba(22,160,133,0.2)" : "rgba(231,76,60,0.2)", color: clientData?.status === "active" ? "#3dd6c8" : "#e74c3c" }}>
                    {clientData?.status === "active" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {clientData?.status || "active"}
                  </span>
                </div>
              </div>

              {/* Info Row */}
              <div className="border-t border-white/10 grid grid-cols-2 divide-x divide-white/10">
                <div className="flex items-center gap-3 px-5 py-4">
                  <UserIcon className="w-4 h-4 text-white/40 shrink-0" />
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Username</p>
                    <p className="text-white text-sm font-semibold">{session.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-4">
                  <Phone className="w-4 h-4 text-white/40 shrink-0" />
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Phone</p>
                    <p className="text-white text-sm font-semibold">{clientData?.phone || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {balanceCards.map((card) => (
                <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-white/60 flex flex-col gap-1">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">{card.label}</p>
                  <p className="text-xl font-black" style={{ color: card.color }}>
                    {card.prefix}{(card.value || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100" style={{ background: "#1e3a5c" }}>
                <Lock className="w-4 h-4 text-[#3dd6c8]" />
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Change Password</h3>
              </div>
              <form onSubmit={handleChangePassword} className="p-5 flex flex-col gap-4">
                {[
                  { label: "Current Password", value: oldPassword, setter: setOldPassword },
                  { label: "New Password", value: newPassword, setter: setNewPassword },
                  { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword },
                ].map(({ label, value, setter }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
                    <input
                      type="password"
                      value={value}
                      onChange={e => setter(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#1e3a5c] transition-colors"
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold uppercase tracking-wider mt-1 disabled:opacity-60 active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg, #1e3a5c, #254465)" }}
                >
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
