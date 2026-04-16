import { motion, AnimatePresence } from "framer-motion";
import {
  Volleyball,
  Circle,
  Sword,
  Zap,
  Dog,
  BookOpen,
  Star,
  Globe,
  Coins,
  Gamepad2,
  Layers,
  Rocket,
  LayoutGrid,
  BarChart3,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  className?: string;
}

function SidebarItem({ icon: Icon, label, onClick, className }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 w-full px-5 py-[15px] border-b border-white/10 hover:bg-white/10 transition-colors group",
        className
      )}
    >
      <Icon className="w-6 h-6 text-white/80 group-hover:text-white shrink-0" />
      <span className="text-[15px] text-white font-medium tracking-wide">{label}</span>
    </button>
  );
}

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  // Main menu items
  const mainItems = [
    { icon: Volleyball, label: "Soccer" },
    { icon: Circle, label: "Tennis" },
    { icon: Sword, label: "Cricket" },
    { icon: Zap, label: "Horse Race" },
    { icon: Dog, label: "Greyhound" },
    { icon: BookOpen, label: "Sports Book" },
    { icon: Star, label: "RoyalStar Casino" },
    { icon: Star, label: "Star Casino" },
    { icon: Globe, label: "World Casino" },
    { icon: Coins, label: "Royal Casino" },
    { icon: Gamepad2, label: "BetFairGames" },
    { icon: Layers, label: "TeenPatti Studio" },
    { icon: Rocket, label: "Galaxy Casino" },
  ];

  // Bottom group (after divider)
  const bottomItems = [
    { icon: BarChart3, label: "Current Position" },
    { icon: LayoutGrid, label: "All Sports" },
    { icon: List, label: "Results" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - Lighter overlay as requested */}
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
            className="fixed top-0 left-0 bottom-0 w-[270px] bg-[#1e3a5c] z-[101] flex flex-col shadow-2xl"
          >
            {/* Top spacing / Divider */}
            <div className="h-12 flex items-center shrink-0 border-b border-white/20" />

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="flex flex-col">
                {mainItems.map((item, idx) => (
                  <SidebarItem key={idx} icon={item.icon} label={item.label} />
                ))}
              </div>

              {/* Thicker divider gap */}
              <div className="h-2 bg-black/10 border-t border-b border-white/10 my-0" />
              <div className="border-t-2 border-white/20" />

              <div className="flex flex-col">
                {bottomItems.map((item, idx) => (
                  <SidebarItem key={idx} icon={item.icon} label={item.label} />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
