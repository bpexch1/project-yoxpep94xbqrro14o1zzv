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
        backgroundColor: '#2a2a2a',
      }}
    >
      {/* White centered card */}
      <div
        className="relative z-10 w-full max-w-[390px] mx-4 rounded-2xl overflow-hidden"
        style={{
          background: '#fff',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
          padding: '48px 36px 40px',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div
            className="w-[100px] h-[100px] rounded-full overflow-hidden flex items-center justify-center shadow-lg"
            style={{ border: '3px solid #eee', background: '#1a3d5c' }}
          >
            <span style={{
              fontFamily: 'Pacifico, cursive',
              fontSize: '2.8rem',
              color: '#3dd6c8',
              lineHeight: 1
            }}>BP</span>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          {/* Username input — underline style */}
          <div className="mb-6 group" style={{ borderBottom: '2px solid #d1d5db', position: 'relative' }}>
            <div className="flex items-center gap-2 pb-2">
              <User size={16} color="#aaa" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="flex-1 bg-transparent outline-none text-[15px] text-[#333] placeholder-gray-400"
                style={{ border: 'none', padding: '4px 0' }}
              />
            </div>
            {/* animated green underline on focus */}
            <div
              className="absolute bottom-[-2px] left-0 w-full h-[2px] origin-left scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100"
              style={{ background: '#4dbd74' }}
            />
          </div>

          {/* Password input — underline style */}
          <div className="mb-10 group" style={{ borderBottom: '2px solid #d1d5db', position: 'relative' }}>
            <div className="flex items-center gap-2 pb-2">
              <Lock size={16} color="#aaa" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="flex-1 bg-transparent outline-none text-[15px] text-[#333] placeholder-gray-400"
                style={{ border: 'none', padding: '4px 0' }}
              />
            </div>
            <div
              className="absolute bottom-[-2px] left-0 w-full h-[2px] origin-left scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100"
              style={{ background: '#4dbd74' }}
            />
          </div>

          {/* Login button — green, full width */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full text-white text-[15px] font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center disabled:opacity-60 shadow-md"
            style={{
              background: 'linear-gradient(to right, #4dbd74, #2e9e56)',
              border: 'none',
            }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
          </button>
        </form>
      </div>

      {/* Bottom green line footer like reference */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '6px', background: '#4dbd74' }}
      />
    </div>
  );
}
