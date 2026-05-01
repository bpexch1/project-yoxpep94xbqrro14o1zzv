import { 
  Gauge, Users, Filter, CreditCard, Lock, Star, Globe, 
  CircleDot, Crosshair, Swords, Zap, Rabbit, Trophy,
  X, ChevronLeft, ChevronRight, ChevronDown, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBetfairEvents } from "@/functions";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

const mainMenuItems = [
  { label: "Dashboard", icon: Gauge, link: "/dashboard" },
  { label: "Users", icon: Users, link: "/accounts" },
  { label: "Current Position", icon: Filter, link: "/current-position" },
  { label: "Reports", icon: CreditCard, link: "/reports/daily-pl" },
  { label: "Bet Lock", icon: Lock, link: "/bet-lock" },
  { label: "Settle Match", icon: Trophy, link: "/settle-match" },
  { label: "Star Casino", icon: Star, link: "/star-casino" },
  { label: "World Casino", icon: Globe, link: "/world-casino" },
  { label: "BetFair Games", icon: Globe, link: "/betfair-games" },
];

const sportsItems = [
  { label: "Soccer", icon: CircleDot, sportName: "Soccer" },
  { label: "Tennis", icon: Crosshair, sportName: "Tennis" },
  { label: "Cricket", icon: Swords, sportName: "Cricket" },
  { label: "Horse Race", icon: Zap, sportName: "Horse Racing" },
  { label: "Greyhound", icon: Rabbit, sportName: "Greyhound Racing" },
];

function SportDropdown({ 
  sportName, 
  label, 
  icon: Icon, 
  isCollapsed, 
  onNavigate,
  isMobile = false
}: { 
  sportName: string; 
  label: string; 
  icon: any; 
  isCollapsed: boolean; 
  onNavigate: () => void;
  isMobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { data: allEvents, isLoading } = useQuery({
    queryKey: ["betfair-events-all"],
    queryFn: () => fetchBetfairEvents({}),
    enabled: isOpen && (!isCollapsed || isMobile),
    staleTime: 60000,
  });

  const toggleOpen = (e: React.MouseEvent) => {
    if (isCollapsed && !isMobile) {
      navigate(`/sports/${sportName.toLowerCase().replace(" ", "-")}`);
      onNavigate();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleMatchClick = (marketId: string) => {
    navigate(`/play/match/${marketId}`);
    onNavigate();
  };

  const filteredEvents = allEvents 
    ? Array.from(new Map(
        (allEvents as any[])
          .filter((e: any) => e.sport === sportName)
          .map((e: any) => [e.eventName, e])
      ).values())
    : [];

  const showLabels = !isCollapsed || isMobile;

  return (
    <div className="flex flex-col border-b border-white/[0.04]">
      <button
        onClick={toggleOpen}
        className={cn(
          "flex items-center w-full text-left transition-colors group",
          isCollapsed && !isMobile ? "justify-center py-4 px-0" : "gap-5 py-3 px-4",
          "text-[#b8c7ce] hover:bg-[#353c47] hover:text-white"
        )}
        title={isCollapsed && !isMobile ? label : undefined}
      >
        <Icon className={cn(
          "shrink-0 transition-colors",
          isCollapsed && !isMobile ? "w-5 h-5" : "w-[18px] h-[18px]",
          "text-[#3bc8c8] group-hover:text-white"
        )} />
        {showLabels && (
          <>
            <span className="flex-1 text-[14px] leading-6 whitespace-nowrap font-normal">{label}</span>
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-[#3bc8c8]/60 transition-transform duration-200",
                isOpen && "rotate-180"
              )} 
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && showLabels && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-visible bg-[#242a33]"
          >
            {isLoading ? (
              <div className="py-2 px-10 flex items-center gap-2 text-[#b8c7ce]/60 text-[12px]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : filteredEvents && filteredEvents.length > 0 ? (
              <div className="flex flex-col">
                {filteredEvents.map((event: any) => (
                  <button
                    key={event.id}
                    onClick={() => handleMatchClick(event.marketId)}
                    className="pl-12 pr-4 py-2 text-[12px] text-left text-[#b8c7ce] hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.02] group flex items-center justify-between"
                  >
                    <span className="truncate flex-1">
                      {event.eventName}
                    </span>
                    {event.status === "live" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00b181] ml-2 shrink-0 animate-pulse shadow-[0_0_8px_rgba(0,166,90,0.6)]" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-2 px-10 text-[#b8c7ce]/60 text-[12px]">
                No matches available
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarNavItems({ onNavigate, isCollapsed = false, isMobile = false }: { onNavigate: () => void, isCollapsed?: boolean, isMobile?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (link: string) => {
    navigate(link);
    onNavigate();
  };

  const renderItem = (item: typeof mainMenuItems[0], showChevron = false) => {
    const isActive = location.pathname === item.link || (item.link !== "/dashboard" && location.pathname.startsWith(item.link));
    const showLabels = !isCollapsed || isMobile;

    return (
      <button
        key={item.label}
        onClick={() => handleNavigate(item.link)}
        className={cn(
          "flex items-center w-full text-left transition-colors group border-b border-white/[0.04]",
          isCollapsed && !isMobile ? "justify-center py-4 px-0" : "gap-5 py-3 px-4",
          isActive
            ? "bg-[#242a33] text-white font-medium border-l-[3px] border-[#00b181]"
            : "text-[#b8c7ce] hover:bg-[#353c47] hover:text-white"
        )}
        title={isCollapsed && !isMobile ? item.label : undefined}
      >
        <item.icon className={cn(
          "shrink-0 transition-colors",
          isCollapsed && !isMobile ? "w-5 h-5" : "w-[18px] h-[18px]",
          isActive ? "text-[#00b181]" : "text-[#3bc8c8] group-hover:text-white"
        )} />
        {showLabels && (
          <>
            <span className={cn(
              "flex-1 text-[14px] leading-6 whitespace-nowrap",
              isActive ? "font-medium" : "font-normal"
            )}>{item.label}</span>
            {showChevron && <ChevronLeft className="w-4 h-4 text-white/40 shrink-0" />}
          </>
        )}
      </button>
    );
  };

  return (
    <nav className="flex flex-col">
      {/* Main menu items */}
      <div className="flex flex-col">
        {mainMenuItems.map((item) => renderItem(item))}
      </div>

      {/* Separator */}
      <div className="h-px bg-white/[0.04] my-1" />

      {/* Sports items */}
      <div className="flex flex-col">
        {sportsItems.map((item) => (
          <SportDropdown 
            key={item.sportName}
            sportName={item.sportName} 
            label={item.label} 
            icon={item.icon} 
            isCollapsed={isCollapsed} 
            onNavigate={onNavigate}
            isMobile={isMobile}
          />
        ))}
      </div>
    </nav>
  );
}

export function Sidebar({ isMobileOpen, onMobileClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 h-full z-30 bg-[#2d323e] flex-col overflow-y-auto border-r border-white/[0.06] transition-all duration-200",
        isCollapsed ? "w-[60px]" : "w-[200px]"
      )}>
        <SidebarNavItems onNavigate={() => {}} isCollapsed={isCollapsed} />
      </aside>

      {/* MOBILE SIDEBAR */}
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
              className="fixed left-0 top-0 h-full w-[280px] z-50 bg-[#2d323e] flex flex-col overflow-y-auto lg:hidden"
            >
              {/* Header for mobile sidebar */}
              <div className="flex items-center justify-end px-4 h-14 border-b border-white/10 shrink-0">
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
              <SidebarNavItems onNavigate={onMobileClose} isCollapsed={false} isMobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
