import { useState, useEffect } from "react";
import { Menu, ChevronDown, LogOut } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getClientSession, clearClientSession, ClientSession } from "@/hooks/useClientAuth";
import { Bet } from "@/entities";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

const NavLink = ({ to, label }: { to: string; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to.split('?')[0]));
  
  return (
    <Link 
      to={to} 
      className={cn(
        "px-3 py-1.5 text-xs rounded transition-colors font-semibold uppercase tracking-wider",
        isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
      )}
    >
      {label}
    </Link>
  );
};

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
        .catch(() => {}); // silently ignore fetch errors
    }
  }, []);

  const handleLogout = () => {
    clearClientSession();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1a3550] flex items-center px-3 h-12 border-b border-[#0f2236] shadow-sm">
      {/* LEFT: Hamburger + Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <button 
          onClick={onOpenMobileSidebar}
          className="p-1.5 border border-white/20 rounded bg-transparent hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        <Link to="/dashboard" className="flex items-baseline group">
          <span className="font-pacifico text-white text-xl leading-none">BP</span>
          <span className="text-[#3dd6c8] font-bold text-xs ml-1 uppercase tracking-tighter">Exchange</span>
        </Link>
      </div>

      {/* CENTER: Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-1 ml-8 flex-1">
        <NavLink to="/dashboard" label="Dashboard" />
        <NavLink to="/accounts" label="Users" />
        <NavLink to="/reports/daily-pl" label="Reports" />
      </nav>

      {/* RIGHT SECTION: User + Stats */}
      <div className="flex items-center ml-auto gap-2 lg:gap-4 overflow-hidden">
        {session ? (
          <>
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors shrink-0 max-w-[120px] lg:max-w-none">
                  <span className="text-white text-xs lg:text-sm font-semibold truncate">
                    {session.username} <span className="text-white/60 font-normal">({session.role?.charAt(0).toUpperCase()})</span>
                  </span>
                  <ChevronDown className="w-3 h-3 text-white" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a3550] border border-[#0f2236] shadow-2xl rounded-md w-48 mt-1">
                <div className="px-3 py-2 text-[10px] text-white/50 border-b border-white/10 mb-1 uppercase tracking-widest">
                  Account: <span className="font-bold text-white">{session.username}</span>
                </div>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 hover:bg-red-500/10 cursor-pointer text-xs font-semibold focus:text-red-400 focus:bg-red-500/10 px-3 py-2"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Stats Separator */}
            <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block" />

            {/* Stats */}
            <div className="flex items-center gap-2 lg:gap-3 shrink-0 pr-1">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[10px] text-white/60 font-bold uppercase">B:</span>
                <span className="text-[11px] lg:text-xs font-bold text-white">0</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[10px] text-white/60 font-bold uppercase">Exp:</span>
                <span className={cn(
                  "text-[11px] lg:text-xs font-bold",
                  totalExposure > 0 ? 'text-red-400' : 'text-white'
                )}>
                  {totalExposure > 0 ? `-${totalExposure.toLocaleString('en-IN')}` : totalExposure.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </>
        ) : (
          <button 
            onClick={() => navigate("/login")}
            className="text-xs font-bold text-white hover:text-white/80 uppercase tracking-wider"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
