import { Menu, ChevronDown, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { superdevClient } from "@/lib/superdev/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await superdevClient.auth.logout();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F3F4F6] text-[#1F2937] h-12 flex items-center justify-between px-4 border-b border-gray-300 shadow-sm font-sans">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="text-[#1F2937] hover:text-emerald-600 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button 
          onClick={() => navigate("/")}
          className="text-[#1F2937] hover:text-emerald-600 transition-colors"
        >
          <Home className="w-5 h-5" />
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 px-2 py-1 rounded transition-colors ml-1">
              <span className="text-[13px] font-medium">NomanSA8592 (SuperAdmin)</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-white border border-gray-200 shadow-lg rounded w-48 mt-1">
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 hover:bg-red-50 cursor-pointer font-medium focus:text-red-600 focus:bg-red-50"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center gap-4 text-[13px] font-bold">
        <div className="flex items-center gap-1">
          <span className="text-gray-500 font-normal">B:</span>
          <span className="text-emerald-600">0</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 font-normal">Exp:</span>
          <span className="text-red-500">0</span>
        </div>
      </div>
    </header>
  );
}
