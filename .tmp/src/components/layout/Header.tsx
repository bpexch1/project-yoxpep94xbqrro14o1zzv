import { useState, useEffect } from "react";
import { Menu, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getClientSession, clearClientSession, ClientSession } from "@/hooks/useClientAuth";
import { Bet } from "@/entities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [totalExposure, setTotalExposure] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const s = getClientSession();
    setSession(s);
    if (s?.id) {
      // Fetch all pending bets exposure
      Bet.filter({ status: 'pending' }, '-created_at', 500)
        .then((pendingBets: any[]) => {
          const total = pendingBets.reduce((sum: number, b: any) => sum + (Number(b.stake) || 0), 0);
          setTotalExposure(total);
        })
        .catch((e) => console.error('Exp fetch error:', e));
    }
  }, []);

  const handleLogout = () => {
    clearClientSession();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#ecf0f1] flex items-center justify-between px-4 h-12 border-b border-[#d5d8dc] shadow-none">
      {/* LEFT: Hamburger */}
      <div className="flex items-center">
        <button 
          onClick={onOpenMobileSidebar}
          className="p-1 hover:bg-[#d5d8dc] rounded transition-colors"
        >
          <Menu className="w-5 h-5 text-[#2c3e50]" />
        </button>
      </div>

      {/* CENTER: User info with dropdown */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer hover:bg-[#d5d8dc] px-2 py-1 rounded transition-colors">
                <span className="text-[#2c3e50] text-sm font-medium">
                  {session.username} <span className="text-[#7f8c8d]">({session.role})</span>
                </span>
                <ChevronDown className="w-3 h-3 text-[#7f8c8d]" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-white border border-[#d5d8dc] shadow-lg rounded w-48 mt-1">
              <div className="px-2 py-1.5 text-xs text-[#7f8c8d] border-b border-[#d5d8dc] mb-1">
                Logged in as <span className="font-semibold text-[#2c3e50]">{session.username}</span>
              </div>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-[#e74c3c] hover:bg-red-50 cursor-pointer text-xs font-medium focus:text-[#e74c3c] focus:bg-red-50"
              >
                <LogOut className="w-3 h-3 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button 
            onClick={() => navigate("/login")}
            className="text-sm font-bold text-[#2c3e50] hover:text-[#7f8c8d] uppercase"
          >
            Login
          </button>
        )}
      </div>

      {/* RIGHT: B and Exp */}
      <div className="flex items-center gap-3 text-sm text-[#2c3e50] font-medium">
        <span>B: <span className="font-bold">0</span></span>
        <span>
          Exp: <span className={`font-bold ${totalExposure > 0 ? 'text-[#e74c3c]' : ''}`}>
            {totalExposure > 0 ? `-${totalExposure.toLocaleString('en-IN')}` : totalExposure.toLocaleString('en-IN')}
          </span>
        </span>
      </div>
    </header>
  );
}
