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

  return (
    <nav className="flex flex-col py-1">
      {/* Main menu items */}
      {mainMenuItems.map((item) => {
        const isActive = location.pathname === item.link || (item.link !== "/" && location.pathname.startsWith(item.link));
        return (
          <button
            key={item.label}
            onClick={() => handleNavigate(item.link)}
            className={cn(
              "flex items-center gap-5 px-5 py-[18px] text-[16px] transition-colors text-left w-full",
              isActive ? "text-white" : "text-white/85 hover:bg-white/5"
            )}
          >
            <item.icon className={cn("w-6 h-6 shrink-0", isActive ? "text-[#26c6da]" : "text-[#5d8a9a]")} />
            <span className="flex-1">{item.label}</span>
          </button>
        );
      })}

      {/* Separator */}
      <div className="h-px bg-white/10 mx-5 my-1" />

      {/* Sports items */}
      {sportsItems.map((item) => {
        const isActive = location.pathname === item.link || (item.link !== "/" && location.pathname.startsWith(item.link));
        return (
          <button
            key={item.label}
            onClick={() => handleNavigate(item.link)}
            className={cn(
              "flex items-center gap-5 px-5 py-[18px] text-[16px] transition-colors text-left w-full",
              isActive ? "text-white" : "text-white/85 hover:bg-white/5"
            )}
          >
            <item.icon className={cn("w-6 h-6 shrink-0", isActive ? "text-[#26c6da]" : "text-[#5d8a9a]")} />
            <span className="flex-1">{item.label}</span>
            <ChevronLeft className="w-4 h-4 text-[#4a7080] shrink-0" />
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
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed left-0 top-0 h-full w-[280px] z-50 bg-[#1e2d3a] flex flex-col overflow-y-auto lg:hidden"
            >
              {/* Close button - minimal, top right */}
              <div className="flex justify-end px-3 pt-3 pb-1">
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
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
