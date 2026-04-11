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
      <header className="sticky top-0 z-50 bg-[#1e3a5f] text-white h-12 flex items-center px-3 border-b border-white/10 shadow-sm font-sans">
        
        {/* LEFT: Plain hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-white/10 transition-colors rounded flex-shrink-0"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        {/* CENTER: Username - white text */}
        <div className="flex-1 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors">
                <span className="text-sm font-medium">NomanSA8592 (Admin)</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/70" />
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
        <div className="flex items-center gap-2 flex-shrink-0 text-[11px] sm:text-xs">
          <div className="flex flex-col sm:flex-row sm:gap-2 leading-tight">
            <span>B: <span className="font-bold">0</span></span>
            <span>Exp: <span className="font-bold">0</span></span>
          </div>
        </div>

      </header>
    </>
  );
}
