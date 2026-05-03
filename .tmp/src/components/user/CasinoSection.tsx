import { motion } from "framer-motion";
import { 
  Gamepad2, 
  Clock,
  Sparkles,
  Lock
} from "lucide-react";

export function CasinoSection() {
  return (
    <div className="flex flex-col bg-[#0a0f14] min-h-[60vh] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Casino Header (Keep for context) */}
      <div className="bg-[#254465] px-4 py-3 flex items-center justify-between border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-amber-500 rounded-full">
             <Lock className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-white font-black text-[15px] uppercase tracking-wider">
            Premium Casino <span className="text-[#00b181] ml-1">Coming Soon</span>
          </h2>
        </div>
      </div>

      {/* Main Message Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Animated Icon Container */}
          <div className="relative mb-8">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="w-24 h-24 bg-gradient-to-br from-[#00b181] to-emerald-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(0,177,129,0.3)] border border-white/20"
            >
              <Gamepad2 className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Floating Badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-6 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg border border-white/10 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              NEW
            </motion.div>
          </div>

          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">
            Under <span className="text-[#00b181]">Maintenance</span>
          </h1>
          
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-6">
            <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">Launching Very Soon</span>
          </div>

          <p className="text-white/40 text-xs font-medium max-w-[280px] leading-relaxed mb-10">
            Our world-class casino games are currently being updated to provide you with the ultimate betting experience. We'll be back online shortly!
          </p>

          {/* Progress Indicator (Fake) */}
          <div className="w-full max-w-[240px] h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 mb-2">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "85%" }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
            />
          </div>
          <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">
            Optimizing Performance 85%
          </span>
        </motion.div>
      </div>

      {/* Feature Glimpse (Blurred) */}
      <div className="p-4 grid grid-cols-2 gap-4 opacity-20 filter blur-sm grayscale pointer-events-none mb-10">
        <div className="h-20 bg-white/5 rounded-xl border border-white/10" />
        <div className="h-20 bg-white/5 rounded-xl border border-white/10" />
      </div>

      {/* Footer Branding */}
      <div className="p-6 text-center border-t border-white/5 bg-black/20">
        <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.3em]">
          Powered by Betfair International
        </p>
      </div>
    </div>
  );
}
