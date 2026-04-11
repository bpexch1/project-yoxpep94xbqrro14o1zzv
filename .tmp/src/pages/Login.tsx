import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Eye, EyeOff, Loader2 } from "lucide-react";
import { Client } from "@/entities";
import { setClientSession } from "@/hooks/useClientAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both username and password.",
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
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1419] text-white flex flex-col items-center justify-center p-4">
      {/* Background Decorative Element */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <Trophy className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">
            <span className="text-emerald-500">BETPRO</span>
            <span className="text-white">EXCHANGE</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-[#1A1D24] p-6 rounded-2xl border border-gray-800 shadow-2xl">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#0F1419] border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#0F1419] border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg mt-4 transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "SIGN IN"
            )}
          </Button>

          <div className="pt-2 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
              Secure Admin Access
            </p>
          </div>
        </form>

        <p className="text-center text-gray-500 text-xs mt-8">
          © 2024 BetPro Exchange. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
