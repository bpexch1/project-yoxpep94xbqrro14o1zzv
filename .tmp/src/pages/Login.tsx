import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Loader2 } from "lucide-react";
import { Client } from "@/entities";
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
      // First try targeted filter by username (faster, less data)
      let results = await (Client as any).filter({ username: username.trim() }, '-created_at', 10);

      // Fallback: case-insensitive search from a broader set if not found
      if (!results || results.length === 0) {
        const allClients = await Client.list('-created_at', 500);
        results = allClients.filter((c: any) =>
          c.username?.toLowerCase().trim() === username.trim().toLowerCase()
        );
      }

      const client = results.find((c: any) =>
        c.username?.toLowerCase().trim() === username.trim().toLowerCase() &&
        c.password === password
      );
      
      if (client) {
        setClientSession({
          id: client.id,
          username: client.username,
          full_name: client.full_name || client.username,
          role: client.role || 'client',
          credit_received: client.credit_received || 0,
          credit_remaining: client.credit_remaining || 0,
          cash: client.cash || 0,
          pl_downline: client.pl_downline || 0,
          balance_upline: client.balance_upline || 0,
          status: client.status || 'active',
        });
        if (client.role === 'client') {
          navigate("/play");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid username or password.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: `url('https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/7986783e-68fa-4708-bbea-abb3190b2f5f.png')`,
        backgroundRepeat: 'repeat',
        backgroundSize: '300px 300px',
        backgroundColor: '#2a2a2a',
      }}
    >
      {/* Dark navy gradient card */}
      <div
        className="w-full max-w-[380px] rounded-2xl px-8 py-10 shadow-2xl"
        style={{
          background: 'linear-gradient(170deg, #2e6b8a 0%, #1a3d5c 40%, #0f2438 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Teal BP Logo */}
        <div className="flex justify-center mb-10">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center shadow-xl"
            style={{ background: '#3dd6c8' }}
          >
            <span
              style={{
                fontFamily: 'Pacifico, cursive',
                fontSize: '3rem',
                color: '#0f2438',
                lineHeight: 1,
                letterSpacing: '-1px',
              }}
            >
              BP
            </span>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          {/* Username */}
          <div className="mb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
            <div className="flex items-center gap-3 pb-3">
              <User size={20} color="rgba(255,255,255,0.85)" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="flex-1 bg-transparent outline-none text-white placeholder-white/60 text-base"
                style={{ border: 'none' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
            <div className="flex items-center gap-3 pb-3">
              <Lock size={20} color="rgba(255,255,255,0.85)" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="flex-1 bg-transparent outline-none text-white placeholder-white/60 text-base"
                style={{ border: 'none' }}
              />
            </div>
          </div>

          {/* Login Button — steel blue pill, centered */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-16 py-3 rounded-full text-white text-base font-semibold tracking-wide transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center"
              style={{
                background: 'linear-gradient(to bottom, #6aafd4, #3a7fa8)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                minWidth: '160px',
              }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
