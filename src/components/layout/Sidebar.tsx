import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Filter, 
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
  Wind
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Users", icon: Users, path: "/accounts" },
  { label: "Current Position", icon: Target, path: "/reports/current-position" },
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
            className="fixed inset-0 bg-black/50 z-30"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 h-full w-72 bg-slate-900 text-white z-40 flex flex-col shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <span className="text-xl font-bold text-emerald-500">Exchange Admin</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-800",
                  location.pathname === item.path ? "bg-emerald-600 text-white" : "text-slate-300"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-8 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Sports
          </div>
          
          <div className="space-y-1">
            {sports.map((sport) => (
              <div key={sport.id}>
                <button
                  onClick={() => toggleSport(sport.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <sport.icon className="w-5 h-5 text-emerald-500" />
                    {sport.label}
                  </div>
                  {expandedSports[sport.id] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSports[sport.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-950/50"
                    >
                      <div className="pl-12 pr-4 py-2 space-y-2 text-xs text-slate-400">
                        <div className="py-1 hover:text-white cursor-pointer">Live Events</div>
                        <div className="py-1 hover:text-white cursor-pointer">Upcoming</div>
                        <div className="py-1 hover:text-white cursor-pointer">Results</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </nav>
      </motion.aside>
    </>
  );
}
