import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  FileText, 
  Lock, 
  Star, 
  Globe, 
  Gamepad2, 
  CircleDot, 
  Activity, 
  Trophy, 
  Zap, 
  Rabbit 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard, link: "/" },
  { label: "Users", icon: Users, link: "/accounts" },
  { label: "Current Position", icon: Wallet, link: "/current-position" },
  { label: "Reports", icon: FileText, link: "/reports/daily-pl" },
  { label: "Bet Lock", icon: Lock, link: "/bet-lock" },
  { label: "Star Casino", icon: Star, link: "/star-casino" },
  { label: "World Casino", icon: Globe, link: "/world-casino" },
  { label: "BetFair Games", icon: Gamepad2, link: "/betfair-games" },
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[99]"
          />
          {/* Sidebar panel */}
          <motion.div
            initial={{ x: -208 }}
            animate={{ x: 0 }}
            exit={{ x: -208 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed top-0 left-0 h-full w-52 bg-[#1e2d3d] z-[100] overflow-y-auto"
          >
            <div className="flex flex-col">
              {mainMenuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.link);
                    onClose();
                  }}
                  className="w-full flex items-center px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5"
                >
                  <item.icon className="w-5 h-5 text-gray-300 mr-3" />
                  <span className="text-sm text-gray-100">{item.label}</span>
                </button>
              ))}
              
              {/* Separator */}
              <div className="border-t border-white/20" />
              
              {sportsItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.link);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5"
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 text-gray-300 mr-3" />
                    <span className="text-sm text-gray-100">{item.label}</span>
                  </div>
                  <span className="text-gray-400 text-sm">‹</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
