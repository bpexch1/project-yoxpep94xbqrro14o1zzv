import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Match } from "@/entities";
import {
  X,
  Globe,
  Gem,
  Trash2,
  FileText,
  Star,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import {
  BLogoIcon,
  SportsBookIcon,
  TeenPattiCardsIcon,
  GalaxyCasinoIcon,
} from "@/components/icons/CustomIcons";

import { SoccerIcon, TennisIcon, CricketIcon, HorseRaceIcon, GreyhoundIcon } from "@/components/icons/ReferenceSportsIcons";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterChange?: (filter: string) => void;
}

export function DashboardSidebar({ isOpen, onClose, onFilterChange }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const sportsSections = ["Soccer", "Tennis", "Cricket"];
  const { data: matches = [], isLoading: matchesLoading, isError: matchesError } = useQuery({
    queryKey: ["sidebar-sports-events"],
    queryFn: () => Match.list("-match_time", 500),
    enabled: isOpen && sportsSections.includes(expandedSection || ""),
    staleTime: 15_000,
    refetchInterval: isOpen && sportsSections.includes(expandedSection || "") ? 15_000 : false,
  });
  const visibleFixtures = (Array.isArray(matches) ? matches : []).filter((event: any) => {
    const wanted = String(expandedSection || "").toLowerCase();
    const sport = String(event.sport || "").toLowerCase();
    const normalized = sport === "football" ? "soccer" : sport;
    return normalized === wanted && !["completed", "closed", "cancelled"].includes(String(event.status || "").toLowerCase())
      && event.id && (event.title || (event.team1 && event.team2));
  }).slice(0, 35);


  useEffect(() => {
    if (!isOpen) setExpandedSection(null);
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleFilter = (filter: string) => {
    if (onFilterChange) {
      onFilterChange(filter);
      onClose();
    } else {
      navigate("/play", { state: { activeFilter: filter } });
      onClose();
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const handleMatchClick = (match: any, sport: string) => {
    navigate(`/play/match/${match.id || "live-match"}`, {
      state: { match: { ...match, sport } },
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Semi-transparent backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="reference-user-menu-overlay fixed inset-0 bg-black/20 z-[100] backdrop-blur-[0.5px]"
          />

          {/* Main Sidebar Drawer - exact match to screenshot */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="reference-user-sidebar fixed top-0 left-0 bottom-0 w-[170px] bg-[#1a3556] z-[101] flex flex-col shadow-2xl border-r border-white/10 select-none text-white text-[12.5px]"
            style={{
              fontFamily:
                '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            }}
          >
            {/* Top Header: Square [X] button + Dashboard text */}
            <div className="reference-user-sidebar-header flex items-center gap-2.5 px-2.5 py-2 bg-[#142a45] border-b border-white/10 h-[44px] flex-shrink-0">
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-none border border-white/70 bg-transparent hover:bg-white/10 text-white transition-colors"
                title="Close"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (window.location.pathname === "/play" || window.location.pathname === "/play/") {
                    window.dispatchEvent(new CustomEvent("refresh-dashboard"));
                  } else {
                    onClose();
                    navigate("/play", { state: { refresh: true } });
                  }
                }}
                className="text-white font-medium text-[13px] tracking-wide hover:opacity-85 active:scale-95 text-left transition-all"
                title="Go to Dashboard / Refresh"
              >
                Dashboard
              </button>
            </div>

            {/* Menu List */}
            <div className="reference-user-sidebar-menu flex-1 overflow-y-auto no-scrollbar py-1 space-y-[1px]">
              {/* 1. Soccer */}
              <button
                onClick={() => {
                  toggleSection("Soccer");
                }}
                className={`flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium ${
                  expandedSection === "Soccer" ? "bg-white/15" : ""
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <SoccerIcon className="w-4 h-4 text-white" color="#ffffff" />
                </div>
                <span className="text-white text-[12.5px] truncate">Soccer</span>
              </button>

              {/* 2. Tennis */}
              <button
                onClick={() => {
                  toggleSection("Tennis");
                }}
                className={`flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium ${
                  expandedSection === "Tennis" ? "bg-white/15" : ""
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <TennisIcon className="w-4 h-4 text-white" color="#ffffff" />
                </div>
                <span className="text-white text-[12.5px] truncate">Tennis</span>
              </button>

              {/* 3. Cricket */}
              <button
                onClick={() => {
                  toggleSection("Cricket");
                }}
                className={`flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium ${
                  expandedSection === "Cricket" ? "bg-white/15" : ""
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <CricketIcon className="w-4 h-4 text-white" color="#ffffff" />
                </div>
                <span className="text-white text-[12.5px] truncate">Cricket</span>
              </button>

              {/* 4. Horse Race */}
              <button
                onClick={() => {
                  toggleSection("Horse Race");
                }}
                className={`flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium ${
                  expandedSection === "Horse Race" ? "bg-white/15" : ""
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <HorseRaceIcon className="w-4 h-4 text-white" color="#ffffff" />
                </div>
                <span className="text-white text-[12.5px] truncate">Horse Race</span>
              </button>

              {/* 5. Greyhound */}
              <button
                onClick={() => {
                  toggleSection("Greyhound");
                }}
                className={`flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium ${
                  expandedSection === "Greyhound" ? "bg-white/15" : ""
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <GreyhoundIcon className="w-4 h-4 text-white" color="#ffffff" />
                </div>
                <span className="text-white text-[12.5px] truncate">Greyhound</span>
              </button>

              {/* 6. Sports Book */}
              <button
                onClick={() => handleFilter("Inplay")}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <SportsBookIcon className="w-4 h-4 text-white" color="#ffffff" />
                </div>
                <span className="text-white text-[12.5px] truncate">Sports Book</span>
              </button>

              {/* 7. RoyalStar Casino */}
              <button
                onClick={() => handleFilter("Casino")}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="text-white text-[12.5px] truncate">RoyalStar Casino</span>
              </button>

              {/* 8. Star Casino */}
              <button
                onClick={() => handleFilter("Casino")}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <img src="/reference/star.png" alt="" />
                </div>
                <span className="text-white text-[12.5px] truncate">Star Casino</span>
              </button>

              {/* 9. World Casino */}
              <button
                onClick={() => handleFilter("Casino")}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <img src="/reference/world.png" className="reference-dark-icon" alt="" />
                </div>
                <span className="text-white text-[12.5px] truncate">World Casino</span>
              </button>

              {/* 10. Royal Casino */}
              <button
                onClick={() => handleFilter("Casino")}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <Gem className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-[12.5px] truncate">Royal Casino</span>
              </button>

              {/* 11. BetFairGames */}
              <button
                onClick={() => handleFilter("Casino")}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <img src="/reference/betfair.png" className="reference-dark-icon" alt="" />
                </div>
                <span className="text-white text-[12.5px] truncate">BetFairGames</span>
              </button>

              {/* 12. TeenPatti Studio (Animated Red Light-to-Dark Slow Breathing) */}
              <button
                onClick={() => handleFilter("Casino")}
                className="flex items-center gap-2.5 w-full px-3 h-[38px] animate-teen-patti text-white font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <img src="/reference/teenpatti.png" className="reference-dark-icon" alt="" />
                </div>
                <span className="text-white text-[12.5px] truncate font-medium">
                  TeenPatti Studio
                </span>
              </button>

              {/* 13. Galaxy Casino (Animated Purple Light-to-Dark Slow Breathing) */}
              <button
                onClick={() => handleFilter("Casino")}
                className="flex items-center gap-2.5 w-full px-3 h-[38px] animate-galaxy-casino text-white font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <img src="/reference/galaxy.png" alt="" />
                </div>
                <span className="text-white text-[12.5px] truncate font-medium">
                  Galaxy Casino
                </span>
              </button>

              {/* 14. Current Position */}
              <button
                onClick={() => handleNav("/play/current-position")}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <span className="reference-position-icon" aria-hidden="true">C</span>
                </div>
                <span className="text-white text-[12.5px] truncate">Current Position</span>
              </button>

              {/* 15. All Sports */}
              <button
                onClick={() => handleFilter("Inplay")}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <SoccerIcon className="w-4 h-4 text-white" color="#ffffff" />
                </div>
                <span className="text-white text-[12.5px] truncate">All Sports</span>
              </button>

              {/* 16. Results */}
              <button
                onClick={() => handleNav("/play/result")}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-[12.5px] truncate">Results</span>
              </button>

              {/* 17. Market Rules */}
              <button
                onClick={() => {
                  alert("Market Rules: General betting and settlement terms apply.");
                  onClose();
                }}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-[12.5px] truncate">Market Rules</span>
              </button>

              {/* 18. Terms & Conditions */}
              <button
                onClick={() => {
                  alert("Terms & Conditions: Please wager responsibly.");
                  onClose();
                }}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-[12.5px] truncate">Terms &amp; Conditions</span>
              </button>
            </div>
          </motion.div>

          {/* Submenu Drawer for fixtures */}
          <AnimatePresence>
            {expandedSection && (
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -10, opacity: 0 }}
                transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="reference-user-submenu fixed top-0 bottom-0 w-[200px] max-w-[55vw] bg-[#223d60] z-[100] flex flex-col shadow-2xl border-r border-white/10 select-none text-white"
                style={{
                  fontFamily:
                    '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                }}
              >
                {/* Flyout Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#193250] border-b border-white/10 h-[44px] flex-shrink-0">
                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                    {expandedSection}
                  </span>
                  <button
                    onClick={() => setExpandedSection(null)}
                    className="text-white/70 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-items List */}
                <div className="flex-1 overflow-y-auto no-scrollbar py-1">
                  {sportsSections.includes(expandedSection || "") ? (
                    matchesLoading ? (
                      <div className="p-3 text-xs text-white/70" role="status">Loading events…</div>
                    ) : matchesError ? (
                      <div className="p-3 text-xs text-white/70" role="alert">Live event list is unavailable.</div>
                    ) : visibleFixtures.length === 0 ? (
                      <div className="p-3 text-xs text-white/70">No verified fixtures are available right now.</div>
                    ) : visibleFixtures.map((event: any) => (
                      <button
                        key={String(event.id)}
                        type="button"
                        onClick={() => handleMatchClick(event, expandedSection || "")}
                        className="reference-sidebar-event w-full text-left px-3 py-2 text-[12px] text-white/90 hover:bg-white/10 focus-visible:bg-white/15 border-b border-white/10 transition-colors leading-tight"
                      >
                        {event.title || `${event.team1} v ${event.team2}`}
                        <span className="block text-[10px] text-white/50 mt-0.5">
                          {String(event.status || "upcoming").toUpperCase()}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3">
                      <div className="text-xs text-white/70 mb-3">Verified race schedule is not connected.</div>
                      <button type="button" className="w-full px-3 py-2 text-xs text-left bg-white/10 hover:bg-white/20"
                        onClick={() => { handleFilter(expandedSection || "Horse Race"); setExpandedSection(null); }}>
                        View {expandedSection} section
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
