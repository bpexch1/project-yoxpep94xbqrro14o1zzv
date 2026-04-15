import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, TrendingUp, FileBarChart2, Lock, Star, Globe, Gamepad2, 
  CircleDot, Crosshair, Trophy, Zap, Rabbit, X, ChevronRight, ChevronLeft 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

const mainMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard, link: "/dashboard" },
  { label: "Users", icon: Users, link: "/accounts" },
  { label: "Current Position", icon: TrendingUp, link: "/current-position" },
  { label: "Reports", icon: FileBarChart2, link: "/reports/daily-pl" },
  { label: "Bet Lock", icon: Lock, link: "/bet-lock" },
  { label: "Star Casino", icon: Star, link: "/star-casino" },
  { label: "World Casino", icon: Globe, link: "/world-casino" },
  { label: "BetFair Games", icon: Gamepad2, link: "/betfair-games" },
];

const sportsItems = [
  { label: "Soccer", icon: CircleDot, link: "/sports/soccer" },
  { label: "Tennis", icon: Crosshair, link: "/sports/tennis" },
  { label: "Cricket", icon: Trophy, link: "/sports/cricket" },
  { label: "Horse Race", icon: Zap, link: "/sports/horse-race" },
  { label: "Greyhound", icon: Rabbit, link: "/sports/greyhound" },
];

function SidebarNavItems({ 
  onNavigate, 
  isCollapsed, 
  onToggleCollapse,
  isMobile = false 
}: { 
  onNavigate: () => void; 
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (link: string) => {
    navigate(link);
    onNavigate();
  };

  const renderItem = (item: typeof mainMenuItems[0], showChevron = false) => {
    const isActive = location.pathname === item.link || (item.link !== "/dashboard" && location.pathname.startsWith(item.link));
    const showLabels = !isCollapsed || isMobile;
    
    const content = (
      <button
        key={item.label}
        onClick={() => handleNavigate(item.link)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 w-full text-left transition-all relative group overflow-hidden shrink-0",
          isActive
            ? "bg-[#00c9a7]/10 text-[#00c9a7] border-l-2 border-[#00c9a7]"
            : "text-white/70 hover:bg-white/[0.05] hover:text-white border-l-2 border-transparent"
        )}
      >
        <div className={cn(
          "w-8 h-8 flex items-center justify-center rounded-md shrink-0 transition-colors",
          isActive ? "bg-[#00c9a7]/20" : "bg-white/[0.06] group-hover:bg-white/[0.1]"
        )}>
          <item.icon className="w-4 h-4" />
        </div>
        
        {showLabels && (
          <>
            <span className="flex-1 text-[14px] font-medium whitespace-nowrap">{item.label}</span>
            {showChevron && (
              <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-colors text-white/30 group-hover:text-white/50" />
            )}
          </>
        )}
      </button>
    );

    if (!showLabels) {
      return (
        <Tooltip key={item.label} delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-[#1a1f2e] border-white/10 text-white text-xs">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1f2e]">
      {/* Header with Logo and Collapse Toggle */}
      <div className={cn(
        "flex items-center h-12 px-4 border-b border-white/[0.07] shrink-0 overflow-hidden",
        (isCollapsed && !isMobile) ? "justify-center" : "justify-between"
      )}>
        {(!isCollapsed || isMobile) && (
          <span className="font-black italic text-xl tracking-wide shrink-0" style={{fontFamily:'Georgia,serif'}}>
            <span className="text-[#00c9a7]">BP</span>
            <span className="text-[#00c9a7] font-bold text-sm not-italic ml-0.5 uppercase tracking-tighter">exch</span>
          </span>
        )}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "p-1.5 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      <nav className="flex flex-col py-2 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Main menu items */}
        <div className="flex flex-col">
          {mainMenuItems.map((item) => renderItem(item))}
        </div>

        {/* Separator */}
        <div className="h-px bg-white/[0.07] mx-3 my-2 shrink-0" />

        {/* Sports items */}
        <div className="flex flex-col">
          {sportsItems.map((item) => renderItem(item, true))}
        </div>
      </nav>
    </div>
  );
}

export function Sidebar({ isMobileOpen, onMobileClose, onCollapseChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  return (
    <TooltipProvider>
      {/* DESKTOP SIDEBAR: fixed left, always visible on lg+ */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 h-full z-30 transition-all duration-200 border-r border-white/5",
        isCollapsed ? "w-[60px]" : "w-[220px]"
      )}>
        <SidebarNavItems 
          onNavigate={() => {}} 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
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
              className="fixed left-0 top-0 h-full w-[280px] z-50 bg-[#1a1f2e] flex flex-col lg:hidden"
            >
              {/* Close button - minimal, top right */}
              <div className="absolute right-2 top-2 z-10">
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
              <SidebarNavItems 
                onNavigate={onMobileClose} 
                isCollapsed={false}
                isMobile={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
