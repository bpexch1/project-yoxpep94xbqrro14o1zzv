import { User } from "@/entities";
import { Button } from "@/components/ui/button";
import { Trophy, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserHeaderProps {
  activeFilter: string;
  onFilterChange: (f: string) => void;
  userEmail: string;
}

export function UserHeader({ activeFilter, onFilterChange, userEmail }: UserHeaderProps) {
  const sports = ["All", "Cricket", "Football", "Tennis"];

  return (
    <header className="bg-[#0d1526] border-b border-[#1e2d47] sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Trophy className="w-6 h-6 text-amber-500" />
          <div className="hidden sm:block text-xl font-black tracking-tighter">
            <span className="text-amber-500">BETPRO</span>
            <span className="text-white text-xs ml-1 opacity-70">EXCHANGE</span>
          </div>
        </div>

        {/* Filters */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {sports.map((sport) => (
            <button
              key={sport}
              onClick={() => onFilterChange(sport)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                activeFilter === sport
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {sport}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Balance</span>
            <span className="text-amber-400 font-black">Rs. 5,000</span>
          </div>
          <Button 
            variant="destructive" 
            size="icon" 
            className="h-9 w-9 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all"
            onClick={() => User.logout()}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
