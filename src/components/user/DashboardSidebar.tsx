import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
  SoccerIcon,
  TennisIcon,
  CricketIcon,
  HorseRaceIcon,
  GreyhoundIcon,
  SportsBookIcon,
  TeenPattiCardsIcon,
  GalaxyCasinoIcon,
} from "@/components/icons/CustomIcons";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterChange?: (filter: string) => void;
}

const SOCCER_MATCHES = [
  { id: "fb-1", title: "Angers v ESTAC Troyes" },
  { id: "fb-2", title: "Celta Vigo v Racing Santander" },
  { id: "fb-3", title: "New England Revolution v Orlando City" },
  { id: "fb-4", title: "Nottm Forest v Coventry" },
  { id: "fb-5", title: "Sevilla v Barcelona" },
  { id: "fb-6", title: "Sporting Lisbon v Arouca" },
  { id: "fb-7", title: "Trabzonspor v Galatasaray" },
  { id: "fb-8", title: "Venezia v Lazio" },
];

const TENNIS_MATCHES = [
  { id: "tn-1", title: "Pe Stearns v I Jovic" },
  { id: "tn-2", title: "Bucsa v Bejlek" },
  { id: "tn-3", title: "Frech v I Jovic" },
];

const CRICKET_MATCHES = [
  { id: "cr-1", title: "Antigua & Barbuda Falcs v Jamaica Kings" },
  { id: "cr-2", title: "South Africa v Australia" },
  { id: "cr-3", title: "Zimbabwe v Australia" },
  { id: "cr-4", title: "Afghanistan v India" },
  { id: "cr-5", title: "England v Sri Lanka" },
];

const HORSE_RACES = [
  { time: "10:04 PM", venue: "Laurel Park (US)" },
  { time: "10:06 PM", venue: "Delaware Park (US)" },
  { time: "10:15 PM", venue: "Belmont Park (US)" },
  { time: "11:25 PM", venue: "Belmont Park (US)" },
  { time: "11:30 PM", venue: "Newcastle (GB)" },
  { time: "11:34 PM", venue: "Gulfstream Park (US)" },
];

const GREYHOUND_RACES = [
  { time: "10:20 PM", venue: "Dunstall Park (GB)" },
  { time: "10:21 PM", venue: "Star Pelaw (GB)" },
  { time: "10:26 PM", venue: "Hove (GB)" },
  { time: "11:22 PM", venue: "Romford (GB)" },
  { time: "11:30 PM", venue: "Central Park (GB)" },
];

export function DashboardSidebar({ isOpen, onClose, onFilterChange }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
            className="fixed inset-0 bg-black/20 z-[100] backdrop-blur-[0.5px]"
          />

          {/* Main Sidebar Drawer - exact match to screenshot */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            className="fixed top-0 left-0 bottom-0 w-[170px] bg-[#1a3556] z-[101] flex flex-col shadow-2xl border-r border-white/10 select-none text-white text-[12.5px]"
            style={{
              fontFamily:
                '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            }}
          >
            {/* Top Header: Square [X] button + Dashboard text */}
            <div className="flex items-center gap-2.5 px-2.5 py-2 bg-[#142a45] border-b border-white/10 h-[44px] flex-shrink-0">
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-none border border-white/70 bg-transparent hover:bg-white/10 text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                onClick={() => {
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
            <div className="flex-1 overflow-y-auto no-scrollbar py-1 space-y-[1px]">
              {/* 1. Soccer */}
              <button
                onClick={() => {
                  toggleSection("Soccer");
                  handleFilter("Soccer");
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
                  handleFilter("Tennis");
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
                  handleFilter("Cricket");
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
                  handleFilter("Horse Race");
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
                  handleFilter("Greyhound");
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
                  <Star className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-[12.5px] truncate">Star Casino</span>
              </button>

              {/* 9. World Casino */}
              <button
                onClick={() => handleFilter("Casino")}
                className="flex items-center gap-2.5 w-full px-3 h-[36px] hover:bg-white/10 transition-colors font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-white" />
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
                  <BLogoIcon className="w-4 h-4 text-white" color="#ffffff" />
                </div>
                <span className="text-white text-[12.5px] truncate">BetFairGames</span>
              </button>

              {/* 12. TeenPatti Studio (Animated Red Light-to-Dark Slow Breathing) */}
              <button
                onClick={() => handleFilter("Casino")}
                className="flex items-center gap-2.5 w-full px-3 h-[38px] animate-teen-patti text-white font-medium"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <TeenPattiCardsIcon className="w-4 h-4 text-white" color="#ffffff" />
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
                  <GalaxyCasinoIcon className="w-4 h-4 text-white" color="#ffffff" />
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
                  <Trash2 className="w-4 h-4 text-white" />
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
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 170, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed top-0 left-0 bottom-0 w-[200px] max-w-[55vw] bg-[#223d60] z-[100] flex flex-col shadow-2xl border-r border-white/10 select-none text-white"
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
                  {/* Soccer */}
                  {expandedSection === "Soccer" &&
                    SOCCER_MATCHES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleMatchClick(m, "Soccer")}
                        className="w-full text-left px-3 py-2 text-[12px] text-white/90 hover:bg-white/10 hover:text-white border-b border-white/5 transition-colors font-semibold leading-tight line-clamp-1"
                      >
                        {m.title}
                      </button>
                    ))}

                  {/* Tennis */}
                  {expandedSection === "Tennis" &&
                    TENNIS_MATCHES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleMatchClick(m, "Tennis")}
                        className="w-full text-left px-3 py-2 text-[12px] text-white/90 hover:bg-white/10 hover:text-white border-b border-white/5 transition-colors font-semibold leading-tight"
                      >
                        {m.title}
                      </button>
                    ))}

                  {/* Cricket */}
                  {expandedSection === "Cricket" &&
                    CRICKET_MATCHES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleMatchClick(m, "Cricket")}
                        className="w-full text-left px-3 py-2 text-[12px] text-white/90 hover:bg-white/10 hover:text-white border-b border-white/5 transition-colors font-semibold leading-tight"
                      >
                        {m.title}
                      </button>
                    ))}

                  {/* Horse Race */}
                  {expandedSection === "Horse Race" &&
                    HORSE_RACES.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleFilter("Horse Race");
                          setExpandedSection(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-[11.5px] text-white/90 hover:bg-white/10 hover:text-white border-b border-white/5 transition-colors leading-tight"
                      >
                        <span className="font-bold text-white mr-1.5">{slot.time}</span>
                        <span className="text-white/80">{slot.venue}</span>
                      </button>
                    ))}

                  {/* Greyhound */}
                  {expandedSection === "Greyhound" &&
                    GREYHOUND_RACES.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleFilter("Greyhound");
                          setExpandedSection(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-[11.5px] text-white/90 hover:bg-white/10 hover:text-white border-b border-white/5 transition-colors leading-tight"
                      >
                        <span className="font-bold text-white mr-1.5">{slot.time}</span>
                        <span className="text-white/80">{slot.venue}</span>
                      </button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
