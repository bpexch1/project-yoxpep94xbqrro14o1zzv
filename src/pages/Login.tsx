import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Loader2, Key, Eye, EyeOff } from "lucide-react";
import { Client } from "@/entities";
import { supabase } from "@/integrations/supabase";
import { setClientSession } from "@/hooks/useClientAuth";
import { BPLogo } from "@/components/icons/BPLogo";
import bcrypt from "bcryptjs";

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
      // 1. Fetch user credentials directly and securely from clients table
      let client: any = null;

      const res1 = await supabase
        .from("clients")
        .select("id, username, full_name, role, password, status, credit_received, credit_remaining, cash, pl_downline, balance_upline")
        .ilike("username", cleanUser);

      if (res1.data && Array.isArray(res1.data) && res1.data.length > 0) {
        client = res1.data.find(
          (c: any) => (c.username || "").trim().toLowerCase() === cleanUser.toLowerCase()
        ) || res1.data[0];
      } else if (res1.data && !Array.isArray(res1.data)) {
        client = res1.data;
      }

      // Fallback exact match
      if (!client) {
        const res2 = await supabase
          .from("clients")
          .select("id, username, full_name, role, password, status, credit_received, credit_remaining, cash, pl_downline, balance_upline")
          .eq("username", cleanUser);

        if (res2.data && Array.isArray(res2.data) && res2.data.length > 0) {
          client = res2.data[0];
        } else if (res2.data && !Array.isArray(res2.data)) {
          client = res2.data;
        }
      }

      if (!client) {
        setLoginError("Username/Password Incorrect.");
        return;
      }

      // 2. Verify Password (BCrypt $2a$/$2b$/$2y$ with seamless plain-text fallback)
      const storedPw = String(client.password ?? "");
      const isBcrypt =
        storedPw.startsWith("$2a$") ||
        storedPw.startsWith("$2b$") ||
        storedPw.startsWith("$2y$");

      let isMatch = false;
      if (isBcrypt) {
        try {
          isMatch = bcrypt.compareSync(cleanPw, storedPw);
        } catch {
          isMatch = false;
        }
      }

      // Plain-text fallback if not verified via bcrypt or non-bcrypt
      if (!isMatch) {
        isMatch = storedPw === cleanPw || storedPw.trim() === cleanPw.trim();
      }

      // Immediately scrub password from client object
      delete client.password;

      if (!isMatch) {
        setLoginError("Username/Password Incorrect.");
        return;
      }

      // 3. Account Status Validation
      if (["inactive", "locked", "suspended"].includes(client.status)) {
        setLoginError("Account Inactive or Suspended. Contact Upline.");
        return;
      }

      // 4. Forced Password Change Check
      if (client.must_change_pw) {
        setPendingClient({ ...client });
        setForcedModal(true);
        return;
      }

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
      if (client.role === "client") {
        navigate("/play");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setLoginError("Username/Password Incorrect.");
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
    <div className="relative min-h-[100dvh] min-h-screen w-full flex items-center justify-center p-4 overflow-x-hidden bg-[#0d0f12]">
      {/* Background: Geometric Dark Charcoal/Black Triangle Pattern with Soft Vignette Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundColor: "#0d0f12",
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(18, 42, 69, 0.45) 0%, rgba(10, 15, 22, 0.88) 70%, #080a0c 100%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'%3E%3Cg fill-rule='evenodd'%3E%3Cpolygon fill='%23191c21' points='0 0 105 0 52.5 84'/%3E%3Cpolygon fill='%23131518' points='105 0 210 0 157.5 84'/%3E%3Cpolygon fill='%231d2026' points='210 0 315 0 262.5 84'/%3E%3Cpolygon fill='%2316181d' points='315 0 420 0 367.5 84'/%3E%3Cpolygon fill='%2322262d' points='52.5 84 157.5 84 105 0'/%3E%3Cpolygon fill='%23181a1f' points='157.5 84 262.5 84 210 0'/%3E%3Cpolygon fill='%23252932' points='262.5 84 367.5 84 315 0'/%3E%3Cpolygon fill='%2314161a' points='0 0 52.5 84 0 168'/%3E%3Cpolygon fill='%2320242b' points='52.5 84 157.5 84 105 168'/%3E%3Cpolygon fill='%231a1d23' points='157.5 84 262.5 84 210 168'/%3E%3Cpolygon fill='%23272c35' points='262.5 84 367.5 84 315 168'/%3E%3Cpolygon fill='%2315171c' points='367.5 84 420 0 420 168'/%3E%3Cpolygon fill='%23181b20' points='0 168 52.5 84 105 168'/%3E%3Cpolygon fill='%23262b34' points='105 168 157.5 84 210 168'/%3E%3Cpolygon fill='%231b1e25' points='210 168 262.5 84 315 168'/%3E%3Cpolygon fill='%232a2f3a' points='315 168 367.5 84 420 168'/%3E%3Cpolygon fill='%2316181e' points='0 168 105 168 52.5 252'/%3E%3Cpolygon fill='%2322262e' points='105 168 210 168 157.5 252'/%3E%3Cpolygon fill='%2317191f' points='210 168 315 168 262.5 252'/%3E%3Cpolygon fill='%23242932' points='315 168 420 168 367.5 252'/%3E%3Cpolygon fill='%231c2027' points='52.5 252 157.5 252 105 168'/%3E%3Cpolygon fill='%2314161a' points='157.5 252 262.5 252 210 168'/%3E%3Cpolygon fill='%23232831' points='262.5 252 367.5 252 315 168'/%3E%3Cpolygon fill='%23191c22' points='0 168 52.5 252 0 336'/%3E%3Cpolygon fill='%23282d37' points='52.5 252 157.5 252 105 336'/%3E%3Cpolygon fill='%2317191e' points='157.5 252 262.5 252 210 336'/%3E%3Cpolygon fill='%2322262e' points='262.5 252 367.5 252 315 336'/%3E%3Cpolygon fill='%23181a1f' points='367.5 252 420 168 420 336'/%3E%3Cpolygon fill='%231e2229' points='0 336 52.5 252 105 336'/%3E%3Cpolygon fill='%2315171c' points='105 336 157.5 252 210 336'/%3E%3Cpolygon fill='%23262a33' points='210 336 262.5 252 315 336'/%3E%3Cpolygon fill='%231b1e24' points='315 336 367.5 252 420 336'/%3E%3Cpolygon fill='%23131519' points='0 336 105 336 52.5 420'/%3E%3Cpolygon fill='%2321252d' points='105 336 210 336 157.5 420'/%3E%3Cpolygon fill='%23181a20' points='210 336 315 336 262.5 420'/%3E%3Cpolygon fill='%23242831' points='315 336 420 336 367.5 420'/%3E%3Cpolygon fill='%231e2128' points='52.5 420 157.5 420 105 336'/%3E%3Cpolygon fill='%2316181d' points='157.5 420 262.5 420 210 336'/%3E%3Cpolygon fill='%23232831' points='262.5 420 367.5 420 315 336'/%3E%3C/g%3E%3C/svg%3E")
          `,
          backgroundSize: "420px 420px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Main Login Card: Centered, Deep Blue Gradient (#0d2137 to #122a45), Subtle Glow & Depth */}
      <div className="relative z-10 w-full max-w-[370px] mx-auto my-auto animate-in fade-in zoom-in-95 duration-300 font-poppins">
        <div 
          className="w-full rounded-[18px] p-7 sm:p-8 overflow-hidden transition-all duration-300 border border-white/10"
          style={{
            background: "linear-gradient(180deg, #0d2137 0%, #122a45 100%)",
            boxShadow: "0 15px 45px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Top Logo: Perfect Circle, Bright Cyan/Teal Background (#20c9c9), Stylized Dark Navy BP Letters */}
          <div className="flex justify-center mb-7 sm:mb-8">
            <BPLogo size={115} />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field: Icon on left (pure white), placeholder in light gray, clean transparent background, thin border-bottom only */}
            <div className="space-y-1 group">
              <div className="flex items-center gap-3 pb-2 transition-colors">
                <User 
                  size={19} 
                  className="text-white shrink-0" 
                  fill="#ffffff" 
                  color="#ffffff"
                  strokeWidth={1}
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  required
                  autoComplete="username"
                  className="login-transparent-input w-full bg-transparent text-white text-[15.5px] font-normal placeholder:text-[#cbd5e0] focus:outline-none"
                />
              </div>
              <div className="h-[1px] w-full bg-white/30 group-focus-within:bg-[#20c9c9] transition-colors duration-300" />
            </div>

            {/* Password Field: Padlock icon on left (pure white), placeholder in light gray, clean transparent background, thin border-bottom only */}
            <div className="space-y-1 group">
              <div className="flex items-center gap-3 pb-2 transition-colors">
                <Lock 
                  size={19} 
                  className="text-white shrink-0" 
                  fill="#ffffff" 
                  color="#ffffff"
                  strokeWidth={1} 
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  required
                  autoComplete="current-password"
                  className="login-transparent-input w-full bg-transparent text-white text-[15.5px] font-normal placeholder:text-[#cbd5e0] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-300 hover:text-white transition-colors p-0.5 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="text-gray-300 hover:text-white" />
                  ) : (
                    <Eye size={16} className="text-gray-300 hover:text-white" />
                  )}
                </button>
              </div>
              <div className="h-[1px] w-full bg-white/30 group-focus-within:bg-[#20c9c9] transition-colors duration-300" />
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="text-[#ff5252] text-center text-[14px] font-medium pt-1 animate-in fade-in duration-200">
                {loginError}
              </div>
            )}

            {/* Login Button: Full-width Rounded Pill Button (top #2a6bb5, bottom #1a4a8a) & Soft Shadow */}
            <div className="pt-3 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] rounded-[28px] flex items-center justify-center gap-2 text-white text-[16px] font-medium tracking-wide transition-all duration-300 cursor-pointer select-none active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed hover:brightness-110 border border-white/20"
                style={{
                  background: "linear-gradient(180deg, #2a6bb5 0%, #1a4a8a 100%)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    <span>Signing In...</span>
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
