import { 
  LayoutDashboard, Users, CircleDollarSign, FileBarChart2, Lock, Star, Globe, Menu, Activity, CircleDot, Trophy, Zap, Rabbit 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

const mainMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard, link: "/" },
  { label: "Users", icon: Users, link: "/accounts" },
  { label: "Current Position", icon: CircleDollarSign, link: "/current-position" },
  { label: "Reports", icon: FileBarChart2, link: "/reports/daily-pl" },
  { label: "Bet Lock", icon: Lock, link: "/bet-lock" },
  { label: "Star Casino", icon: Star, link: "/star-casino" },
  { label: "World Casino", icon: Globe, link: "/world-casino" },
  { label: "BetFair Games", icon: Globe, link: "/betfair-games" },
];

const sportsItems = [
  { label: "Soccer", icon: CircleDot, link: "/sports/soccer" },
  { label: "Tennis", icon: Activity, link: "/sports/tennis" },
  { label: "Cricket", icon: Trophy, link: "/sports/cricket" },
  { label: "Horse Race", icon: Zap, link: "/sports/horse-race" },
  { label: "Greyhound", icon: Rabbit, link: "/sports/greyhound" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();

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
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed left-0 top-0 h-full w-[260px] z-50 bg-[#254465] flex flex-col overflow-y-auto"
          >
            {/* Header row with hamburger */}
            <div className="p-4 border-b border-[#1a3550]">
              <button
                onClick={onClose}
                className="border border-gray-500 p-1.5 rounded hover:bg-[#3d6b8b] transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            <nav className="flex flex-col py-2">
              {/* Main Menu */}
              {mainMenuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.link); onClose(); }}
                  className="flex items-center gap-3 px-5 py-3 text-white text-[15px] hover:bg-[#3d6b8b] transition-colors text-left"
                >
                  <item.icon className="w-5 h-5 text-[#a8c8e8]" />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="h-px bg-[#3d6b8b] my-2 mx-5" />

              {/* Sports Menu */}
              {sportsItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.link); onClose(); }}
                  className="flex items-center px-5 py-3 text-white text-[15px] hover:bg-[#3d6b8b] transition-colors text-left"
                >
                  <item.icon className="w-5 h-5 text-[#a8c8e8] mr-3" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
