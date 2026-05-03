
















import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  BookOpen,
  Globe,
  Gem,
  Gamepad2,
  LayoutGrid,
  Rocket,
  Trash2,
  FileText,
} from "lucide-react";

interface SidebarItemProps {
  iconEl: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function SidebarItem({ iconEl, label, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full h-[54px] bg-transparent hover:bg-white/10 transition-colors text-left"
    >
      <div className="w-[68px] flex items-center justify-center shrink-0">
        <div className="scale-[1.2]">
          {iconEl}
        </div>
      </div>
      <span className="text-[15.5px] text-white font-medium tracking-tight truncate">
        {label}
      </span>
    </button>
  );
}

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterChange?: (filter: string) => void;
}

export function DashboardSidebar({ isOpen, onClose, onFilterChange }: DashboardSidebarProps) {
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleFilter = (filter: string) => {
    if (onFilterChange) {
      onFilterChange(filter);
      onClose();
    } else {
      // If we're not on the dashboard, navigate there with the filter
      navigate("/play", { state: { activeFilter: filter } });
      onClose();
    }
  };

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
            className="fixed inset-0 bg-black/40 z-[100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[190px] bg-[#254465] z-[101] flex flex-col shadow-2xl"
          >
            {/* Close Button Header */}
            <div className="flex items-start">
              <button
                onClick={onClose}
                className="w-[54px] h-[54px] flex items-center justify-center border-r border-b border-white/20 bg-black/5 hover:bg-black/20 transition-colors rounded-none"
              >
                <X className="w-8 h-8 text-white stroke-[2.5]" />
              </button>
            </div>

            {/* Top Separator - visible after first item in screenshot but also one at top */}
            <div className="h-[1px] bg-white/20 w-[85%] mx-auto mt-4 mb-2" />

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="flex flex-col">
                <SidebarItem iconEl={<span className="svg-soccer sprite-icon-white" />} label="Soccer" onClick={() => handleFilter("Soccer")} />
                <SidebarItem iconEl={<span className="svg-tennis sprite-icon-white" />} label="Tennis" onClick={() => handleFilter("Tennis")} />
                <SidebarItem iconEl={<span className="svg-cricket sprite-icon-white" />} label="Cricket" onClick={() => handleFilter("Cricket")} />
                <SidebarItem iconEl={<span className="svg-horse sprite-icon-white" />} label="Horse Race" onClick={() => handleFilter("Inplay")} />
                <SidebarItem iconEl={<span className="svg-greyhound-racing sprite-icon-white" />} label="Greyhound" onClick={() => handleFilter("Inplay")} />
                <SidebarItem iconEl={<BookOpen className="w-5 h-5 text-white" />} label="Sports Book" onClick={() => handleFilter("Inplay")} />
                <SidebarItem iconEl={<span className="svg-live-casino sprite-icon-white" />} label="RoyalStar Casino" onClick={() => handleFilter("Casino")} />
                <SidebarItem iconEl={<span className="svg-Casino sprite-icon-white" />} label="Star Casino" onClick={() => handleFilter("Casino")} />
                <SidebarItem iconEl={<Globe className="w-5 h-5 text-white" />} label="World Casino" onClick={() => handleFilter("Casino")} />
                <SidebarItem iconEl={<Gem className="w-5 h-5 text-white" />} label="Royal Casino" onClick={() => handleFilter("Casino")} />
                <SidebarItem iconEl={<Gamepad2 className="w-5 h-5 text-white" />} label="BetFairGames" onClick={() => handleFilter("Casino")} />
                <SidebarItem iconEl={<LayoutGrid className="w-5 h-5 text-white" />} label="TeenPatti Studio" onClick={() => handleFilter("Casino")} />
                <SidebarItem iconEl={<Rocket className="w-5 h-5 text-white" />} label="Galaxy Casino" onClick={() => handleFilter("Casino")} />
              </div>

              {/* Divider before Current Position */}
              <div className="h-[1px] bg-white/20 mt-4 mb-2 w-[85%] mx-auto" />

              <div className="flex flex-col pb-10">
                <SidebarItem iconEl={<Trash2 className="w-5 h-5 text-white" />} label="Current Position" onClick={() => handleNav("/play/current-position")} />
                <SidebarItem iconEl={<span className="svg-az-sport sprite-icon-white" />} label="All Sports" onClick={() => handleFilter("Inplay")} />
                <SidebarItem iconEl={<FileText className="w-5 h-5 text-white" />} label="Results" onClick={() => handleNav("/play/result")} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

