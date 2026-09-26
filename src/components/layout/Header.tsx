import { useState, useEffect } from "react";
import { Menu, ChevronDown, LogOut, User } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getClientSession, clearClientSession, ClientSession } from "@/hooks/useClientAuth";
import { Bet, Client } from "@/entities";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";
import { AdminProfileModal } from "./AdminProfileModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar: () => void;
  onToggleDesktopSidebar: () => void;
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    superadmin: "SuperAdmin",
    admin: "Admin",
    dealer: "Dealer",
    agent: "Agent",
    superagent: "SuperAgent",
    subdealer: "SubDealer",
    subagent: "SubAgent",
    client: "Client",
    company: "Company",
    supermaster: "SuperMaster",
    master: "Master",
    distributor: "Distributor",
  };
  return roleMap[role?.toLowerCase()] ?? (role ? role.charAt(0).toUpperCase() + role.slice(1) : "");
}

export function Header({ onToggleMobileSidebar, onToggleDesktopSidebar }: HeaderProps) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    setSession(getClientSession());
  }, []);

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

  const { data: liveBalance = 0, refetch: refetchHeaderBalance } = useQuery({
    queryKey: ["header-balance", session?.username],
    queryFn: async () => {
      if (!session?.username) return 0;
      const clients = await Client.filter({ username: session.username }, "-created_at", 1);
      return Number((clients as any)?.[0]?.cash ?? 0);
    },
    enabled: !!session?.username,
    refetchInterval: 3000,
    staleTime: 0,
  });

  useEffect(() => {
    const handleBalanceUpdate = () => {
      refetchHeaderBalance();
    };
    window.addEventListener("balance-updated", handleBalanceUpdate);
    return () => window.removeEventListener("balance-updated", handleBalanceUpdate);
  }, [refetchHeaderBalance]);

  const handleLogout = () => {
    clearClientSession();
    navigate("/login");
  };

  const handleHamburgerClick = () => {
    if (window.innerWidth >= 768) {
      onToggleDesktopSidebar();
    } else {
      onToggleMobileSidebar();
    }
  };

  return (
    <header className="app-header navbar sticky top-0 z-50 flex flex-nowrap items-center justify-between w-full h-[55px] min-h-[55px] max-h-[55px] bg-white border-b border-[#c8ced3] px-2 sm:px-4 py-2 select-none overflow-hidden">
      {/* LEFT: Hamburger + Logo (Logo hidden on mobile <768px, visible on desktop) */}
      <div 
        className="flex items-center gap-2 shrink-0 flex-nowrap"
      >
        <button
          onClick={handleHamburgerClick}
          className="navbar-toggler flex flex-col justify-center items-center min-w-[50px] w-[50px] h-[40px] bg-transparent border-none p-0 cursor-pointer focus:outline-none shrink-0"
          aria-label="Toggle navigation menu"
          title="Toggle navigation"
        >
          <span className="w-[18px] h-[2px] bg-[#23282c] rounded-full block mb-[3.5px]"></span>
          <span className="w-[18px] h-[2px] bg-[#23282c] rounded-full block mb-[3.5px]"></span>
          <span className="w-[18px] h-[2px] bg-[#23282c] rounded-full block"></span>
        </button>

        <Link
          to="/dashboard"
          className="hidden md:inline-block green-logo-text uppercase tracking-tight hover:opacity-90 select-none whitespace-nowrap shrink-0"
        >
          BPEXCH
        </Link>
      </div>

      {/* CENTER: Desktop Nav */}
      <nav className="hidden md:flex items-center gap-5 ml-6 flex-1 flex-nowrap">
        <Link 
          to="/dashboard" 
          className={cn(
            "text-sm transition-all hover:text-[#00B181] whitespace-nowrap",
            location.pathname === "/dashboard" || location.pathname === "/" ? "text-[#00B181] font-bold" : "text-[#23282C]"
          )}
        >
          Dashboard
        </Link>
        <Link 
          to="/accounts" 
          className={cn(
            "text-sm transition-all hover:text-[#00B181] whitespace-nowrap",
            location.pathname.startsWith("/accounts") ? "text-[#00B181] font-bold" : "text-[#23282C]"
          )}
        >
          Users
        </Link>
        <Link 
          to="/reports/daily-pl" 
          className={cn(
            "text-sm transition-all hover:text-[#00B181] whitespace-nowrap",
            location.pathname.startsWith("/reports") ? "text-[#00B181] font-bold" : "text-[#23282C]"
          )}
        >
          Reports
        </Link>
      </nav>

      {/* RIGHT: User + Book Status (Full width available on mobile, aligned neatly on the right) */}
      <div 
        className="flex-1 md:flex-initial flex flex-nowrap items-center justify-end ml-auto gap-2 sm:gap-3 text-right text-xs md:text-sm overflow-hidden"
      >
        {session ? (
          <div className="flex flex-nowrap items-center justify-end gap-2 sm:gap-3 text-[#23282C] text-xs md:text-sm whitespace-nowrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer hover:text-[#00B181] transition-colors group select-none whitespace-nowrap">
                  <span 
                    className="header-user-status text-[#23282C] font-normal whitespace-nowrap text-xs md:text-sm"
                    title={`${session.username} (${session.role ? formatRole(session.role) : 'Admin'})`}
                  >
                    {session.username} ({session.role ? formatRole(session.role) : 'Admin'})
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[#6c757d] shrink-0">▼</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-[rgb(200,206,211)] shadow-lg rounded-[2px] w-48 mt-1 z-[1100]">
                <div className="px-2 py-1.5 text-[11px] text-gray-500 border-b border-gray-100 mb-1">
                  Logged in as <span className="font-semibold text-[#23282C]">{session.username}</span>
                </div>
                <DropdownMenuItem
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-[#23282C] hover:bg-gray-50 hover:text-[#00B181] cursor-pointer text-xs font-medium p-2 focus:bg-gray-50 focus:text-[#00B181]"
                >
                  <User className="w-3.5 h-3.5 mr-2 opacity-70" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[#dc3545] hover:bg-red-50 cursor-pointer text-xs font-medium focus:text-[#dc3545] focus:bg-red-50 p-2"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 whitespace-nowrap text-xs md:text-sm shrink-0">
              <span className="text-[#23282C] font-normal whitespace-nowrap">
                B: <span className="font-normal text-[#23282C]">0</span>
              </span>
              <span className="text-[#23282C] font-normal whitespace-nowrap">
                Exp: <span className="font-normal text-[#23282C]">{totalExposure > 0 ? `-${totalExposure.toLocaleString('en-IN')}` : totalExposure.toLocaleString('en-IN')}</span>
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-xs md:text-sm font-bold text-[#23282C] hover:text-[#00B181] uppercase transition-colors shrink-0 whitespace-nowrap"
          >
            Login
          </button>
        )}
      </div>

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        session={session}
        roleLabel={session?.role ? formatRole(session.role) : "Admin"}
      />
    </header>
  );
}
