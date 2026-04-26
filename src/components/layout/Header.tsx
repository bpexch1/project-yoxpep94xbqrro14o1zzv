import { useState, useEffect } from "react";
import { Menu, ChevronDown, LogOut, User, RefreshCw } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getClientSession, clearClientSession, ClientSession } from "@/hooks/useClientAuth";
import { Bet, Client } from "@/entities";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    superadmin: "SuperAdmin",
    admin: "Admin",
    agent: "Agent",
    client: "Client",
    company: "Company",
    supermaster: "SuperMaster",
  };
  return roleMap[role?.toLowerCase()] ?? role;
}

const NavLink = ({ to, label }: { to: string; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to.split('?')[0]));
  return (
    <Link
      to={to}
      className={cn(
        "px-3 py-1.5 text-sm rounded transition-colors font-medium whitespace-nowrap",
        isActive ? "bg-[#e8f0f5] text-[#254465] font-bold" : "text-[#555555] hover:bg-[#f5f5f5]"
      )}
    >
      {label}
    </Link>
  );
};

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSession(getClientSession());
  }, []);

  const handleLoadBalance = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["header-balance"] }),
      queryClient.invalidateQueries({ queryKey: ["header-exposure"] })
    ]);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const { data: downlineUsernames } = useDownlineUsernames(session?.username, session?.role);

  const { data: totalExposure = 0 } = useQuery({
    queryKey: ["header-exposure", session?.username, downlineUsernames],
    queryFn: async () => {
      if (!session) return 0;
      const pendingBets = await Bet.filter({ status: 'pending' }, '-created_at', 1000);
      
      const role = session.role?.toLowerCase();
      
      if (role === 'company' || downlineUsernames === null) {
        return pendingBets.reduce((sum: number, b: any) => sum + (Number(b.stake) || 0), 0);
      }
      
      if (role === 'client') {
        return pendingBets
          .filter((b: any) => b.user_email === session.username)
          .reduce((sum: number, b: any) => sum + (Number(b.stake) || 0), 0);
      }
      
      if (!downlineUsernames || downlineUsernames.length === 0) return 0;
      return pendingBets
        .filter((b: any) => downlineUsernames.includes(b.user_email))
        .reduce((sum: number, b: any) => sum + (Number(b.stake) || 0), 0);
    },
    enabled: !!session && downlineUsernames !== undefined,
  });

  const { data: liveBalance = 0 } = useQuery({
    queryKey: ["header-balance", session?.id],
    queryFn: async () => {
      if (!session?.id) return 0;
      const clients = await Client.filter({ username: session.username }, "-created_at", 1);
      return (clients as any)?.[0]?.cash ?? 0;
    },
    enabled: !!session?.id,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const handleLogout = () => {
    clearClientSession();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#3c4b64] flex items-center px-3 h-[50px] border-b border-[#2f3b4c]">
      {/* LEFT: Hamburger + Logo */}
      <div className="flex items-center shrink-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 text-white/80 hover:text-white transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/dashboard" className="flex items-center gap-1 ml-1 lg:ml-0">
          <span className="font-black italic text-xl" style={{fontFamily:'Georgia,serif'}}>
            <span className="text-white">Bp</span><span className="text-[#3DCCC8]">Exch</span>
          </span>
        </Link>
      </div>

      {/* CENTER: Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-4 ml-8 flex-1">
        <Link 
          to="/dashboard" 
          className={cn(
            "text-sm font-medium transition-all hover:underline",
            location.pathname === "/dashboard" ? "text-white underline" : "text-white/80"
          )}
        >
          Dashboard
        </Link>
        <Link 
          to="/accounts" 
          className={cn(
            "text-sm font-medium transition-all hover:underline",
            location.pathname.startsWith("/accounts") ? "text-white underline" : "text-white/80"
          )}
        >
          Users
        </Link>
        <Link 
          to="/reports/daily-pl" 
          className={cn(
            "text-sm font-medium transition-all hover:underline",
            location.pathname.startsWith("/reports") ? "text-white underline" : "text-white/80"
          )}
        >
          Reports
        </Link>
      </nav>

      {/* RIGHT: User + Stats */}
      <div className="flex items-center justify-end ml-auto gap-2 sm:gap-4">
        {session ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 border-r border-white/10 pr-2 sm:pr-4">
              <span className="text-[13px] text-white whitespace-nowrap">
                <span className="font-bold opacity-80">B:</span> <span className={cn(
                  "font-bold",
                  liveBalance >= 0 ? "text-[#3DCCC8]" : "text-[#dc3545]"
                )}>
                  {liveBalance.toLocaleString('en-IN')}
                </span>
              </span>
              <span className="text-[13px] text-white whitespace-nowrap">
                <span className="font-bold opacity-80">Exp:</span> <span className={cn(
                  "font-bold",
                  totalExposure > 0 ? "text-[#dc3545]" : "text-white"
                )}>
                  {totalExposure > 0 ? `-${totalExposure.toLocaleString('en-IN')}` : totalExposure.toLocaleString('en-IN')}
                </span>
              </span>
              <button
                onClick={handleLoadBalance}
                disabled={isRefreshing}
                className="bg-[#3DCCC8] hover:bg-[#2db8b4] text-white p-1 rounded-sm transition-all active:scale-95 disabled:opacity-70 ml-1"
                title="Refresh balance"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors">
                  <span className="text-white text-sm font-medium hidden sm:inline">
                    {session.username} ({session.role ? formatRole(session.role) : ''})
                  </span>
                  <span className="text-white text-sm font-medium sm:hidden">
                    {session.username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#3c4b64] border border-[#2f3b4c] shadow-lg rounded w-48 mt-1">
                <div className="px-2 py-1.5 text-[11px] text-white/60 border-b border-white/10 mb-1">
                  Logged in as <span className="font-semibold text-white">{session.username}</span>
                </div>
                <DropdownMenuItem
                  onClick={() => navigate("/play/profile")}
                  className="text-white hover:bg-white/10 cursor-pointer text-xs font-medium p-2 focus:bg-white/10 focus:text-white"
                >
                  <User className="w-3.5 h-3.5 mr-2 opacity-70" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[#dc3545] hover:bg-red-500/10 cursor-pointer text-xs font-medium focus:text-[#dc3545] focus:bg-red-500/10 p-2"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-bold text-white hover:text-[#3DCCC8] uppercase"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}

