import { 
  X, 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  FileText, 
  Lock, 
  Star, 
  Globe, 
  ChevronRight, 
  Circle, 
  Activity, 
  Zap, 
  Wind 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Users", icon: Users, path: "/accounts" },
  { label: "Current Position", icon: TrendingUp, path: "/current-position" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Bet Lock", icon: Lock, path: "/bet-lock" },
  { label: "Star Casino", icon: Star, path: "/star-casino" },
  { label: "World Casino", icon: Globe, path: "/world-casino" },
  { label: "BetFair Games", icon: Globe, path: "/betfair-games" },
];

const sportsItems = [
  { label: "Soccer", icon: Circle, path: "/soccer" },
  { label: "Tennis", icon: Circle, path: "/tennis" },
  { label: "Cricket", icon: Activity, path: "/cricket" },
  { label: "Horse Race", icon: Zap, path: "/horse-race" },
  { label: "Greyhound", icon: Wind, path: "/greyhound" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

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
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-64 bg-[#1e2a38] z-[70] overflow-y-auto"
          >
            <div className="flex justify-end p-4">
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="space-y-0.5 pb-10">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-gray-200 hover:bg-white/10 transition-colors text-sm"
                >
                  <item.icon className="w-5 h-5 text-teal-400" />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="h-px bg-white/10 my-2 mx-5" />

              {sportsItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className="w-full flex items-center justify-between px-5 py-3 text-gray-200 hover:bg-white/10 transition-colors text-sm"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-teal-400" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
