import React from "react";
import { Menu, Home, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-slate-800 text-white h-12 flex items-center justify-between px-3 shadow-md border-b border-slate-700">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-1.5 text-slate-400 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => navigate("/")}
          className="p-1.5 text-slate-400 hover:text-white transition-colors"
          aria-label="Go home"
        >
          <Home className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex bg-slate-900 rounded-full px-3 py-1 items-center gap-2 max-w-[160px]">
          <span className="text-[10px] font-mono text-slate-500 truncate lowercase">
            {location.pathname === "/" ? "home" : location.pathname.substring(1)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1 cursor-pointer group">
          <span className="text-slate-300 group-hover:text-emerald-400 transition-colors font-medium">
            NomanSA8592 (SuperAdmin)
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </div>
        
        <div className="flex items-center gap-3 font-bold tracking-tight border-l border-slate-700 pl-4">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-normal">B:</span>
            <span className="text-emerald-400">0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-normal">Exp:</span>
            <span className="text-rose-400">0</span>
          </div>
        </div>
      </div>
    </header>
  );
}
