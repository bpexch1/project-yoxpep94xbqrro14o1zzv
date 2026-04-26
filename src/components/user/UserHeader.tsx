import React, { useState, useEffect } from "react";
import { User, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getClientSession, clearClientSession, ClientSession } from "@/hooks/useClientAuth";
import { Client } from "@/entities";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserHeader() {
  const [session, setSession] = useState<ClientSession | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const s = getClientSession();
    if (!s) {
      navigate("/login");
    } else {
      setSession(s);
    }
  }, [navigate]);

  const { data: balance = 0 } = useQuery({
    queryKey: ["user-balance", session?.id],
    queryFn: async () => {
      if (!session?.id) return 0;
      const clients = await Client.filter({ username: session.username }, "-created_at", 1);
      return (clients as any)?.[0]?.cash ?? 0;
    },
    enabled: !!session?.id,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    clearClientSession();
    navigate("/login");
  };

  if (!session) return null;

  return (
    <header className="bg-[#2c3e50] h-[50px] flex items-center px-3 sticky top-0 z-50 shadow-md">
      {/* Logo */}
      <Link to="/play" className="flex items-center gap-1 shrink-0">
        <span className="font-black italic text-xl" style={{fontFamily:'Georgia,serif'}}>
          <span className="text-white">Bp</span><span className="text-[#3DCCC8]">Exch</span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        {/* Balance Display */}
        <div className="bg-[#1f3044] rounded px-2 py-1 flex items-center gap-2 border border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/60 font-bold leading-tight uppercase">Coins</span>
            <span className="text-[13px] text-[#3DCCC8] font-black leading-tight">
              {balance.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 hover:bg-white/5 p-1.5 rounded transition-colors border border-white/5">
              <div className="w-7 h-7 rounded-full bg-[#3DCCC8]/20 flex items-center justify-center text-[#3DCCC8]">
                <User className="w-4 h-4" />
              </div>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#2c3e50] border border-white/10 shadow-xl min-w-[160px] p-1">
            <div className="px-3 py-2 border-b border-white/5 mb-1">
              <p className="text-[10px] text-white/40 font-bold uppercase">Account</p>
              <p className="text-white text-xs font-bold truncate">{session.username}</p>
            </div>
            <DropdownMenuItem onClick={() => navigate("/play/profile")} className="text-white/80 hover:text-white hover:bg-white/5 cursor-pointer text-xs focus:bg-white/5 focus:text-white">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/5 cursor-pointer text-xs focus:bg-red-500/5 focus:text-red-300">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
