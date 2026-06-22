import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Loader2 } from "lucide-react";
import { setClientSession } from "@/hooks/useClientAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter username and password.",
      });
      return;
    }
    setLoading(true);
    
    try {
      const trimmedUser = username.trim().toLowerCase();
      const trimmedPass = password.trim();

      // HARDCODED CREDENTIALS FOR TESTING & FIRST LOGIN
      // Baad me aap isko apne naye backend/database se jor sakte hain
      if (
        (trimmedUser === "superadmin" && trimmedPass === "admin123") || 
        (trimmedUser === "admin" && trimmedPass === "pass123")
      ) {
        setClientSession({
          id: "local-session-id",
          username: trimmedUser,
          full_name: trimmedUser === "superadmin" ? "Super Admin" : "Admin Master",
          role: trimmedUser === "superadmin" ? "superadmin" : "admin",
          credit_received: 100000,
          credit_remaining: 100000,
          cash: 50000,
          pl_downline: 0,
          balance_upline: 0,
          status: "active",
        });

        toast({
          title: "Success",
          description: "Logged in successfully!",
        });

        // Direct dashboard par redirect karein
        navigate("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid local username or password.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong.",
      });
    } finally {
      setLoading(false);
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
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 10 }}>
              <User size={22} color="rgba(255,255,255,0.85)" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
    </div>
  );
}
