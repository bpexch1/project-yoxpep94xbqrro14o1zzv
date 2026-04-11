import { Menu, ChevronDown } from "lucide-react";
import { superdevClient } from "@/lib/superdev/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const handleLogout = async () => {
    await superdevClient.auth.logout();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F3F4F6] text-[#1F2937] h-10 flex items-center justify-between px-3 border-b border-gray-300 shadow-sm font-sans">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="text-[#1F2937] hover:text-teal-600 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-0.5 cursor-pointer hover:bg-gray-200 px-1 py-1 rounded transition-colors">
              <span className="text-[12px] font-medium text-gray-800">NomanSA8592 (Admin)</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded w-40 mt-1">
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 hover:bg-red-50 cursor-pointer text-xs font-medium focus:text-red-600 focus:bg-red-50"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-3 text-[12px]">
          <div className="flex items-center gap-1">
            <span className="font-bold">B:</span>
            <span className="text-emerald-600 font-bold">0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">Exp:</span>
            <span className="text-red-500 font-bold">0</span>
          </div>
        </div>
      </div>
    </header>
  );
}
