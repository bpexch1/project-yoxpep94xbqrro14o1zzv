import { 
  LayoutDashboard, Users, CircleDollarSign, FileBarChart2, Lock, Star, Globe, Activity, CircleDot, Trophy, Zap, Rabbit, X, ChevronLeft 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const mainMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard, link: "/dashboard" },
  { label: "Users", icon: Users, link: "/accounts" },
  { label: "Current Position", icon: CircleDollarSign, link: "/current-position" },
  { label: "Reports", icon: FileBarChart2, link: "/reports/daily-pl" },
  { label: "Bet Lock", icon: Lock, link: "/bet-lock" },
  { label: "Star Casino", icon: Star, link: "/star-casino" },
  { label: "World Casino", icon: Globe, link: "/world-casino" },
  { label: "BetFair Games", icon: Globe, link: "/betfair-games" },
];

const sportsItems = [
  { label: "Soccer", icon: CircleDot, link: "/sports/soccer" },
  { label: "Tennis", icon: Activity, link: "/sports/tennis" },
  { label: "Cricket", icon: Trophy, link: "/sports/cricket" },
  { label: "Horse Race", icon: Zap, link: "/sports/horse-race" },
  { label: "Greyhound", icon: Rabbit, link: "/sports/greyhound" },
];

function SidebarNavItems({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (link: string) => {
    navigate(link);
    onNavigate();
  };

  const allItems = [
    ...mainMenuItems.map(item => ({ ...item, showArrow: false })),
    ...sportsItems.map(item => ({ ...item, showArrow: true })),
  ];

  return (
    <nav className="flex flex-col py-2">
      {allItems.map((item) => {
        const isActive = location.pathname === item.link || (item.link !== "/" && location.pathname.startsWith(item.link));
        return (
          <button
            key={item.label}
            onClick={() => handleNavigate(item.link)}
            className={cn(
              "flex items-center gap-4 px-6 py-3 text-[15px] transition-colors text-left w-full",
              isActive ? "bg-white/5 text-white" : "text-white/85 hover:bg-white/5"
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#26c6da]" : "text-[#5d8a9a]")} />
            <span className="flex-1">{item.label}</span>
            {item.showArrow && <ChevronLeft className="w-3.5 h-3.5 text-[#4a7080] shrink-0" />}
          </button>
        );
      })}
    </nav>
  );
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* DESKTOP SIDEBAR: fixed left, always visible on lg+ */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[240px] z-30 bg-[#1e2d3a] flex-col overflow-y-auto">
        {/* Logo area */}
        <div className="flex items-center justify-center h-14 border-b border-[#152535]">
          <span className="text-white font-black italic text-2xl" style={{fontFamily:'Georgia,serif'}}>BP</span>
          <span className="text-[#26c6da] font-bold text-sm ml-2">Exchange</span>
        </div>
        <SidebarNavItems onNavigate={() => {}} />
      </aside>

      {/* MOBILE SIDEBAR: AnimatePresence overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed left-0 top-0 h-full w-[260px] z-50 bg-[#1e2d3a] flex flex-col overflow-y-auto lg:hidden"
            >
              <div className="p-4 border-b border-[#152535] flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-white font-black italic text-xl" style={{fontFamily:'Georgia,serif'}}>BP</span>
                  <span className="text-[#26c6da] font-bold text-xs ml-2">Exchange</span>
                </div>
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <SidebarNavItems onNavigate={onMobileClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
