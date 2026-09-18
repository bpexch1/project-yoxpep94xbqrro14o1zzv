




























import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  BookOpen,
  Globe,
  Gem,
  Rocket,
  Trash2,
  FileText,
  Trophy,
  Target,
  Award,
  Zap,
  Dog,
  Menu,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { BLogoIcon, LiveGamingStarIcon, TeenPattiCardsIcon } from "@/components/icons/CustomIcons";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterChange?: (filter: string) => void;
}

export function DashboardSidebar({ isOpen, onClose, onFilterChange }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const [expandedSport, setExpandedSport] = useState<string | null>(null);

  const toggleSport = (sport: string) => {
    setExpandedSport((prev) => (prev === sport ? null : sport));
  };

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

  const handleSelectEvent = (sport: string, eventName: string, eventId: string) => {
    // Generate a clean match object for navigation
    const parts = eventName.split(" v ");
    const team1 = parts[0] || eventName;
    const team2 = parts[1] || "";
    const matchObj = {
      id: eventId,
      sport,
      title: eventName,
      team1,
      team2,
      status: "live",
      match_time: new Date().toISOString(),
      t1_back: 1.95,
      t1_lay: 1.97,
      t2_back: 2.05,
      t2_lay: 2.08,
    };
    navigate(`/play/match/${eventId}`, { state: { match: matchObj } });
    onClose();
  };

  const sportsTree = [
    {
      id: "Soccer",
      label: "Soccer",
      icon: <Trophy className="w-4 h-4 text-white" />,
      events: [
        { id: "36064372", name: "AFC Wimbledon v MK Dons" },
        { id: "36004951", name: "Besiktas v Marseille" },
        { id: "36038690", name: "Betis v Getafe" },
        { id: "36005136", name: "Celtic v Ferencvaros" },
        { id: "36004998", name: "Crystal Palace v Lech Poznan" },
        { id: "36005137", name: "Juventus v NEC Nijmegen" },
        { id: "36004960", name: "Lillestrom v Torreense" },
        { id: "36038847", name: "Malaga v Villarreal" },
        { id: "36027462", name: "Man City v Norwich" },
        { id: "36004953", name: "OFI v Hoffenheim" },
        { id: "36004955", name: "PFC Levski Sofia v Red Bull Salzburg" },
        { id: "36004958", name: "Plzen v Union St Gilloise" },
        { id: "36004957", name: "Real Sociedad v Bournemouth" },
        { id: "35965539", name: "Torque v Cienciano" },
      ],
    },
    {
      id: "Tennis",
      label: "Tennis",
      icon: <Target className="w-4 h-4 text-white" />,
      events: [
        { id: "36077604", name: "Bucsa v Bejlek" },
        { id: "36081396", name: "Frech v I Jovic" },
        { id: "36077957", name: "Pe Stearns v Stephens" },
      ],
    },
    {
      id: "Cricket",
      label: "Cricket",
      icon: <Award className="w-4 h-4 text-white" />,
      events: [
        { id: "1.262478706", name: "Afghanistan v India" },
        { id: "1.262554511", name: "Antigua & Barbuda Falcs v Guyana Amazon Warriors" },
        { id: "1.262528280", name: "England v Sri Lanka" },
        { id: "1.262472033", name: "Rotterdam Dockers v Dublin Guardians" },
        { id: "1.262550946", name: "Trinbago Knight Rid W v Guyana Amazon War W" },
        { id: "1.262487338", name: "Zimbabwe v Australia" },
      ],
    },
    {
      id: "Horse Race",
      label: "Horse Race",
      icon: <Zap className="w-4 h-4 text-white" />,
      events: [
        { id: "36075372.1700", name: "Southwell (GB)" },
        { id: "36075372.1700P", name: "Southwell (GB) (PLACE)" },
        { id: "36078481.1705", name: "Belterra Park (US)" },
        { id: "36078717.1712", name: "Delaware Park (US)" },
        { id: "36075372.1730", name: "Southwell (GB)" },
        { id: "36075372.1730P", name: "Southwell (GB) (PLACE)" },
        { id: "36078481.1735", name: "Belterra Park (US)" },
        { id: "36078717.1744", name: "Delaware Park (US)" },
        { id: "36075372.1800", name: "Southwell (GB)" },
        { id: "36075372.1800P", name: "Southwell (GB) (PLACE)" },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-[1px]"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 w-[240px] max-w-[85vw] bg-[#1e3a5f] z-[101] flex flex-col shadow-2xl border-r border-white/10"
          >
            {/* BPEXCH Logo Header */}
            <div className="flex items-center justify-between px-3 py-3 bg-[#162b47] border-b border-white/10">
              <div
                onClick={() => handleNav("/play")}
                className="cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-[#00e676] font-black text-xl tracking-wider font-mono">
                  BPEXCH
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              {/* Accordion Sports */}
              {sportsTree.map((s) => {
                const isExpanded = expandedSport === s.id;
                return (
                  <div key={s.id} className="border-b border-white/5">
                    <button
                      onClick={() => toggleSport(s.id)}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-left text-white hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 flex justify-center">{s.icon}</div>
                        <span className="text-[13px] font-bold tracking-wide">{s.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-white/70" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-white/70" />
                      )}
                    </button>

                    {/* Submenu */}
                    {isExpanded && (
                      <div className="bg-[#162b47]/80 py-1.5 pl-4 pr-2 space-y-0.5 border-t border-white/5">
                        <button
                          onClick={() => handleFilter(s.id)}
                          className="w-full text-left py-1.5 px-2 text-[11.5px] font-extrabold text-[#00e676] hover:bg-white/10 rounded transition-colors"
                        >
                          ★ All {s.label}
                        </button>
                        {s.events.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => handleSelectEvent(s.id, ev.name, ev.id)}
                            className="w-full text-left py-1 px-2 text-[11px] font-medium text-white/90 hover:text-white hover:bg-white/10 rounded truncate block transition-colors"
                            title={ev.name}
                          >
                            {ev.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Other Navigation & Casino Links */}
              <div className="pt-2">
                <button
                  onClick={() => handleFilter("Greyhound")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white hover:bg-white/10 transition-colors text-[12.5px] font-semibold"
                >
                  <Dog className="w-4 h-4 text-white" />
                  <span>Greyhound</span>
                </button>
                <button
                  onClick={() => handleFilter("Inplay")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white hover:bg-white/10 transition-colors text-[12.5px] font-semibold"
                >
                  <BookOpen className="w-4 h-4 text-white" />
                  <span>Sports Book</span>
                </button>
                <button
                  onClick={() => handleFilter("Casino")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white hover:bg-white/10 transition-colors text-[12.5px] font-semibold"
                >
                  <LiveGamingStarIcon className="w-4 h-4 text-[#ffca28]" spin={true} />
                  <span>RoyalStar Casino</span>
                </button>
                <button
                  onClick={() => handleFilter("Casino")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white hover:bg-white/10 transition-colors text-[12.5px] font-semibold"
                >
                  <LiveGamingStarIcon className="w-4 h-4 text-[#00e676]" spin={true} />
                  <span>Star Casino</span>
                </button>
                <button
                  onClick={() => handleFilter("Casino")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white hover:bg-white/10 transition-colors text-[12.5px] font-semibold"
                >
                  <Globe className="w-4 h-4 text-white" />
                  <span>World Casino</span>
                </button>
                <button
                  onClick={() => handleFilter("Casino")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white hover:bg-white/10 transition-colors text-[12.5px] font-semibold"
                >
                  <Gem className="w-4 h-4 text-[#ec4899]" />
                  <span>Royal Casino</span>
                </button>
                <button
                  onClick={() => handleFilter("Casino")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white hover:bg-white/10 transition-colors text-[12.5px] font-semibold"
                >
                  <BLogoIcon className="w-4 h-4 text-[#ffb703]" color="#ffb703" />
                  <span>BetFairGames</span>
                </button>
                <button
                  onClick={() => handleFilter("Casino")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white hover:bg-white/10 transition-colors text-[12.5px] font-semibold"
                >
                  <TeenPattiCardsIcon className="w-4 h-4 text-[#a855f7]" color="#a855f7" />
                  <span>TeenPatti Studio</span>
                </button>
                <button
                  onClick={() => handleFilter("Casino")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white hover:bg-white/10 transition-colors text-[12.5px] font-semibold"
                  style={{
                    background: "linear-gradient(90deg, rgba(138,71,255,0.4) 0%, rgba(195,110,255,0.4) 100%)",
                  }}
                >
                  <Rocket className="w-4 h-4 text-[#c36eff]" />
                  <span className="font-bold">Galaxy Casino</span>
                  <span className="ml-auto text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                    Live
                  </span>
                </button>
              </div>

              {/* Account / Position Section */}
              <div className="h-[1px] bg-white/15 my-3 w-[90%] mx-auto" />

              <div className="pb-8 space-y-0.5">
                <button
                  onClick={() => handleNav("/play/current-position")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 transition-colors text-[12px] font-medium"
                >
                  <Trash2 className="w-4 h-4 text-white/70" />
                  <span>Current Position</span>
                </button>
                <button
                  onClick={() => handleFilter("Inplay")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 transition-colors text-[12px] font-medium"
                >
                  <Menu className="w-4 h-4 text-white/70" />
                  <span>All Sports</span>
                </button>
                <button
                  onClick={() => handleNav("/play/result")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 transition-colors text-[12px] font-medium"
                >
                  <FileText className="w-4 h-4 text-white/70" />
                  <span>Results</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


