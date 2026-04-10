import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Lock, 
  Star, 
  Globe, 
  Globe2, 
  X, 
  ChevronDown, 
  ChevronRight,
  Circle,
  Activity,
  Target,
  Zap,
  Wind,
  SlidersHorizontal,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { superdevClient } from "@/lib/superdev/client";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Users", icon: Users, path: "/accounts" },
  { label: "Current Position", icon: SlidersHorizontal, path: "/reports/current-position" },
  { label: "Reports", icon: FileText, path: "/reports/daily-pl" },
  { label: "Bet Lock", icon: Lock, path: "/reports/bet-lock" },
  { label: "Star Casino", icon: Star, path: "/casino/star" },
  { label: "World Casino", icon: Globe, path: "/casino/world" },
  { label: "BetFair Games", icon: Globe2, path: "/games/betfair" },
];

const sports = [
  { id: "soccer", label: "Soccer", icon: Circle },
  { id: "tennis", label: "Tennis", icon: Activity },
  { id: "cricket", label: "Cricket", icon: Target },
  { id: "horse-race", label: "Horse Race", icon: Zap },
  { id: "greyhound", label: "Greyhound", icon: Wind },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [expandedSports, setExpandedSports] = useState<Record<string, boolean>>({});

  const toggleSport = (id: string) => {
    setExpandedSports(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 h-full w-72 bg-slate-900 text-white z-[70] flex flex-col shadow-2xl border-r border-slate-800"
      >
        <div className="flex items-center justify-between p-4 bg-slate-950/50 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
              E
            </div>
            <span className="text-lg font-bold tracking-tight">
              Exchange <span className="text-emerald-500">Admin</span>
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all",
                    isActive 
                      ? "bg-emerald-600/10 text-emerald-400 border-r-2 border-emerald-500" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-emerald-400" : "text-slate-500")} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 px-4 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Sports Betting
          </div>
          
          <div className="space-y-0.5 pb-8">
            {sports.map((sport) => (
              <div key={sport.id}>
                <button
                  onClick={() => toggleSport(sport.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <sport.icon className="w-5 h-5 text-emerald-500/70" />
                    {sport.label}
                  </div>
                  {expandedSports[sport.id] ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
                
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out bg-slate-950/30",
                    expandedSports[sport.id] ? "max-height-40 opacity-100" : "max-h-0 opacity-0"
                  )}
                  style={{ maxHeight: expandedSports[sport.id] ? '200px' : '0' }}
                >
                  <div className="pl-12 pr-4 py-1 space-y-1 text-[13px] text-slate-500">
                    <div className="py-2 hover:text-emerald-400 cursor-pointer transition-colors border-b border-slate-800/50 last:border-0">Live Events</div>
                    <div className="py-2 hover:text-emerald-400 cursor-pointer transition-colors border-b border-slate-800/50 last:border-0">Upcoming</div>
                    <div className="py-2 hover:text-emerald-400 cursor-pointer transition-colors border-b border-slate-800/50 last:border-0">Results</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => superdevClient.auth.logout()}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-slate-800 rounded-lg transition-colors group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Logout
          </button>
        </div>
      </motion.aside>
    </>
  );
}
