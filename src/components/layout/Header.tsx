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
        "px-3 py-1.5 text-sm rounded transition-colors font-medium whitespace-nowrap",
        isActive ? "bg-[#3d6b8b] text-white" : "text-white/80 hover:bg-[#3d6b8b]"
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
      Bet.filter({ status: 'pending' }, '-created_at', 500)
        .then((pendingBets: any[]) => {
          const total = pendingBets.reduce((sum: number, b: any) => sum + (Number(b.stake) || 0), 0);
          setTotalExposure(total);
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    clearClientSession();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#254465] flex items-center px-3 h-12 border-b border-[#1a3550]">
      {/* LEFT: Hamburger + Logo */}
      <div className="flex items-center shrink-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded hover:bg-[#3d6b8b] transition-colors"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        <span className="hidden lg:block font-black italic text-xl text-white ml-2" style={{fontFamily:'Georgia,serif'}}>
          BP<span className="text-[#3dd6c8] font-bold text-sm not-italic ml-1">Exchange</span>
        </span>
      </div>

      {/* CENTER: Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-1 ml-6 flex-1">
        <NavLink to="/dashboard" label="Dashboard" />
        <NavLink to="/accounts" label="Users" />
        <NavLink to="/reports/daily-pl" label="Reports" />
      </nav>

      {/* RIGHT: User + Stats */}
      <div className="flex-1 lg:flex-none flex items-center justify-end ml-auto gap-3">
        {session ? (
          <div className="flex items-center gap-3 lg:gap-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-[#3d6b8b] px-2 py-1 rounded transition-colors">
                  <span className="text-white text-sm font-semibold">
                    {session.username} ({session.role ? session.role.charAt(0).toUpperCase() + session.role.slice(1) : ''})
                  </span>
                  <ChevronDown className="w-3 h-3 text-white/70" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-[#d5d8dc] shadow-lg rounded w-48 mt-1">
                <div className="px-2 py-1.5 text-xs text-[#2c3e50] border-b border-[#d5d8dc] mb-1">
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

            <div className="flex items-center gap-2 border-l border-white/20 pl-3 lg:pl-5">
              <span className="text-sm font-bold text-white whitespace-nowrap">
                B: <span>0</span>
              </span>
              <span className="text-sm font-bold text-white whitespace-nowrap">
                Exp: <span className={totalExposure > 0 ? 'text-[#ff6b6b]' : 'text-white'}>
                  {totalExposure > 0 ? `-${totalExposure.toLocaleString('en-IN')}` : totalExposure.toLocaleString('en-IN')}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-bold text-white hover:text-white/80 uppercase"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
