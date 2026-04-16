import { useState, useEffect } from "react";
import { Menu, ChevronDown, LogOut } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getClientSession, clearClientSession, ClientSession } from "@/hooks/useClientAuth";
import { Bet } from "@/entities";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  const isMobile = useIsMobile();

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

  const handleLogout = () => {
    clearClientSession();
    navigate("/login");
  };

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  return (
    <header 
      className="sticky top-0 z-40 bg-white flex items-center px-3 h-12 border-b border-[#e0e0e0]"
      style={arialFont}
    >
      {/* LEFT: Hamburger + Logo */}
      <div className="flex items-center shrink-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 border border-[#999] rounded-[3px] bg-white hover:bg-[#f5f5f5] transition-colors"
        >
          <Menu className="w-5 h-5 text-[#555555]" />
        </button>
        <span className="hidden lg:block font-black italic text-xl ml-3" style={{fontFamily:'Georgia,serif'}}>
          <span className="text-[#26c6da]">BPEXCH</span>
        </span>
      </div>

      {/* CENTER: Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-1 ml-6 flex-1">
        <NavLink to="/dashboard" label="Dashboard" />
        <NavLink to="/accounts" label="Users" />
        <NavLink to="/reports/daily-pl" label="Reports" />
      </nav>

      {/* RIGHT: User + Stats */}
      <div className={cn(
        "flex items-center justify-end gap-2",
        isMobile ? "flex-1 ml-2" : "lg:flex-none ml-auto"
      )}>
        {session ? (
          <div className="flex items-center gap-2 lg:gap-4 min-w-max">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-[#f5f5f5] px-1 lg:px-2 py-1 rounded transition-colors">
                  <span className="text-[#333] text-[13px] lg:text-sm font-medium">
                    {session.username} ({session.role ? formatRole(session.role) : ''})
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#555555]" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-[#d5d8dc] shadow-lg rounded w-48 mt-1">
                <div className="px-2 py-1.5 text-xs text-[#333] border-b border-[#d5d8dc] mb-1">
                  Logged in as <span className="font-semibold">{session.username}</span>
                </div>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[#e74c3c] hover:bg-red-50 cursor-pointer text-xs font-medium focus:text-[#e74c3c] focus:bg-red-50 p-2"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-1.5 lg:gap-3 border-l border-[#e0e0e0] pl-2 lg:pl-4">
              <span className="text-[12px] lg:text-sm font-bold text-[#333] whitespace-nowrap">
                B: <span className="text-black font-medium">0</span>
              </span>
              <span className="text-[12px] lg:text-sm font-bold text-[#333] whitespace-nowrap">
                Exp: <span className={cn("font-medium", totalExposure > 0 ? 'text-[#e74c3c]' : 'text-black')}>
                  {totalExposure > 0 ? `-${totalExposure.toLocaleString('en-IN')}` : totalExposure.toLocaleString('en-IN')}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-bold text-[#254465] hover:text-[#12b886] uppercase"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
