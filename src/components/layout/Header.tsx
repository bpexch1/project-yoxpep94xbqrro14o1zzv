import { useState, useEffect } from "react";
import { Menu, ChevronDown, LogOut } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getClientSession, clearClientSession, ClientSession } from "@/hooks/useClientAuth";
import { Bet } from "@/entities";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";
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

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const navigate = useNavigate();

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
      className="sticky top-0 z-40 bg-white flex items-center px-3 h-12 border-b border-[#dcdcdc]"
      style={arialFont}
    >
      {/* LEFT: Hamburger */}
      <div className="flex items-center shrink-0 w-1/4">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1 border border-[#bdc3c7] rounded bg-white hover:bg-[#f5f5f5] transition-colors"
        >
          <Menu className="w-5 h-5 text-[#555555]" />
        </button>
      </div>

      {/* CENTER: Username */}
      <div className="flex-1 flex justify-center overflow-hidden px-2">
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer truncate max-w-full">
                <span className="text-[#333] text-[14px] font-bold truncate">
                  {session.username} ({session.role ? formatRole(session.role) : ''})
                </span>
                <ChevronDown className="w-3 h-3 text-[#555555] shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-white border border-[#d5d8dc] shadow-lg rounded w-48 mt-1">
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
        )}
      </div>

      {/* RIGHT: Stats */}
      <div className="flex items-center justify-end gap-2 w-1/4">
        {session ? (
          <div className="flex flex-col items-end leading-none">
            <span className="text-[11px] font-bold text-[#333] whitespace-nowrap">
              B: <span className="text-black">0</span>
            </span>
            <span className="text-[11px] font-bold text-[#333] whitespace-nowrap mt-0.5">
              Exp: <span className={totalExposure > 0 ? 'text-[#e74c3c]' : 'text-black'}>
                {totalExposure > 0 ? `-${totalExposure.toLocaleString('en-IN')}` : totalExposure.toLocaleString('en-IN')}
              </span>
            </span>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-xs font-bold text-[#254465] uppercase"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
