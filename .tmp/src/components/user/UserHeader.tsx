import { User } from "@/entities";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearClientSession } from "@/hooks/useClientAuth";

interface UserHeaderProps {
  userEmail: string;
  clientBalance?: number;
  creditRemaining?: number;
  onMenuToggle: () => void;
  sidebarOpen?: boolean;
  // Included as requested by plan but sport tabs move to main content
  activeFilter?: string;
  onFilterChange?: (f: string) => void;
}

export function UserHeader({ 
  userEmail, 
  clientBalance = 0, 
  creditRemaining = 0, 
  onMenuToggle,
  sidebarOpen 
}: UserHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await User.logout();
    clearClientSession();
    navigate("/login");
  };

  return (
    <header className="flex flex-col w-full z-50 sticky top-0">
      {/* Top Navy Bar */}
      <div className="bg-[#1e3a5c] h-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuToggle}
            className="text-white hover:text-white/80 transition-colors z-[110]"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <span className="text-white font-bold text-sm tracking-wide">Dashboard</span>
        </div>

        <div className="flex-1 max-w-md mx-4 hidden md:flex overflow-hidden relative">
          <div className="whitespace-nowrap animate-marquee flex items-center gap-2 text-white text-[11px] font-medium italic">
            <span>Announcement :- ⚡</span>
            <span>Welcome to BETPRO EXCHANGE. Enjoy the best betting experience! ⚡</span>
            <span>Check out our new Aviator game and Sports Book! ⚡</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-white font-bold text-[11px] uppercase tracking-wider">
            <span>B: 0</span>
            <span className="opacity-30">|</span>
            <span>L: 0</span>
          </div>
          
          <div className="flex items-center gap-1 group cursor-pointer" onClick={handleLogout}>
            <span className="text-white font-bold text-[11px] uppercase tracking-widest">{userEmail}</span>
            <ChevronDown className="w-3 h-3 text-white/60 group-hover:text-white" />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-[#254465] h-10 border-t border-white/5 flex items-center justify-center">
        <div className="container mx-auto px-4 flex items-center justify-between text-white font-bold text-[10px] md:text-[11px] uppercase tracking-widest whitespace-nowrap overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-1">
            <span className="text-white/60">Credit:</span>
            <span>{creditRemaining.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1">
            <span className="text-white/60">Balance:</span>
            <span>{clientBalance.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1">
            <span className="text-white/60">Liable:</span>
            <span className="text-red-400">0</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1">
            <span className="text-white/60">Active Bets:</span>
            <span>0</span>
          </div>
        </div>
      </div>
    </header>
  );
}
