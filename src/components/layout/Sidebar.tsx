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
  Rabbit,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

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
  const location = useLocation();

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
            className="fixed inset-0 bg-black/60 z-[99]"
          />
          {/* Sidebar panel */}
          <motion.div
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed top-0 left-0 h-full w-[240px] bg-[#1e2d3d] z-[100] overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="h-12 flex items-center justify-between px-4 bg-[#1e3a5f] border-b border-white/10 shrink-0">
                <span className="text-white font-bold tracking-tight">BETPRO</span>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex-1 py-2">
                {mainMenuItems.map((item) => {
                  const isActive = location.pathname === item.link;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        navigate(item.link);
                        onClose();
                      }}
                      className={`w-full flex items-center px-4 py-3.5 hover:bg-white/10 transition-colors text-left border-b border-white/5 ${
                        isActive ? "bg-white/15" : ""
                      }`}
                    >
                      <item.icon className={`w-5 h-5 mr-3 ${isActive ? "text-emerald-400" : "text-gray-300"}`} />
                      <span className={`text-sm ${isActive ? "text-white font-medium" : "text-gray-100"}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
                
                {/* Sports Section Header */}
                <div className="px-4 py-3 mt-2 bg-black/20">
                  <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Sports</span>
                </div>
                
                {sportsItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      navigate(item.link);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/10 transition-colors text-left border-b border-white/5"
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 text-gray-300 mr-3" />
                      <span className="text-sm text-gray-100">{item.label}</span>
                    </div>
                    <span className="text-gray-400 text-sm">‹</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
