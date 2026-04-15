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
      const allClients = await Client.list();
      const client = allClients.find((c: any) => c.username === username && c.password === password);
      
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
        toast({
          title: "Success",
          description: "Logged in successfully!",
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
      className="min-h-screen flex items-center justify-center px-6 relative"
      style={{ 
        backgroundColor: '#3a3a3a',
        backgroundImage: `linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05)), linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05))`,
        backgroundSize: '80px 80px',
        backgroundPosition: '0 0, 40px 40px'
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl px-8 py-10 shadow-2xl relative z-10"
        style={{ background: 'linear-gradient(160deg, #2e6b8a 0%, #1a3d5c 50%, #152c44 100%)' }}
      >
        <div className="flex justify-center mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: '#3dd6c8' }}
          >
            <span style={{
              fontFamily: 'Pacifico, cursive',
              fontSize: '2.4rem',
              color: '#1a2a3a',
              lineHeight: 1
            }}>
              BP
            </span>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="flex items-center gap-3 mb-6 border-b border-white/30 pb-2">
            <User size={18} color="rgba(255,255,255,0.6)" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
              required
            />
          </div>

          <div className="flex items-center gap-3 mb-10 border-b border-white/30 pb-2">
            <Lock size={18} color="rgba(255,255,255,0.6)" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
              required
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-16 py-3 rounded-full text-white text-base transition-all active:scale-95 flex items-center justify-center disabled:opacity-60 shadow-lg"
              style={{
                background: 'linear-gradient(180deg, #3a6a8a 0%, #1e3d5a 100%)',
                border: '1px solid rgba(74, 138, 176, 0.3)'
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
