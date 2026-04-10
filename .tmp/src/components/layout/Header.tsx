import React, { useState, useEffect, useRef } from "react";
import { Menu, Home, ChevronDown, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { superdevClient } from "@/lib/superdev/client";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 cursor-pointer group outline-none"
          >
            <span className="text-slate-300 group-hover:text-emerald-400 transition-colors font-medium">
              NomanSA8592 (SuperAdmin)
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-slate-200 font-bold">NomanSA8592</p>
                <p className="text-slate-500 text-[10px]">SuperAdmin Account</p>
              </div>
              <button 
                onClick={() => superdevClient.auth.logout()}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-400 hover:bg-slate-800 transition-colors text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
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
