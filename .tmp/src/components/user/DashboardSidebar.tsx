import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Volleyball, Tent, Ticket, House, Dog, Book, Star, Globe, LayoutGrid, Gamepad2, Rocket, BarChart2, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 border-b border-white/5 transition-colors group"
    >
      <Icon className="w-4 h-4 text-white/50 group-hover:text-white" />
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  );
}

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const menuItems = [
    { icon: Volleyball, label: "Soccer" },
    { icon: Tent, label: "Tennis" },
    { icon: Ticket, label: "Cricket" },
    { icon: House, label: "Horse Race" },
    { icon: Dog, label: "Greyhound" },
    { icon: Book, label: "Sports Book" },
    { icon: Star, label: "RoyalStar Casino" },
    { icon: Star, label: "Star Casino" },
    { icon: Globe, label: "World Casino" },
    { icon: Laptop, label: "Royal Casino" },
    { icon: Gamepad2, label: "BetFairGames" },
    { icon: Star, label: "TeenPatti Studio" },
    { icon: Rocket, label: "Galaxy Casino" },
    { icon: BarChart2, label: "Current Position" },
    { icon: LayoutGrid, label: "All Sports" },
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
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#1e3a5c] z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
              <span className="text-white font-bold text-sm tracking-wide">Dashboard</span>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {menuItems.map((item, idx) => (
                <SidebarItem key={idx} icon={item.icon} label={item.label} />
              ))}
            </div>

            {/* Footer / Branding */}
            <div className="p-4 bg-black/20">
              <div className="flex items-center gap-2 opacity-50">
                <Trophy className="w-4 h-4 text-white" />
                <span className="text-white text-[10px] font-black tracking-tighter uppercase">BETPRO EXCHANGE</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
