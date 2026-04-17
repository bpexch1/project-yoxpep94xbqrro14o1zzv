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
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: `url('https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/7986783e-68fa-4708-bbea-abb3190b2f5f.png')`,
        backgroundRepeat: 'repeat',
        backgroundSize: '300px 300px',
        backgroundColor: '#2e2e2e',
      }}
    >
      {/* Blue gradient card */}
      <div
        className="relative z-10 w-full mx-4 rounded-2xl"
        style={{
          maxWidth: '400px',
          background: 'linear-gradient(180deg, #2e7a9a 0%, #1a4a6e 45%, #0d2640 100%)',
          boxShadow: '0 12px 50px rgba(0,0,0,0.6)',
          padding: '60px 32px 48px',
          marginTop: '40px',
        }}
      >
        {/* BP Logo — teal circle centered at top */}
        <div className="flex justify-center" style={{ marginTop: '-100px', marginBottom: '32px' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#3dd6c8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{
              fontFamily: 'Pacifico, cursive',
              fontSize: '3.2rem',
              color: '#0d2640',
              lineHeight: 1,
            }}>BP</span>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          {/* Username field */}
          <div className="mb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.35)' }}>
            <div className="flex items-center gap-3 pb-3">
              <User size={20} color="rgba(255,255,255,0.75)" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '16px',
                  width: '100%',
                }}
                className="placeholder-white/60"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="mb-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.35)' }}>
            <div className="flex items-center gap-3 pb-3">
              <Lock size={20} color="rgba(255,255,255,0.75)" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '16px',
                  width: '100%',
                }}
                className="placeholder-white/60"
              />
            </div>
          </div>

          {/* Login button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center disabled:opacity-60 active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(180deg, #5a9ec0 0%, #2e6e90 100%)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                fontSize: '17px',
                fontWeight: '500',
                padding: '13px 64px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                letterSpacing: '0.5px',
              }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom blue bar */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '5px', background: '#1a5080' }}
      />
    </div>
  );
}
