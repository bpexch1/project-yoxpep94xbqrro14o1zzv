import { useState, useEffect } from "react";
import { Menu, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getClientSession, clearClientSession, ClientSession } from "@/hooks/useClientAuth";
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
  const navigate = useNavigate();

  useEffect(() => {
    setSession(getClientSession());
  }, []);

  const handleLogout = () => {
    clearClientSession();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#254465] flex items-center justify-between px-4 h-14 border-b border-[#1a3550] shadow-sm">
      {/* LEFT: Hamburger or Logo Label */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1 hover:bg-[#3d6b8b] rounded transition-colors"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
        <div className="hidden lg:flex items-center">
          <span className="text-white font-bold text-sm tracking-wide">EXCHANGE ADMIN</span>
        </div>
      </div>

      {/* RIGHT: User info and Balance */}
      <div className="flex items-center gap-3">
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer hover:bg-[#3d6b8b] px-2 py-1 rounded transition-colors">
                <span className="text-white text-sm font-medium">
                  {session.full_name} <span className="text-[#a8c8e8] text-xs">({session.role})</span>
                </span>
                <ChevronDown className="w-3 h-3 text-[#a8c8e8]" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-[#d5d8dc] shadow-lg rounded w-48 mt-1">
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
            className="text-xs font-bold text-[#00b181] hover:text-[#4dbd74] uppercase"
          >
            Login
          </button>
        )}

        <div className="flex items-center gap-2 text-sm whitespace-nowrap border-l border-[#3d6b8b] pl-3">
          <div className="flex flex-col lg:flex-row lg:gap-3">
            <span className="text-white font-bold text-xs lg:text-sm"><span className="text-[#a8c8e8]">B:</span> 0.00</span>
            <span className="text-white font-bold text-xs lg:text-sm"><span className="text-[#a8c8e8]">Exp:</span> 0.00</span>
          </div>
        </div>
      </div>
    </header>
  );
}
