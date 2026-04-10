import React, { useState, useEffect, useRef } from "react";
import { Menu, ChevronDown, LogOut } from "lucide-react";
import { superdevClient } from "@/lib/superdev/client";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
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
    <header className="sticky top-0 z-50 bg-slate-800 text-white h-12 flex items-center justify-between px-3 shadow-md">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-1 text-white hover:opacity-80 transition-opacity"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 cursor-pointer outline-none"
          >
            <span className="text-[13px] font-medium text-slate-100">
              NomanSA8592 (SuperAdmin)
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-slate-200 font-bold text-xs">NomanSA8592</p>
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
      </div>

      <div className="flex items-center gap-3 text-[11px] font-bold">
        <div className="flex items-center gap-1">
          <span>B:</span>
          <span className="text-emerald-400">0</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Exp:</span>
          <span className="text-rose-400">0</span>
        </div>
      </div>
    </header>
  );
}
