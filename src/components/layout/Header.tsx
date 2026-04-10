import { Menu, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-slate-800 text-white h-12 flex items-center justify-between px-4 shadow-md font-mono text-xs">
      <div className="flex items-center gap-4">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onMenuClick}
          className="p-1"
        >
          <Menu className="w-5 h-5 cursor-pointer" />
        </motion.button>
        <div className="flex items-center gap-1 cursor-pointer group">
          <span className="group-hover:text-emerald-400 transition-colors">NomanSA8592 (SuperAdmin)</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-center gap-4 font-bold tracking-tight">
        <span className="flex items-center gap-1">
          <span className="text-slate-400 font-normal">B:</span>
          <span className="text-emerald-400">0</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-slate-400 font-normal">Exp:</span>
          <span className="text-rose-400">0</span>
        </span>
      </div>
    </header>
  );
}
