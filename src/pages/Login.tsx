import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast({ title: "Success", description: "Logged in successfully!" });

        // Navigate to dashboard after successful login
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        toast({ 
          variant: "destructive",
          title: "Error", 
          description: data.message || "Invalid credentials" 
        });
      }
    } catch (error) {
      toast({ 
        variant: "destructive",
        title: "Error", 
        description: "Something went wrong" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #1a3a52 0%, #0d2137 100%)",
      }}
    >
      <div 
        className="w-full max-w-sm mx-4 p-8 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #1e4d6b 0%, #0f2d44 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)",
            }}
          >
            <span className="text-4xl font-bold text-slate-900" style={{ fontFamily: '"Playfair Display", serif' }}>
              BP
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div className="flex items-center gap-3 border-b border-slate-500 pb-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="flex-1 bg-transparent border-none outline-none text-white text-lg"
              style={{ fontFamily: '"Roboto Condensed", sans-serif' }}
            />
          </div>

          {/* Password */}
          <div className="flex items-center gap-3 border-b border-slate-500 pb-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="flex-1 bg-transparent border-none outline-none text-white text-lg"
              style={{ fontFamily: '"Roboto Condensed", sans-serif' }}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full text-white font-semibold text-lg mt-4"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
            }}
          >
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;