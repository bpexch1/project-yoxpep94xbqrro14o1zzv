import { useState, useEffect } from "react";
import { Menu, ChevronDown, LogOut, User } from "lucide-react";
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

  useEffect(() => {
    setSession(getClientSession());
  }, []);

  const handleLoadBalance = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["header-balance"] }),
      queryClient.invalidateQueries({ queryKey: ["header-exposure"] })
    ]);
    // small delay for UX feedback
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const { data: downlineUsernames } = useDownlineUsernames(session?.username, session?.role);

  const { data: totalExposure = 0 } = useQuery({
    queryKey: ["header-exposure", session?.username, downlineUsernames],
    queryFn: async () => {
      if (!session) return 0;
      const pendingBets = await Bet.filter({ status: 'pending' }, '-created_at', 1000);
      
      const role = session.role?.toLowerCase();
      
      // Company sees all
      if (role === 'company' || downlineUsernames === null) {
        return pendingBets.reduce((sum: number, b: any) => sum + (Number(b.stake) || 0), 0);
      }
      
      // Client sees only own bets
      if (role === 'client') {
        return pendingBets
          .filter((b: any) => b.user_email === session.username)
          .reduce((sum: number, b: any) => sum + (Number(b.stake) || 0), 0);
      }
      
      // Others: only downline bets
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
    refetchInterval: 30000, // refresh every 30s
    staleTime: 10000,
  });

  const handleLogout = () => {
    clearClientSession();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#f8f9fa] flex items-center px-3 h-12 border-b border-[#dee2e6]">
      {/* LEFT: Hamburger */}
      <div className="flex items-center shrink-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 border border-[#bdc3c7] rounded bg-[#f8f9fa] hover:bg-[#f5f5f5] transition-colors"
        >
          <Menu className="w-5 h-5 text-[#555555]" />
        </button>
        <span className="hidden lg:block font-black italic text-xl ml-3" style={{fontFamily:'Georgia,serif'}}>
          <span className="text-[#00ab81]">BpExch</span>
        </span>
      </div>

      {/* CENTER: Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-1 ml-6 flex-1">
        <NavLink to="/dashboard" label="Dashboard" />
        <NavLink to="/accounts" label="Users" />
        <NavLink to="/reports/daily-pl" label="Reports" />
      </nav>

      {/* RIGHT: User + Stats */}
      <div className="flex-1 lg:flex-none overflow-x-auto no-scrollbar flex items-center justify-end ml-auto gap-2">
        {session ? (
          <div className="flex items-center gap-2 lg:gap-4 min-w-max">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-[#f5f5f5] px-2 py-1 rounded transition-colors">
                  <span className="text-[#333] text-sm font-medium">
                    {session.username} ({session.role ? formatRole(session.role) : ''})
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#555555]" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-[#dee2e6] shadow-lg rounded w-48 mt-1">
                <div className="px-2 py-1.5 text-xs text-[#333] border-b border-[#dee2e6] mb-1">
                  Logged in as <span className="font-semibold">{session.username}</span>
                </div>
                <DropdownMenuItem
                  onClick={() => navigate("/play/profile")}
                  className="text-[#333] hover:bg-[#f5f5f5] cursor-pointer text-xs font-medium p-2"
                >
                  <User className="w-3 h-3 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#dee2e6]" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[#dc3545] hover:bg-red-50 cursor-pointer text-xs font-medium focus:text-[#dc3545] focus:bg-red-50 p-2"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 border-l border-[#dee2e6] pl-2 lg:pl-4">
              <span className="text-sm text-[#333] whitespace-nowrap">
                <strong className="font-bold">B:</strong> <span className={cn(
                  liveBalance > 0 ? "text-[#28a745]" : liveBalance < 0 ? "text-[#dc3545]" : "text-[#333]"
                )}>
                  {liveBalance.toLocaleString('en-IN')}
                </span>
              </span>
              <span className="text-sm text-[#333] whitespace-nowrap">
                <strong className="font-bold">Exp:</strong> <span className={totalExposure > 0 ? 'text-[#dc3545]' : 'text-[#333]'}>
                  {totalExposure > 0 ? `-${totalExposure.toLocaleString('en-IN')}` : totalExposure.toLocaleString('en-IN')}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-bold text-[#254465] hover:text-[#00ab81] uppercase"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
