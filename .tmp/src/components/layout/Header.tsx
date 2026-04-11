import { useState } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { superdevClient } from "@/lib/superdev/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "./Sidebar";

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await superdevClient.auth.logout();
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="sticky top-0 z-50 bg-[#F3F4F6] text-[#1F2937] h-12 flex items-center px-3 border-b border-gray-300 shadow-sm font-sans">
        
        {/* LEFT: Bordered hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="border border-gray-400 rounded p-1.5 hover:bg-gray-200 transition-colors flex-shrink-0"
        >
          <Menu className="w-4 h-4 text-gray-700" />
        </button>

        {/* CENTER: Username dropdown */}
        <div className="flex-1 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 px-2 py-1 rounded transition-colors">
                <span className="text-[13px] font-bold text-gray-800">NomanSA8592 (Admin)</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-white border border-gray-200 shadow-lg rounded w-40 mt-1">
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 cursor-pointer text-xs font-medium focus:text-red-600 focus:bg-red-50"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* RIGHT: B: and Exp: */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[13px] font-bold text-gray-800">B: <span className="text-emerald-600">0</span></span>
          <span className="text-[13px] font-bold text-gray-800">Exp: <span className="text-red-500">0</span></span>
        </div>

      </header>
    </>
  );
}
