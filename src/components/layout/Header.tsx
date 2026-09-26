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
  onOpenMobileSidebar: () => void;
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

export function Header({ onOpenMobileSidebar, onToggleDesktopSidebar }: HeaderProps) {
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
    if (window.innerWidth >= 1024) {
      onToggleDesktopSidebar();
    } else {
      onOpenMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center px-3 h-[50px] border-b border-[rgb(200,206,211)] bg-white">
      {/* LEFT: Logo + Hamburger */}
      <div className="flex items-center shrink-0">
        <button
          onClick={handleHamburgerClick}
          className="navbar-toggler sidebar-toggler d-lg-none flex flex-col justify-center items-center w-[36px] h-[32px] border border-[rgb(200,206,211)] rounded-[2px] bg-white hover:bg-gray-50 transition-colors gap-[3px] p-1 focus:outline-none"
          aria-label="Toggle navigation menu"
          title="Toggle navigation"
        >
          <span className="w-[18px] h-[2px] bg-[#23282c] rounded-full block"></span>
          <span className="w-[18px] h-[2px] bg-[#23282c] rounded-full block"></span>
          <span className="w-[18px] h-[2px] bg-[#23282c] rounded-full block"></span>
        </button>
      </div>

      {/* CENTER: Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-6 ml-8 flex-1">
        <Link 
          to="/dashboard" 
          className={cn(
            "text-sm transition-all hover:text-[#00b98a]",
            location.pathname === "/dashboard" ? "text-[#00b98a] font-bold" : "text-[#23282c]"
          )}
        >
          Dashboard
        </Link>
        <Link 
          to="/accounts" 
          className={cn(
            "text-sm transition-all hover:text-[#00b98a]",
            location.pathname.startsWith("/accounts") ? "text-[#00b98a] font-bold" : "text-[#23282c]"
          )}
        >
          Users
        </Link>
        <Link 
          to="/reports/daily-pl" 
          className={cn(
            "text-sm transition-all hover:text-[#00b98a]",
            location.pathname.startsWith("/reports") ? "text-[#00b98a] font-bold" : "text-[#23282c]"
          )}
        >
          Reports
        </Link>
      </nav>

      {/* RIGHT: User + Stats */}
      <div className="flex items-center justify-end ml-auto gap-2 sm:gap-3">
        {session ? (
          <div className="flex items-center gap-2 sm:gap-3 text-[#23282c]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer hover:text-[#00b98a] transition-colors group">
                  <span className="text-[#23282c] text-sm font-normal">
                    {session.username} ({session.role ? formatRole(session.role) : 'Admin'})
                  </span>
                  <span className="text-[10px] text-[#6c757d]">▼</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-[rgb(200,206,211)] shadow-lg rounded-[2px] w-48 mt-1">
                <div className="px-2 py-1.5 text-[11px] text-gray-500 border-b border-gray-100 mb-1">
                  Logged in as <span className="font-semibold text-[#23282c]">{session.username}</span>
                </div>
                <DropdownMenuItem
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-[#23282c] hover:bg-gray-50 hover:text-[#00b98a] cursor-pointer text-xs font-medium p-2 focus:bg-gray-50 focus:text-[#00b98a]"
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

            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-[#23282c] whitespace-nowrap font-normal">
                B: <span className="font-normal text-[#23282c]">0</span>
              </span>
              <span className="text-[#23282c] whitespace-nowrap font-normal">
                Exp: <span className="font-normal text-[#23282c]">{totalExposure > 0 ? `-${totalExposure.toLocaleString('en-IN')}` : totalExposure.toLocaleString('en-IN')}</span>
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-bold text-[#23282c] hover:text-[#00b98a] uppercase transition-colors"
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
