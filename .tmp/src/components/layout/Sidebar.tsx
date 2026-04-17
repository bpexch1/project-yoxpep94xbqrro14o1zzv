import { 
  Gauge, Users, Filter, CreditCard, Lock, Star, Globe, 
  CircleDot, Crosshair, Swords, Zap, Rabbit,
  X, ChevronLeft, ChevronRight, ChevronDown, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Match } from "@/entities";
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
  { label: "Star Casino", icon: Star, link: "/star-casino" },
  { label: "World Casino", icon: Globe, link: "/world-casino" },
  { label: "BetFair Games", icon: Globe, link: "/betfair-games" },
];

const sportsItems = [
  { label: "Soccer", icon: CircleDot, link: "/sports/football", sportKey: "football" },
  { label: "Tennis", icon: Crosshair, link: "/sports/tennis", sportKey: "tennis" },
  { label: "Cricket", icon: Swords, link: "/sports/cricket", sportKey: "cricket" },
  { label: "Horse Race", icon: Zap, link: "/sports/horse-race", sportKey: "horse-race" },
  { label: "Greyhound", icon: Rabbit, link: "/sports/greyhound", sportKey: "greyhound" },
];

function SportDropdown({ 
  sportKey, 
  label, 
  icon: Icon, 
  isCollapsed, 
  onNavigate,
  isMobile = false
}: { 
  sportKey: string; 
  label: string; 
  icon: any; 
  isCollapsed: boolean; 
  onNavigate: () => void;
  isMobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: matches, isLoading } = useQuery({
    queryKey: ["sidebar-matches", sportKey],
    queryFn: () => Match.query().where("sport", sportKey).sort("-created_at").limit(15).exec(),
    enabled: isOpen && (!isCollapsed || isMobile),
    staleTime: 30000,
  });

  const toggleOpen = (e: React.MouseEvent) => {
    if (isCollapsed && !isMobile) {
      navigate(`/sports/${sportKey}`);
      onNavigate();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleMatchClick = (matchId: string) => {
    navigate(`/play/match/${matchId}`);
    onNavigate();
  };

  const showLabels = !isCollapsed || isMobile;

  return (
    <div className="flex flex-col border-b border-white/[0.08]">
      <button
        onClick={toggleOpen}
        className={cn(
          "flex items-center w-full text-left transition-colors group",
          isCollapsed && !isMobile ? "justify-center py-4 px-0" : "gap-5 py-4 px-5",
          "text-white/75 hover:bg-white/[0.04] hover:text-white"
        )}
        title={isCollapsed && !isMobile ? label : undefined}
      >
        <Icon className={cn(
          "shrink-0 transition-colors",
          isCollapsed && !isMobile ? "w-5 h-5" : "w-[22px] h-[22px]",
          "text-[#17a2b8]/80"
        )} />
        {showLabels && (
          <>
            <span className="flex-1 text-[16px] leading-6 whitespace-nowrap font-normal">{label}</span>
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-white/40 transition-transform duration-200",
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
            className="overflow-visible bg-black/20"
          >
            {isLoading ? (
              <div className="py-3 px-10 flex items-center gap-2 text-white/40 text-[13px]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : matches && matches.length > 0 ? (
              <div className="flex flex-col">
                {matches.map((match: any) => (
                  <button
                    key={match.id}
                    onClick={() => handleMatchClick(match.id)}
                    className="pl-12 pr-4 py-2.5 text-[13px] text-left text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] group flex items-center justify-between"
                  >
                    <span className="truncate flex-1">
                      {match.title || `${match.team1} v ${match.team2}`}
                    </span>
                    {match.status === "live" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#28a745] ml-2 shrink-0 animate-pulse shadow-[0_0_8px_rgba(40,167,69,0.6)]" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-3 px-10 text-white/40 text-[13px]">
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
    const isActive = location.pathname === item.link || (item.link !== "/" && location.pathname.startsWith(item.link));
    const showLabels = !isCollapsed || isMobile;

    return (
      <button
        key={item.label}
        onClick={() => handleNavigate(item.link)}
        className={cn(
          "flex items-center w-full text-left transition-colors group border-b border-white/[0.08]",
          isCollapsed && !isMobile ? "justify-center py-4 px-0" : "gap-5 py-4 px-5",
          isActive
            ? "bg-[#1e2d3d] text-white font-medium"
            : "text-white/75 hover:bg-white/[0.04] hover:text-white"
        )}
        title={isCollapsed && !isMobile ? item.label : undefined}
      >
        <item.icon className={cn(
          "shrink-0 transition-colors",
          isCollapsed && !isMobile ? "w-5 h-5" : "w-[22px] h-[22px]",
          isActive ? "text-[#17a2b8]" : "text-[#17a2b8]/80"
        )} />
        {showLabels && (
          <>
            <span className={cn(
              "flex-1 text-[16px] leading-6 whitespace-nowrap",
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
      <div className="h-px bg-white/[0.06] my-1" />

      {/* Sports items */}
      <div className="flex flex-col">
        {sportsItems.map((item) => (
          <SportDropdown 
            key={item.sportKey}
            sportKey={item.sportKey} 
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
        "hidden lg:flex fixed left-0 top-0 h-full z-30 bg-[#2c3e50] flex-col overflow-y-auto border-r border-white/[0.06] transition-all duration-200",
        isCollapsed ? "w-[60px]" : "w-[200px]"
      )}>
        {/* Minimal collapse toggle at very top */}
        <div className={cn(
          "flex items-center h-[40px] border-b border-white/[0.06] shrink-0",
          isCollapsed ? "justify-center" : "justify-end px-3"
        )}>
          <button 
            onClick={onToggleCollapse} 
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-white/40" /> : <ChevronLeft className="w-4 h-4 text-white/40" />}
          </button>
        </div>
        
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
              className="fixed left-0 top-0 h-full w-[280px] z-50 bg-[#2c3e50] flex flex-col overflow-y-auto lg:hidden"
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
