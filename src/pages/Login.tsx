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
      const clients = await Client.filter({ username });
      const client = clients[0];
      if (client && client.password === password) {
        setClientSession({
          id: client.id,
          username: client.username,
          full_name: client.full_name || client.username,
          role: client.role,
        });
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        navigate("/accounts");
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
    <div className="min-h-screen flex items-start justify-center pt-24 px-6" style={{ backgroundColor: '#2a2a2a' }}>
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl px-8 py-10"
        style={{ background: 'linear-gradient(180deg, #2d7d9a 0%, #1a3a5c 55%, #0d2137 100%)' }}
      >
        {/* BP Logo Circle */}
        <div className="flex justify-center mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: '#3de0c8' }}
          >
            <span style={{ fontSize: '2.5rem', fontWeight: 900, fontStyle: 'italic', color: '#0d1f2d', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
              BP
            </span>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          {/* Username Field */}
          <div className="flex items-center gap-3 mb-6 border-b border-white/30 pb-2">
            <User size={20} color="rgba(255,255,255,0.7)" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
              required
            />
          </div>

          {/* Password Field */}
          <div className="flex items-center gap-3 mb-10 border-b border-white/30 pb-2">
            <Lock size={20} color="rgba(255,255,255,0.7)" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
              required
            />
          </div>

          {/* Login Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-3/4 h-12 rounded-full text-white font-semibold text-lg transition-all active:scale-95 flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #5aaec8 0%, #2d6b8a 100%)',
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
