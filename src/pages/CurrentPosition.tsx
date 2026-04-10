import { Layout } from "@/components/layout/Layout";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Target, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function CurrentPosition() {
  return (
    <Layout>
      <div className="p-3 max-w-5xl mx-auto space-y-3">
        <ReportTypeTabs activeTab="Current Position" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded border shadow-sm overflow-hidden"
        >
          <div className="bg-slate-50 border-b px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Target className="w-4 h-4" />
            Current Position
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Info className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">No Active Positions</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                There are currently no active positions or bets to display at the moment.
              </p>
            </div>
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
              Coming Soon
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
