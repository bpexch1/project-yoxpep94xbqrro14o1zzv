import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Loader2, Key } from "lucide-react";
import { Client } from "@/entities";
import { setClientSession } from "@/hooks/useClientAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forcedModal, setForcedModal] = useState(false);
  const [pendingClient, setPendingClient] = useState<any>(null);
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
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
        if (client.password === client.username) {
          setPendingClient(client);
          setForcedModal(true);
          setLoading(false);
          return;
        }

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

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 4) { 
      setPwError('Password must be at least 4 characters'); 
      return; 
    }
    if (newPw === pendingClient?.username) { 
      setPwError('New password cannot be same as username'); 
      return; 
    }
    setChangingPw(true);
    try {
      await Client.update(pendingClient.id, { password: newPw });
      setForcedModal(false);
      setSuccessModal(true);
      setTimeout(() => { 
        setSuccessModal(false); 
        setUsername('');
        setPassword('');
        setNewPw('');
        setPwError('');
        setPendingClient(null);
        // Refresh page or clear state to allow login again
      }, 2500);
    } catch(e) {
      setPwError('Failed to update password. Try again.');
    } finally { 
      setChangingPw(false); 
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

      {/* Forced Password Change Modal */}
      {forcedModal && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="w-full max-w-[500px] bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-[#1a4a6e] px-6 py-4 border-b border-white/10">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Your Password
              </h2>
            </div>
            
            {/* Body */}
            <div className="p-8 text-center border-b border-gray-100">
              <h3 className="text-2xl font-bold text-red-600 mb-4 blink_me">
                Change Your Password ⚠️
              </h3>
              <p className="text-gray-700 font-semibold text-lg mb-2">
                Password Checkup Detected that your password is no longer safe!
              </p>
              <p className="text-gray-500">
                You should change your password now to use the Exchange.
              </p>
            </div>

            {/* Form section */}
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
                <div className="mt-2 text-red-500 text-sm font-semibold animate-bounce">
                  {pwError}
                </div>
              )}
            </div>

            {/* Footer */}
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

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-[1001] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
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
