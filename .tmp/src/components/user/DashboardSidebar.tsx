










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
  BarChart3,
  List,
  Trophy,
  History,
  ReceiptText,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  iconEl: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function SidebarItem({ iconEl, label, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2 border-b border-white/5 bg-transparent hover:bg-white/10 transition-colors text-left"
    >
      <div className="w-[24px] flex items-center justify-center shrink-0">
        {iconEl}
      </div>
      <span className="text-[13px] text-white font-medium tracking-wide truncate">
        {label}
      </span>
    </button>
  );
}

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
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
            className="fixed top-0 left-0 bottom-0 w-[170px] bg-[#254465] z-[101] flex flex-col shadow-2xl"
          >
            {/* Close Button Header */}
            <div className="p-2.5">
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center border border-white/20 bg-black/10 hover:bg-black/30 transition-colors rounded-sm"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* Top Separator */}
            <div className="border-t border-white/10 w-full" />

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="flex flex-col">
                <SidebarItem iconEl={<span className="svg-soccer sprite-icon-white" />} label="Soccer" />
                <SidebarItem iconEl={<span className="svg-tennis sprite-icon-white" />} label="Tennis" />
                <SidebarItem iconEl={<span className="svg-cricket sprite-icon-white" />} label="Cricket" />
                <SidebarItem iconEl={<span className="svg-horse sprite-icon-white" />} label="Horse Race" />
                <SidebarItem iconEl={<span className="svg-greyhound-racing sprite-icon-white" />} label="Greyhound" />
                <SidebarItem iconEl={<BookOpen className="w-4 h-4 text-white" />} label="Sports Book" />
                <SidebarItem iconEl={<span className="svg-live-casino sprite-icon-white" />} label="RoyalStar Casino" />
                <SidebarItem iconEl={<span className="svg-Casino sprite-icon-white" />} label="Star Casino" />
                <SidebarItem iconEl={<Globe className="w-4 h-4 text-white" />} label="World Casino" />
                <SidebarItem iconEl={<Gem className="w-4 h-4 text-white" />} label="Royal Casino" />
                <SidebarItem iconEl={<Gamepad2 className="w-4 h-4 text-white" />} label="BetFairGames" />
                <SidebarItem iconEl={<LayoutGrid className="w-4 h-4 text-white" />} label="TeenPatti Studio" />
                <SidebarItem iconEl={<Rocket className="w-4 h-4 text-white" />} label="Galaxy Casino" />
              </div>

              {/* Divider between Galaxy Casino and Current Position */}
              <div className="h-[1px] bg-white/10 my-1 w-full" />

              <div className="flex flex-col pb-4">
                <SidebarItem iconEl={<BarChart3 className="w-4 h-4 text-white" />} label="Profit Loss" onClick={() => handleNav("/play/profit-loss")} />
                <SidebarItem iconEl={<ReceiptText className="w-4 h-4 text-white" />} label="Statement" onClick={() => handleNav("/play/statement")} />
                <SidebarItem iconEl={<History className="w-4 h-4 text-white" />} label="Bet History" onClick={() => handleNav("/play/bets")} />
                <SidebarItem iconEl={<List className="w-4 h-4 text-white" />} label="Results" onClick={() => handleNav("/play/result")} />
                <SidebarItem iconEl={<User className="w-4 h-4 text-white" />} label="Profile" onClick={() => handleNav("/play/profile")} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

