import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, LayoutDashboard, Users, BarChart3, Lock, 
  Gamepad2, Star, Globe, Trophy, ChevronRight,
  TrendingUp, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Users", icon: Users, path: "/accounts" },
  { label: "Current Position", icon: TrendingUp, path: "/reports/current-position" },
  { label: "Reports", icon: BarChart3, path: "/reports/daily-pl" },
  { label: "Bet Lock", icon: Lock, path: "/bet-lock" },
  { label: "Star Casino", icon: Star, path: "/casino/star" },
  { label: "World Casino", icon: Globe, path: "/casino/world" },
  { label: "BetFair Games", icon: Gamepad2, path: "/games/betfair" },
];

const sportsItems = [
  { label: "Soccer", path: "/sports/soccer" },
  { label: "Tennis", path: "/sports/tennis" },
  { label: "Cricket", path: "/sports/cricket" },
  { label: "Horse Race", path: "/sports/horse" },
  { label: "Greyhound", path: "/sports/greyhound" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [expandedSports, setExpandedSports] = useState<string[]>([]);

  const toggleSport = (sport: string) => {
    setExpandedSports(prev => 
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isOpen) onClose();
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar Content */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-72 bg-slate-900 text-white z-[70] shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center font-bold text-xl">
                  E
                </div>
                <span className="font-bold text-lg tracking-tight">Exchange Admin</span>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Nav */}
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium transition-all group",
                    location.pathname === item.path
                      ? "bg-emerald-600/10 text-emerald-400 border-r-2 border-emerald-500"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    location.pathname === item.path ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                  )} />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Sports Section */}
            <div className="mt-6 px-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Sports Betting
              </span>
            </div>
            
            <nav className="p-3 space-y-1">
              {sportsItems.map((sport) => (
                <div key={sport.path} className="space-y-1">
                  <button
                    onClick={() => toggleSport(sport.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[14px] font-medium transition-all group",
                      "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-slate-500 group-hover:text-slate-300" />
                      {sport.label}
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-slate-600 transition-transform",
                      expandedSports.includes(sport.label) && "rotate-90"
                    )} />
                  </button>
                  
                  <AnimatePresence>
                    {expandedSports.includes(sport.label) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-11"
                      >
                        <Link 
                          to={`${sport.path}/live`}
                          className="block py-2 text-[13px] text-slate-500 hover:text-emerald-400 transition-colors"
                        >
                          Live Matches
                        </Link>
                        <Link 
                          to={`${sport.path}/upcoming`}
                          className="block py-2 text-[13px] text-slate-500 hover:text-emerald-400 transition-colors"
                        >
                          Upcoming
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Wallet Footer */}
            <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Wallet className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Available Balance</div>
                  <div className="text-white font-bold">₹0.00</div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
