import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Loader2, Key } from "lucide-react";
import { Client } from "@/entities";
import { setClientSession } from "@/hooks/useClientAuth";
import { useToast } from "@/hooks/use-toast";
import { BPLogo } from "@/components/icons/BPLogo";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forcedModal, setForcedModal] = useState(false);
  const [pendingClient, setPendingClient] = useState<any>(null);
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const { toast } = useToast();
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
      let client: any = null;

      // 1. Primary DB Search
      const results = await Client.filter({ username: cleanUser }, "-created_at", 10);

      if (Array.isArray(results) && results.length > 0) {
        client = results.find(
          (c: any) => (c.username || "").trim().toLowerCase() === cleanUser.toLowerCase()
        );
      }

      // 2. Case-insensitive Fallback Search
      if (!client) {
        const allClients = await Client.list("-created_at", 500);
        client = (Array.isArray(allClients) ? allClients : []).find(
          (c: any) => (c.username || "").trim().toLowerCase() === cleanUser.toLowerCase()
        );
      }

      // 3. User & Password Validation
      if (!client || client.password !== cleanPw) {
        setLoginError("Username/Password Incorrect.");
        return;
      }

      // 4. Account Status Validation
      if (["inactive", "locked", "suspended"].includes(client.status)) {
        setLoginError("Account Inactive or Suspended. Contact Upline.");
        return;
      }

      // 5. Forced Password Change Check
      if (client.must_change_pw) {
        setPendingClient(client);
        setForcedModal(true);
        return;
      }

      // 6. Set Authenticated Session
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

      // 7. Route Redirection
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
        password: newPw, 
        must_change_pw: false 
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#191b1f",
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill-rule='evenodd'%3E%3Cpolygon fill='%231f2227' points='0 0 100 0 50 80'/%3E%3Cpolygon fill='%2317191d' points='100 0 200 0 150 80'/%3E%3Cpolygon fill='%2322252b' points='200 0 300 0 250 80'/%3E%3Cpolygon fill='%231a1c20' points='300 0 400 0 350 80'/%3E%3Cpolygon fill='%2325292f' points='50 80 150 80 100 0'/%3E%3Cpolygon fill='%231c1f24' points='150 80 250 80 200 0'/%3E%3Cpolygon fill='%23282c33' points='250 80 350 80 300 0'/%3E%3Cpolygon fill='%23181a1d' points='0 0 50 80 0 160'/%3E%3Cpolygon fill='%2323272d' points='50 80 150 80 100 160'/%3E%3Cpolygon fill='%231e2126' points='150 80 250 80 200 160'/%3E%3Cpolygon fill='%232a2f36' points='250 80 350 80 300 160'/%3E%3Cpolygon fill='%23191b1e' points='350 80 400 0 400 160'/%3E%3Cpolygon fill='%231d2025' points='0 160 50 80 100 160'/%3E%3Cpolygon fill='%23292e35' points='100 160 150 80 200 160'/%3E%3Cpolygon fill='%231f2328' points='200 160 250 80 300 160'/%3E%3Cpolygon fill='%232c3139' points='300 160 350 80 400 160'/%3E%3Cpolygon fill='%231b1d22' points='0 160 100 160 50 240'/%3E%3Cpolygon fill='%2324282f' points='100 160 200 160 150 240'/%3E%3Cpolygon fill='%231a1c20' points='200 160 300 160 250 240'/%3E%3Cpolygon fill='%23272b32' points='300 160 400 160 350 240'/%3E%3Cpolygon fill='%23202329' points='50 240 150 240 100 160'/%3E%3Cpolygon fill='%23181a1d' points='150 240 250 240 200 160'/%3E%3Cpolygon fill='%23262a31' points='250 240 350 240 300 160'/%3E%3Cpolygon fill='%231e2126' points='0 160 50 240 0 320'/%3E%3Cpolygon fill='%232b3038' points='50 240 150 240 100 320'/%3E%3Cpolygon fill='%231a1c20' points='150 240 250 240 200 320'/%3E%3Cpolygon fill='%2325292f' points='250 240 350 240 300 320'/%3E%3Cpolygon fill='%231c1e23' points='350 240 400 160 400 320'/%3E%3Cpolygon fill='%2322262c' points='0 320 50 240 100 320'/%3E%3Cpolygon fill='%23191b1f' points='100 320 150 240 200 320'/%3E%3Cpolygon fill='%23282c33' points='200 320 250 240 300 320'/%3E%3Cpolygon fill='%231e2227' points='300 320 350 240 400 320'/%3E%3Cpolygon fill='%2317191d' points='0 320 100 320 50 400'/%3E%3Cpolygon fill='%2324282e' points='100 320 200 320 150 400'/%3E%3Cpolygon fill='%231d2025' points='200 320 300 320 250 400'/%3E%3Cpolygon fill='%23272b32' points='300 320 400 320 350 400'/%3E%3Cpolygon fill='%2321252b' points='50 400 150 400 100 320'/%3E%3Cpolygon fill='%231b1d22' points='150 400 250 400 200 320'/%3E%3Cpolygon fill='%23262a31' points='250 400 350 400 300 320'/%3E%3C/g%3E%3C/svg%3E")
        `,
        backgroundSize: "400px 400px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        paddingTop: "20px",
        paddingBottom: "24px",
        position: "relative",
      }}
    >
      <style>{`
        .login-input::placeholder { color: #ffffff; opacity: 0.9; font-weight: 400; font-size: 15.5px; }
        .login-input:focus { outline: none; }
        .login-btn:active { transform: scale(0.97); }
        @keyframes errorFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .error-msg {
          animation: errorFadeIn 0.25s ease-out forwards;
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 390,
          margin: "18px auto 0",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            borderRadius: 16,
            background: "linear-gradient(180deg, #3f6d94 0%, #21476a 45%, #0a2346 100%)",
            boxShadow: "0 18px 45px rgba(0, 0, 0, 0.75)",
            padding: "44px 26px 36px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 38 }}>
            <BPLogo size={120} />
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 10 }}>
                <User size={18} color="#ffffff" fill="#ffffff" strokeWidth={1} />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  required
                  className="login-input"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#ffffff",
                    fontSize: 15.5,
                    fontWeight: 400,
                  }}
                />
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.4)", width: "100%" }} />
            </div>

            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 10 }}>
                <Lock size={18} color="#ffffff" fill="#ffffff" strokeWidth={1} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  required
                  className="login-input"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#ffffff",
                    fontSize: 15.5,
                    fontWeight: 400,
                  }}
                />
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.4)", width: "100%" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="submit"
                disabled={loading}
                className="login-btn"
                style={{
                  minWidth: 140,
                  height: 44,
                  borderRadius: 9999,
                  background: "linear-gradient(180deg, #5380a2 0%, #3a6589 45%, #234a6c 55%, #153651 100%)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#ffffff",
                  fontSize: 15.5,
                  fontWeight: 700,
                  padding: "0 36px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.75 : 1,
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "transform 0.1s, opacity 0.2s, box-shadow 0.2s",
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Login"}
              </button>
            </div>

            {loginError && (
              <div
                className="error-msg"
                style={{
                  color: "#e53935",
                  textAlign: "center",
                  marginTop: "16px",
                  fontSize: "14.5px",
                  fontWeight: 400,
                  letterSpacing: "0.2px",
                }}
              >
                {loginError}
              </div>
            )}
          </form>
        </div>
      </div>

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

      {forcedModal && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="w-full max-w-[500px] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-[#1a4a6e] px-6 py-4 border-b border-white/10">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Your Password
              </h2>
            </div>
            
            <div className="p-8 text-center border-b border-gray-100">
              <h3 className="text-2xl font-bold text-red-600 mb-4">
                Change Your Password ⚠️
              </h3>
              <p className="text-gray-700 font-semibold text-lg mb-2">
                Password Checkup Detected that your password is no longer safe!
              </p>
              <p className="text-gray-500">
                You should change your password now to use the Exchange.
              </p>
            </div>

            <div className="p-8 bg-gray-50">
              <div className="flex items-center gap-2 mb-4 text-[#1a4a6e] font-bold">
                <Key className="w-5 h-5" />
                <label>Enter Your New Password Here!</label>
              </div>
              <input
                type="password"
                placeholder="New Password"
                value={newPw}
                onChange={(e) => {
                  setNewPw(e.target.value);
                  setPwError('');
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a4a6e] focus:border-transparent outline-none transition-all"
                autoFocus
              />
              {pwError && (
                <div className="mt-2 text-red-500 text-sm font-semibold">
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
                {changingPw ? <Loader2 className="w-5 h-5 animate-spin" /> : "Change Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {successModal && (
        <div className="fixed inset-0 z-[1001] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Changed Successfully</h2>
            <p className="text-gray-600">Your password has been updated. Please login again with your new password.</p>
          </div>
        </div>
      )}
    </div>
  );
}
