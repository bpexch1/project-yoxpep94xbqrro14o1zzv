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
    <div className="flex flex-col border-b border-[#23282c]/80">
      <button
        onClick={toggleOpen}
        className={cn(
          "flex items-center w-full text-left transition-all duration-200 group select-none",
          isCollapsed && !isMobile ? "justify-center py-3 px-0 h-[46px]" : "gap-3.5 py-2.5 px-4 h-[46px]",
          "text-white hover:bg-[#3a4248] focus:outline-none"
        )}
        title={isCollapsed && !isMobile ? label : undefined}
      >
        <div className="shrink-0 flex items-center justify-center w-5 h-5 text-[#8a98a5] group-hover:text-white transition-colors">
          <Icon className="w-[18px] h-[18px]" />
        </div>
        {showLabels && (
          <>
            <span className="flex-1 text-[14px] font-normal leading-normal whitespace-nowrap text-white group-hover:text-white">
              {label}
            </span>
            <svg
              viewBox="0 0 24 24"
              className={cn(
                "w-3.5 h-3.5 text-[#8a98a5] group-hover:text-white transition-transform duration-200 shrink-0",
                isOpen ? "-rotate-90 text-[#20a8d8]" : ""
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden bg-[#24292d] border-t border-[#1e2226]"
          >
            {isLoading ? (
              <div className="py-3 px-6 flex items-center gap-2 text-[#8a98a5] text-[13px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#20a8d8]" />
                <span>Loading matches...</span>
              </div>
            ) : filteredEvents && filteredEvents.length > 0 ? (
              <div className="flex flex-col py-1">
                {filteredEvents.map((event: any) => (
                  <button
                    key={event.id || event.marketId}
                    onClick={() => handleMatchClick(event.marketId)}
                    className="pl-9 pr-4 py-2 text-[13px] text-left text-[#c2cfd6] hover:text-white hover:bg-white/[0.08] transition-colors border-b border-white/[0.02] last:border-0 flex items-center justify-between group"
                  >
                    <span className="truncate flex-1 font-normal">
                      {event.eventName}
                    </span>
                    {event.status === "live" && (
                      <span className="w-2 h-2 rounded-full bg-[#20a8d8] ml-2 shrink-0 animate-pulse shadow-[0_0_6px_#20a8d8]" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-2.5 px-6 text-[#8a98a5] text-[12.5px] italic">
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
          "flex items-center w-full text-left transition-all duration-200 group border-b border-[#23282c]/80 select-none",
          isCollapsed && !isMobile ? "justify-center py-3 px-0 h-[46px]" : "gap-3.5 py-2.5 px-4 h-[46px]",
          isActive
            ? "bg-[#20a8d8] text-white border-l-4 border-[#187da1]"
            : "bg-[#2f353a] text-white hover:bg-[#3a4248]"
        )}
        title={isCollapsed && !isMobile ? item.label : undefined}
      >
        <div
          className={cn(
            "shrink-0 flex items-center justify-center w-5 h-5 transition-colors",
            isActive
              ? "text-white"
              : "text-[#8a98a5] group-hover:text-white"
          )}
        >
          <item.icon className="w-[18px] h-[18px]" />
        </div>
        {showLabels && (
          <span
            className={cn(
              "flex-1 text-[14px] leading-normal whitespace-nowrap text-white",
              isActive ? "font-semibold text-white" : "font-normal"
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
      className="sidebar flex flex-col bg-[#2f353a] min-h-full select-none"
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
  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.classList.add("sidebar-show");
      document.body.classList.add("sidebar-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("sidebar-show");
      document.body.classList.remove("sidebar-open");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("sidebar-show");
      document.body.classList.remove("sidebar-open");
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Dark backdrop overlay for mobile screens (<768px) */}
      <div
        onClick={onMobileClose}
        className={cn(
          "sidebar-backdrop md:hidden cursor-pointer",
          isMobileOpen ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"
        )}
        aria-hidden="true"
      />

      {/* Sidebar (.app-sidebar / aside) for desktop & mobile overlay */}
      <aside
        className={cn(
          "app-sidebar sidebar flex flex-col overflow-y-auto border-r border-[#23282c] select-none",
          isMobileOpen ? "sidebar-show" : "",
          isCollapsed ? "md:w-[60px]" : "md:w-[230px]"
        )}
      >
        <SidebarNavItems
          onNavigate={() => {
            if (window.innerWidth < 768) {
              onMobileClose();
            }
          }}
          isCollapsed={isCollapsed}
          isMobile={false}
        />
      </aside>
    </>
  );
}
