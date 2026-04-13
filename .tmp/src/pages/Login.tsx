import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Loader2, CheckCircle2 } from "lucide-react";
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
          role: client.role,
        });
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        navigate("/dashboard");
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
    <div className="min-h-screen flex" style={{ backgroundColor: '#121d30' }}>
      {/* LEFT PANEL — only on desktop */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-b from-[#3e6d8d] to-[#121d30] p-12 border-r border-white/10">
        <div className="max-w-md">
          <div className="w-24 h-24 rounded-full bg-[#00b181] flex items-center justify-center mb-8 shadow-xl shadow-[#00b181]/20">
            <span style={{fontSize:'2.5rem',fontWeight:900,fontStyle:'italic',color:'#0d1f2d',fontFamily:'Georgia,serif'}}>BP</span>
          </div>
          <h1 className="text-white text-5xl font-black mb-4 tracking-tight leading-tight">Betpro <span className="text-[#00b181]">Exchange</span></h1>
          <p className="text-[#a8c8e8] text-xl mb-10 leading-relaxed">The industry leading professional betting exchange platform for serious traders and admins.</p>
          
          <div className="space-y-6">
            {[
              "Real-time odds & live markets",
              "Multi-level account management",
              "Comprehensive reports & analytics",
              "Secure & lightning-fast settlements"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 text-[#a8c8e8]">
                <div className="w-8 h-8 rounded-full bg-[#00b181]/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#00b181]" />
                </div>
                <span className="text-lg font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — login form (full width on mobile) */}
      <div className="flex-1 lg:max-w-[500px] flex items-center justify-center px-8 py-12 relative overflow-hidden">
        {/* Ambient background glow for right panel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00b181]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="w-20 h-20 rounded-full bg-[#00b181] flex items-center justify-center shadow-lg shadow-[#00b181]/20">
              <span style={{fontSize:'2rem',fontWeight:900,fontStyle:'italic',color:'#0d1f2d',fontFamily:'Georgia,serif'}}>BP</span>
            </div>
          </div>
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-white text-3xl font-bold mb-2">Welcome back</h2>
            <p className="text-[#a8c8e8] text-base">Sign in to manage your exchange</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[#a8c8e8] text-sm font-semibold ml-1">Username</label>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#00b181]/50 focus-within:bg-white/10 transition-all">
                <User size={18} className="text-white/40" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-white/20 outline-none text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[#a8c8e8] text-sm font-semibold ml-1">Password</label>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#00b181]/50 focus-within:bg-white/10 transition-all">
                <Lock size={18} className="text-white/40" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-white/20 outline-none text-base"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all active:scale-[0.98] flex items-center justify-center bg-[#00b181] hover:bg-[#00c993] shadow-lg shadow-[#00b181]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign In'}
              </button>
            </div>
            
            <p className="text-center text-white/30 text-sm mt-8">
              Professional Exchange Administration Panel v2.0
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
