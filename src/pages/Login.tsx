import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Loader2, Key, Eye, EyeOff } from "lucide-react";
import { Client } from "@/entities";
import { authenticatedLogin } from "@/lib/walletSession";
import { setClientSession } from "@/hooks/useClientAuth";

import { normalizeAccountRole } from "@/lib/accountHierarchy";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forcedModal, setForcedModal] = useState(false);
  const [pendingClient, setPendingClient] = useState<any>(null);
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const cleanUser = username.trim();
    const cleanPw = password;

    if (!cleanUser || !cleanPw) {
      return;
    }
    setLoading(true);

    try {
      // Authenticate through trusted Supabase Edge Function (never fetch password hashes).
      const client = await authenticatedLogin(cleanUser, cleanPw);

      // 5. Set Authenticated Session (without password)
      setClientSession({
        id: client.id,
        username: client.username,
        full_name: client.full_name || client.username,
        role: client.role || "client",
        credit_received: client.credit_received || 0,
        credit_remaining: client.credit_remaining || 0,
        cash: client.cash || 0,
        pl_downline: client.pl_downline || 0,
        balance_upline: client.balance_upline || 0,
        status: client.status || "active",
      });

      // 6. Route Redirection
      if (normalizeAccountRole(client.role) === "bettor") {
        navigate("/play");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setLoginError(err instanceof Error ? err.message : "Authentication service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 4) {
      setPwError("Password must be at least 4 characters");
      return;
    }
    if (newPw === pendingClient?.username) {
      setPwError("New password cannot be same as username");
      return;
    }
    setChangingPw(true);
    try {
      await Client.update(pendingClient.id, { 
        password: newPw 
      });
      setForcedModal(false);
      setSuccessModal(true);
      setTimeout(() => {
        setSuccessModal(false);
        setUsername("");
        setPassword("");
        setNewPw("");
        setPwError("");
        setPendingClient(null);
      }, 2500);
    } catch (e) {
      setPwError("Failed to update password. Try again.");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="bpexch-login">
      {/* Background: Geometric Triangle Facets Pattern matching Screenshot_20260928-161801.jpg */}
      <div 
        className="bpexch-login-background"
        style={{
          backgroundColor: "#333333",
          backgroundImage: "url('/login-background.png')",
          backgroundSize: "auto",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Main Login Card: Exact match to original bpexch screenshot */}
      <div className="bpexch-login-container">
        <div 
          className="bpexch-login-card"
          style={{
            background: "linear-gradient(180deg, #3e6d8d, #121d30)",
            boxShadow: "none",
          }}
        >
          {/* Top Logo: Aqua-Mint Circle with BP Letters */}
          <div className="bpexch-login-logo">
            <img src="/login-bp.jpg" alt="BP" width={120} height={120} />
          </div>

          <form onSubmit={handleLogin} className="bpexch-login-form">
            {/* Username Field: Icon on left, thin underline border */}
            <div className="group">
              <div className="bpexch-login-field">
                <User 
                  size={19} 
                  className="text-white shrink-0 fill-white" 
                  color="#ffffff"
                  strokeWidth={1}
                />
                <input
                  type="text"
                  placeholder="Username"
                  aria-label="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  required
                  autoComplete="username"
                  className="w-full bg-transparent text-white text-[15px] font-normal placeholder:text-[#d1dbe6] focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field: Padlock icon on left, thin underline border */}
            <div className="group">
              <div className="bpexch-login-field">
                <Lock 
                  size={19} 
                  className="text-white shrink-0 fill-white" 
                  color="#ffffff"
                  strokeWidth={1} 
                />
                <input
                  type="password"
                  placeholder="Password"
                  aria-label="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent text-white text-[15px] font-normal placeholder:text-[#d1dbe6] focus:outline-none"
                />
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="text-[#ff5c5c] text-center text-[13.5px] font-medium pt-1 animate-in fade-in duration-200">
                {loginError}
              </div>
            )}

            {/* Login Button: Centered Pill Shaped Blue Gradient Button */}
            <div className="bpexch-login-submit">
              <button
                type="submit"
                disabled={loading}
                className="bpexch-login-button"
                style={{
                  background: "linear-gradient(180deg, #8dbed7, #15364a)",
                  boxShadow: "0 10px 22px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Login...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Forced Password Reset Modal */}
      {forcedModal && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/75 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(6px)' }}
        >
          <div className="w-full max-w-[450px] bg-[#10243e] border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white">
            <div className="bg-[#0b1b30] px-6 py-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#20c9c9]/20 flex items-center justify-center text-[#20c9c9]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white text-base font-bold">Change Password Required</h2>
                <p className="text-xs text-gray-400">First time login requires setting a new password.</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1 font-medium">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPw}
                  onChange={(e) => {
                    setNewPw(e.target.value);
                    setPwError("");
                  }}
                  className="w-full bg-[#081525] border border-white/20 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#20c9c9]"
                />
              </div>

              {pwError && (
                <div className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded border border-red-800/40">
                  {pwError}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setForcedModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-gray-700/60 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={changingPw}
                  className="flex-1 py-2.5 rounded-lg bg-[#20c9c9] hover:bg-[#1bb5b5] text-[#0a1a2e] text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Login"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-[1001] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-[#10243e] border border-emerald-500/40 text-white rounded-xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Password Changed Successfully</h2>
            <p className="text-sm text-gray-300">Your password has been updated. Please login again with your new password.</p>
          </div>
        </div>
      )}
    </div>
  );
}
