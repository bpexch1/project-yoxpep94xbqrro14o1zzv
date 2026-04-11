import { useState, useEffect } from "react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [username, setUsername] = useState("NomanSA8592");

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await superdevClient.auth.me();
        if (user?.full_name) setUsername(user.full_name);
      } catch (e) {
        // use default
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await superdevClient.auth.logout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white flex items-center justify-between px-4 h-12 border-b border-gray-200 shadow-sm">
        {/* LEFT: Hamburger */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>

        {/* RIGHT: User info and Balance */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                <span className="text-gray-600 text-sm">{username} <span className="text-gray-500">(Admin)</span></span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
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

          <div className="flex items-center gap-2 text-sm whitespace-nowrap">
            <span className="text-gray-800"><span className="font-bold">B:</span> 0</span>
            <span className="text-gray-800"><span className="font-bold">Exp:</span> 0</span>
          </div>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
