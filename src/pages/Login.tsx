import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Loader2, Key } from "lucide-react";
import { signInClient } from "@/hooks/useClientAuth";
import { setClientSession } from "@/hooks/useClientAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forcedModal, setForcedModal] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter email and password.",
      });
      return;
    }
    setLoading(true);
    try {
      await signInClient(email, password);
      
      // Determine redirect based on role
      const session = JSON.parse(localStorage.getItem("clientSession") || "{}");
      if (session.role === "client") {
        navigate("/play");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message || "Invalid email or password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 4) {
      setPwError("Password must be at least 4 characters");
      return;
    }
    setChangingPw(true);
    try {
      const { updateClientPassword } = await import("@/hooks/useClientAuth");
      await updateClientPassword(newPw);

      setForcedModal(false);
      setSuccessModal(true);
      setTimeout(() => {
        setSuccessModal(false);
        setEmail("");
        setPassword("");
        setNewPw("");
        setPwError("");
      }, 2500);
    } catch (e: any) {
      setPwError("Failed to update password. Try again.");
      console.error(e);
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #3e6d8d, #121d30)",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "8px",
      }}
    >
      <style>{`
        .login-input::placeholder { color: rgba(255,255,255,0.65); }
        .login-input:focus { outline: none; }
      `}</style>

      {/* Login Card */}
      <div
        style={{
          margin: "40px 16px 0",
          borderRadius: 18,
          background: "linear-gradient(180deg, #3a7490 0%, #1a4a6e 50%, #0d2640 100%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
          padding: "36px 28px 36px",
          overflow: "hidden",
        }}
      >
        {/* BP Logo Circle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: "#3dd6c8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
            }}
          >
            <span
              style={{
                fontFamily: "Pacifico, cursive",
                fontSize: "3.2rem",
                color: "#0d1f30",
                lineHeight: 1,
                fontStyle: "italic",
              }}
            >
              BP
            </span>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          {/* Email field */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 10 }}>
              <User size={22} color="rgba(255,255,255,0.85)" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 17,
                  fontFamily: '"Roboto Condensed", sans-serif',
                }}
              />
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.35)" }} />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 10 }}>
              <Lock size={22} color="rgba(255,255,255,0.85)" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 17,
                  fontFamily: '"Roboto Condensed", sans-serif',
                }}
              />
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.35)" }} />
          </div>

          {/* Login Button */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "65%",
                borderRadius: 50,
                background: "linear-gradient(to bottom, #3e6d8d, #121d30)",
                border: "none",
                color: "#fff",
                fontSize: 18,
                fontWeight: 500,
                padding: "14px 0",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: '"Roboto Condensed", sans-serif',
                letterSpacing: 0.3,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Login"}
            </button>
          </div>
        </form>
      </div>

      {/* Blue bar at bottom */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "#1a6090",
        }}
      />

      {/* Password Change Modal */}
      {forcedModal && (
        <div
          className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-[500px] bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#1a4a6e] px-6 py-4 border-b border-white/10">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Your Password
              </h2>
            </div>

            <div className="p-8 text-center border-b border-gray-100">
              <h3 className="text-2xl font-bold text-red-600 mb-4 blink_me">
                Change Your Password ⚠️
              </h3>
              <p className="text-gray-700 font-semibold text-lg mb-2">
                Security Alert: Your password needs to be updated!
              </p>
              <p className="text-gray-500">
                Please set a new password to continue using the Exchange.
              </p>
            </div>

            <div className="p-8 bg-gray-50">
              <div className="flex items-center gap-2 mb-4 text-[#1a4a6e] font-bold">
                <Key className="w-5 h-5" />
                <label>Enter Your New Password</label>
              </div>
              <input
                type="password"
                placeholder="New Password"
                value={newPw}
                onChange={(e) => {
                  setNewPw(e.target.value);
                  setPwError("");
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a4a6e] focus:border-transparent outline-none transition-all"
                autoFocus
              />
              {pwError && (
                <div className="mt-2 text-red-500 text-sm font-semibold animate-bounce">
                  {pwError}
                </div>
              )}
            </div>

            <div className="p-6 flex justify-center bg-white">
              <button
                onClick={handleChangePassword}
                disabled={changingPw}
                className="w-full max-w-[200px] bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {changingPw ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Change Now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-[1001] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Password Changed Successfully
            </h2>
            <p className="text-gray-600">
              Your password has been updated. Please login again with your new
              password.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
