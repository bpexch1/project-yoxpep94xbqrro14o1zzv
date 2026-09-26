import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { fetchBetfairEvents } from "@/functions";
import { cn } from "@/lib/utils";
import {
  DashboardIcon,
  UsersIcon,
  CurrentPositionIcon,
  ReportsIcon,
  BetLockIcon,
  StarCasinoIcon,
  GlobeIcon,
  SoccerIcon,
  TennisIcon,
  CricketIcon,
  HorseRaceIcon,
  GreyhoundIcon,
} from "@/components/icons/CustomIcons";

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

const mainMenuItems = [
  { label: "Dashboard", icon: DashboardIcon, link: "/dashboard" },
  { label: "Users", icon: UsersIcon, link: "/accounts" },
  { label: "Current Position", icon: CurrentPositionIcon, link: "/current-position" },
  { label: "Reports", icon: ReportsIcon, link: "/reports/daily-pl" },
  { label: "Bet Lock", icon: BetLockIcon, link: "/bet-lock" },
  { label: "Star Casino", icon: StarCasinoIcon, link: "/star-casino" },
  { label: "World Casino", icon: GlobeIcon, link: "/world-casino" },
  { label: "BetFair Games", icon: GlobeIcon, link: "/betfair-games" },
];

const sportsItems = [
  { label: "Soccer", icon: SoccerIcon, sportName: "Soccer" },
  { label: "Tennis", icon: TennisIcon, sportName: "Tennis" },
  { label: "Cricket", icon: CricketIcon, sportName: "Cricket" },
  { label: "Horse Race", icon: HorseRaceIcon, sportName: "Horse Racing" },
  { label: "Greyhound", icon: GreyhoundIcon, sportName: "Greyhound Racing" },
];

function SportDropdown({
  sportName,
  label,
  icon: Icon,
  isCollapsed,
  onNavigate,
  isMobile = false,
}: {
  sportName: string;
  label: string;
  icon: React.ComponentType<{ className?: string; color?: string }>;
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

  const filteredEvents = Array.isArray(allEvents)
    ? Array.from(
        new Map(
          (allEvents as any[])
            .filter((e: any) => e && e.sport === sportName)
            .map((e: any) => [e.eventName, e])
        ).values()
      )
    : [];

  const showLabels = !isCollapsed || isMobile;

  return (
    <div className="flex flex-col border-b border-[#36424e]">
      <button
        onClick={toggleOpen}
        className={cn(
          "flex items-center w-full text-left transition-colors duration-150 group",
          isCollapsed && !isMobile ? "justify-center py-3 px-0 h-[46px]" : "gap-3.5 py-2.5 px-4 h-[46px]",
          "text-white hover:bg-[#343f4c] focus:outline-none select-none"
        )}
        title={isCollapsed && !isMobile ? label : undefined}
      >
        <div className="shrink-0 flex items-center justify-center w-5 h-5 text-[#94a3b8] group-hover:text-white transition-colors">
          <Icon className="w-[18px] h-[18px]" />
        </div>
        {showLabels && (
          <>
            <span className="flex-1 text-[15px] font-normal leading-normal whitespace-nowrap text-white group-hover:text-white">
              {label}
            </span>
            <svg
              viewBox="0 0 24 24"
              className={cn(
                "w-3.5 h-3.5 text-[#718096] group-hover:text-[#a0aec0] transition-transform duration-200 shrink-0",
                isOpen ? "-rotate-90 text-[#38bdf8]" : ""
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && showLabels && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden bg-[#222b35] border-t border-[#1c242d]"
          >
            {isLoading ? (
              <div className="py-3 px-6 flex items-center gap-2 text-[#94a3b8] text-[13px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#38bdf8]" />
                <span>Loading matches...</span>
              </div>
            ) : filteredEvents && filteredEvents.length > 0 ? (
              <div className="flex flex-col py-1">
                {filteredEvents.map((event: any) => (
                  <button
                    key={event.id || event.marketId}
                    onClick={() => handleMatchClick(event.marketId)}
                    className="pl-9 pr-4 py-2 text-[13px] text-left text-[#cbd5e1] hover:text-white hover:bg-white/[0.08] transition-colors border-b border-white/[0.02] last:border-0 flex items-center justify-between group"
                  >
                    <span className="truncate flex-1 font-normal">
                      {event.eventName}
                    </span>
                    {event.status === "live" && (
                      <span className="w-2 h-2 rounded-full bg-[#00c0ef] ml-2 shrink-0 animate-pulse shadow-[0_0_6px_#00c0ef]" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-2.5 px-6 text-[#94a3b8] text-[12.5px] italic">
                No active events
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarNavItems({
  onNavigate,
  isCollapsed = false,
  isMobile = false,
}: {
  onNavigate: () => void;
  isCollapsed?: boolean;
  isMobile?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (link: string) => {
    navigate(link);
    onNavigate();
  };

  const renderItem = (item: (typeof mainMenuItems)[0]) => {
    const isUsersTab =
      item.label === "Users" &&
      (location.pathname.startsWith("/accounts") ||
        location.pathname.startsWith("/Users") ||
        location.pathname.startsWith("/users"));
    const isDashboardTab =
      item.label === "Dashboard" &&
      (location.pathname === "/dashboard" || location.pathname === "/");
    const isOtherTab =
      item.link !== "/dashboard" &&
      !location.pathname.startsWith("/accounts") &&
      location.pathname.startsWith(item.link);

    const isActive = isUsersTab || isDashboardTab || isOtherTab;
    const showLabels = !isCollapsed || isMobile;

    return (
      <button
        key={item.label}
        onClick={() => handleNavigate(item.link)}
        className={cn(
          "flex items-center w-full text-left transition-colors duration-150 group border-b border-[#36424e] select-none",
          isCollapsed && !isMobile ? "justify-center py-3 px-0 h-[46px]" : "gap-3.5 py-2.5 px-4 h-[46px]",
          isActive
            ? "bg-[#384350] text-white"
            : "bg-[#2b343d] text-white hover:bg-[#343f4c]"
        )}
        title={isCollapsed && !isMobile ? item.label : undefined}
      >
        <div
          className={cn(
            "shrink-0 flex items-center justify-center w-5 h-5 transition-colors",
            isActive
              ? "text-[#00c0ef]"
              : "text-[#94a3b8] group-hover:text-white"
          )}
        >
          <item.icon className="w-[18px] h-[18px]" />
        </div>
        {showLabels && (
          <span
            className={cn(
              "flex-1 text-[15px] leading-normal whitespace-nowrap text-white",
              isActive ? "font-normal text-white" : "font-normal"
            )}
          >
            {item.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav
      className="flex flex-col bg-[#2b343d] min-h-full select-none"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Main menu items */}
      <div className="flex flex-col">
        {mainMenuItems.map((item) => renderItem(item))}
      </div>

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

export function Sidebar({
  isMobileOpen,
  onMobileClose,
  isCollapsed = false,
}: SidebarProps) {
  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 h-full z-30 bg-[#2b343d] flex-col overflow-y-auto border-r border-[#222a33] transition-all duration-200",
          isCollapsed ? "w-[60px]" : "w-[230px]"
        )}
      >
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
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-[1px]"
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.22, ease: "easeInOut" }}
              className="fixed left-0 top-0 h-full w-[260px] max-w-[82vw] z-50 bg-[#2b343d] flex flex-col overflow-y-auto shadow-2xl lg:hidden"
            >
              <SidebarNavItems
                onNavigate={onMobileClose}
                isCollapsed={false}
                isMobile={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
