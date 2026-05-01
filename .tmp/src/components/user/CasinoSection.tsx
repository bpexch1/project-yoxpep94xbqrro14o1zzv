import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dice1, 
  Dice3, 
  Dice5, 
  Gamepad2, 
  Coins, 
  Zap, 
  Users, 
  PlayCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

const CASINO_GAMES = [
  {
    id: "lightning-roulette",
    name: "Lightning Roulette",
    provider: "Evolution Gaming",
    category: "Roulette",
    gradient: "from-red-600 via-red-500 to-orange-500",
    icon: Zap,
    players: 452,
    gameUrl: "https://www.betfair.com/casino/games/lightning-roulette"
  },
  {
    id: "speed-baccarat",
    name: "Speed Baccarat",
    provider: "Betfair Live",
    category: "Baccarat",
    gradient: "from-emerald-600 via-emerald-500 to-teal-400",
    icon: Coins,
    players: 321,
    gameUrl: "https://www.betfair.com/casino/games/speed-baccarat"
  },
  {
    id: "teen-patti-live",
    name: "Teen Patti Live",
    provider: "Betfair Live",
    category: "Teen Patti",
    gradient: "from-purple-700 via-purple-600 to-fuchsia-500",
    icon: Dice5,
    players: 892,
    gameUrl: "https://www.betfair.com/casino/live-casino"
  },
  {
    id: "dragon-tiger",
    name: "Dragon Tiger",
    provider: "Betfair Live",
    category: "Others",
    gradient: "from-orange-600 via-orange-500 to-yellow-400",
    icon: Gamepad2,
    players: 156,
    gameUrl: "https://www.betfair.com/casino/games/dragon-tiger"
  },
  {
    id: "andar-bahar",
    name: "Andar Bahar",
    provider: "Betfair Live",
    category: "Others",
    gradient: "from-blue-700 via-blue-600 to-cyan-500",
    icon: Dice3,
    players: 643,
    gameUrl: "https://www.betfair.com/casino/live-casino"
  },
  {
    id: "crazy-time",
    name: "Crazy Time",
    provider: "Evolution Gaming",
    category: "Others",
    gradient: "from-yellow-500 via-orange-400 to-red-400",
    icon: Zap,
    players: 1240,
    gameUrl: "https://www.betfair.com/casino/games/crazy-time"
  },
  {
    id: "sicbo",
    name: "Sicbo",
    provider: "Betfair Live",
    category: "Others",
    gradient: "from-teal-600 via-teal-500 to-emerald-400",
    icon: Dice1,
    players: 89,
    gameUrl: "https://www.betfair.com/casino/live-casino"
  },
  {
    id: "speed-blackjack",
    name: "Speed Blackjack",
    provider: "Evolution Gaming",
    category: "Blackjack",
    gradient: "from-green-800 via-green-700 to-emerald-600",
    icon: Coins,
    players: 215,
    gameUrl: "https://www.betfair.com/casino/games/speed-blackjack"
  },
  {
    id: "indian-poker",
    name: "Indian Poker",
    provider: "Betfair Live",
    category: "Others",
    gradient: "from-indigo-800 via-purple-700 to-pink-600",
    icon: Dice5,
    players: 432,
    gameUrl: "https://www.betfair.com/casino/live-casino"
  },
  {
    id: "32-cards",
    name: "32 Cards",
    provider: "Betfair Live",
    category: "Others",
    gradient: "from-blue-900 via-blue-800 to-indigo-700",
    icon: Gamepad2,
    players: 124,
    gameUrl: "https://www.betfair.com/casino/live-casino"
  },
  {
    id: "roulette-live",
    name: "Roulette Live",
    provider: "Betfair Live",
    category: "Roulette",
    gradient: "from-rose-700 via-rose-600 to-pink-500",
    icon: Dice5,
    players: 567,
    gameUrl: "https://www.betfair.com/casino/games/roulette"
  },
  {
    id: "live-poker",
    name: "Live Poker",
    provider: "Evolution Gaming",
    category: "Others",
    gradient: "from-indigo-700 via-blue-600 to-cyan-600",
    icon: Coins,
    players: 198,
    gameUrl: "https://www.betfair.com/casino/live-casino"
  }
];

const CATEGORIES = ["All", "Roulette", "Baccarat", "Teen Patti", "Blackjack", "Others"];

export function CasinoSection() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredGames = CASINO_GAMES.filter(
    game => activeCategory === "All" || game.category === activeCategory
  );

  const handleGameClick = (game: any) => {
    window.open(game.gameUrl, '_blank');
  };

  return (
    <div className="flex flex-col bg-[#0a0f14] min-h-screen">
      {/* Casino Header */}
      <div className="bg-[#254465] px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-red-600 rounded-full animate-pulse">
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
          </div>
          <h2 className="text-white font-black text-[15px] uppercase tracking-wider">
            Live Casino <span className="text-[#00b181] ml-1">Betfair</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">24/7 LIVE</span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 px-3 py-3 overflow-x-auto no-scrollbar bg-[#111821]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              activeCategory === cat 
                ? "bg-[#00b181] text-white shadow-lg shadow-emerald-500/20" 
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-px bg-white/5">
        <AnimatePresence mode="popLayout">
          {filteredGames.map((game, idx) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => handleGameClick(game)}
                className="relative aspect-square group cursor-pointer overflow-hidden bg-[#0a0f14]"
              >
                {/* Gradient Background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br transition-all duration-500 group-hover:scale-110 brightness-[0.85] group-hover:brightness-100",
                  game.gradient
                )} />
                
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />

                {/* Live Badge */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-sm border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[8px] font-black text-white uppercase tracking-tighter">LIVE</span>
                </div>

                {/* Player Count */}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-sm border border-white/10">
                  <Users className="w-2.5 h-2.5 text-white/70" />
                  <span className="text-[8px] font-black text-white tracking-tighter">
                    {Math.floor(game.players + (Math.random() * 20 - 10))}
                  </span>
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-3 flex flex-col items-center justify-center text-center">
                  <motion.div 
                    whileHover={{ rotate: 15 }}
                    className="mb-2 p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors"
                  >
                    <Icon className="w-6 h-6 text-white shadow-sm" />
                  </motion.div>
                  <h3 className="text-[10px] sm:text-[11px] font-black text-white uppercase leading-tight drop-shadow-md mb-0.5">
                    {game.name}
                  </h3>
                  <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest drop-shadow-sm">
                    {game.provider}
                  </p>
                </div>

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                  <PlayCircle className="w-10 h-10 text-white mb-2" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse bg-red-600 px-3 py-1 rounded-full shadow-lg">PLAY NOW →</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Disclaimer */}
      <div className="p-6 text-center">
        <p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.2em]">
          All games provided by Betfair International Ltd.
        </p>
      </div>
    </div>
  );
}
