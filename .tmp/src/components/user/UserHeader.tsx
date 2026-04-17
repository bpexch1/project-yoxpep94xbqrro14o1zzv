import { useState, useRef, useEffect } from "react";
import { User } from "@/entities";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Bell, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearClientSession } from "@/hooks/useClientAuth";

interface UserHeaderProps {
  userEmail: string;
  clientBalance?: number;
  creditRemaining?: number;
  onMenuToggle: () => void;
  sidebarOpen?: boolean;
  onLoadBalance?: () => void;
  // Included as requested by plan but sport tabs move to main content
  activeFilter?: string;
  onFilterChange?: (f: string) => void;
}

export function UserHeader({ 
  userEmail, 
  clientBalance = 0, 
  creditRemaining = 0, 
  onMenuToggle,
  sidebarOpen,
  onLoadBalance
}: UserHeaderProps) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = async () => {
    await User.logout();
    clearClientSession();
    navigate("/login");
  };

  const menuItems = ["Statement", "Result", "Profit Loss", "Bet History", "Profile"];

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
          <div className="whitespace-nowrap animate-marquee flex items-center gap-2 text-white text-[12px] font-medium">
            <span>Welcome to Exchange.</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 text-white hover:opacity-80 transition-opacity"
            >
              <span className="text-[12px] font-bold">B: Rs. {clientBalance.toLocaleString('en-IN')} | L: 0</span>
              <span className="text-[12px] font-bold ml-1">{userEmail}</span>
              <ChevronDown className="w-3 h-3 text-white/70" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-1 z-[200] bg-white shadow-lg border border-gray-200 min-w-[160px] rounded-sm py-1">
                {menuItems.map(item => (
                  <button 
                    key={item} 
                    onClick={() => {
                      setDropdownOpen(false);
                      if (item === "Profile") navigate("/play/profile");
                    }} 
                    className="block w-full text-left px-4 py-3 text-[14px] text-gray-800 hover:bg-gray-100 border-b border-gray-100 transition-colors"
                  >
                    {item}
                  </button>
                ))}
                <button 
                  onClick={handleLogout} 
                  className="block w-full text-left px-4 py-3 text-[14px] text-red-600 font-medium hover:bg-gray-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-[#254465] h-10 border-t border-white/5 flex items-center justify-center">
        <div className="container mx-auto px-4 flex items-center justify-between text-white font-bold text-[10px] md:text-[11px] uppercase tracking-widest whitespace-nowrap overflow-x-auto no-scrollbar gap-4">
          
          <button
            onClick={onLoadBalance}
            className="flex items-center gap-1 bg-[#00ab81] hover:bg-[#009973] active:scale-95 text-white text-[10px] font-bold px-2 py-1 rounded-sm transition-all whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Load Balance
          </button>

          <div className="flex items-center gap-4">
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
      </div>
    </header>
  );
}
