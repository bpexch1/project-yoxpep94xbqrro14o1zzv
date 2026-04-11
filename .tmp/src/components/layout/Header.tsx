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
import { Sidebar } from "./Sidebar";

export function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    <>
      <header className="sticky top-0 z-40 bg-white flex items-center justify-between px-4 h-12 border-b border-gray-200 shadow-sm">
        {/* LEFT: Hamburger */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* RIGHT: User info and Balance */}
        <div className="flex items-center gap-3">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                  <span className="text-gray-600 text-sm">
                    {session.full_name} <span className="text-gray-400 text-xs">({session.role})</span>
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded w-48 mt-1">
                <div className="px-2 py-1.5 text-xs text-gray-500 border-b border-gray-100 mb-1">
                  Logged in as <span className="font-semibold text-gray-700">{session.username}</span>
                </div>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50 cursor-pointer text-xs font-medium focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button 
              onClick={() => navigate("/login")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase"
            >
              Login
            </button>
          )}

          <div className="flex items-center gap-2 text-sm whitespace-nowrap border-l border-gray-200 pl-3">
            <span className="text-gray-800"><span className="font-bold">B:</span> 0</span>
            <span className="text-gray-800"><span className="font-bold">Exp:</span> 0</span>
          </div>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
