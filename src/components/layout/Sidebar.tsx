import { 
  LayoutDashboard, Users, CircleDollarSign, FileBarChart2, Lock, Star, Globe, Activity, CircleDot, Trophy, Zap, Rabbit, X, ChevronRight 
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

  const renderItem = (item: typeof mainMenuItems[0], showChevron = false) => {
    const isActive = location.pathname === item.link || (item.link !== "/" && location.pathname.startsWith(item.link));
    
    return (
      <button
        key={item.label}
        onClick={() => handleNavigate(item.link)}
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors text-left w-full group",
          isActive ? "text-[#26c6da]" : "text-white/80 hover:text-white hover:bg-white/[0.05]"
        )}
      >
        <div className={cn(
          "w-8 h-8 flex items-center justify-center rounded-md shrink-0 transition-colors",
          isActive ? "bg-[#26c6da]/20" : "bg-white/[0.07] group-hover:bg-white/[0.12]"
        )}>
          <item.icon className={cn("w-4 h-4", isActive ? "text-[#26c6da]" : "text-white/80 group-hover:text-white")} />
        </div>
        <span className="flex-1 text-[15px] font-medium">{item.label}</span>
        {showChevron && (
          <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-colors", isActive ? "text-[#26c6da]" : "text-white/30 group-hover:text-white/50")} />
        )}
      </button>
    );
  };

  return (
    <nav className="flex flex-col py-2">
      {/* Main menu items */}
      <div className="flex flex-col">
        {mainMenuItems.map((item) => renderItem(item))}
      </div>

      {/* Separator */}
      <div className="h-px bg-white/[0.08] mx-4 my-1" />

      {/* Sports items */}
      <div className="flex flex-col">
        {sportsItems.map((item) => renderItem(item, true))}
      </div>
    </nav>
  );
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* DESKTOP SIDEBAR: fixed left, always visible on lg+ */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[240px] z-30 bg-[#1a2535] flex-col overflow-y-auto border-r border-white/5">
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
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed left-0 top-0 h-full w-[280px] z-50 bg-[#1a2535] flex flex-col overflow-y-auto lg:hidden"
            >
              {/* Close button - minimal, top right */}
              <div className="flex justify-end px-3 pt-3 pb-1">
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
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
