import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, Search, Loader2 } from "lucide-react";
import { Bet as BetEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { cn } from "@/lib/utils";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";
import { ExportButtons } from "@/components/reports/ExportButtons";

export default function DailyPL() {
  const [activeTab, setActiveTab] = useState("Daily PL");
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [searchTrigger, setSearchTrigger] = useState(0);
  
  const session = getClientSession();
  const navigate = useNavigate();
  const { data: downlineUsernames } = useDownlineUsernames(session?.username, session?.role);

  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [session, navigate]);

  const { data: dailyData, isLoading } = useQuery({
    queryKey: ["daily-pl", session?.username, fromDate, toDate, searchTrigger, downlineUsernames],
    queryFn: async () => {
      if (!session) return [];
      
      // Fetch bets based on role
      let all: any[];
      if (downlineUsernames === null) {
        // Company role: see all bets
        all = await BetEntity.query().sort("-created_at").exec();
      } else if (session.role === 'client') {
        all = await BetEntity.query().where("user_email", session.username).sort("-created_at").exec();
      } else {
        // Admin/agent: see downline bets
        if (!downlineUsernames || downlineUsernames.length === 0) return [];
        const allBets = await BetEntity.query().sort("-created_at").exec();
        all = allBets.filter((b: any) => downlineUsernames.includes(b.user_email));
      }
      
      const filtered = all.filter(b => {
        const date = b.created_at.split('T')[0];
        return date >= fromDate && date <= toDate;
      });

      // Group by date
      const groups: Record<string, any> = {};
      filtered.forEach(b => {
        const date = b.created_at.split('T')[0];
        if (!groups[date]) {
          groups[date] = {
            date,
            totalBets: 0,
            totalStake: 0,
            totalWon: 0,
            totalLost: 0,
          };
        }
        groups[date].totalBets += 1;
        groups[date].totalStake += b.stake || 0;
        if (b.status === "won") groups[date].totalWon += b.potential_win || 0;
        if (b.status === "lost") groups[date].totalLost += b.stake || 0;
      });

      return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date)).map(day => {
        const netPL = day.totalWon - day.totalLost;
        const commission = netPL > 0 ? netPL * 0.02 : 0; // 2% commission on profit
        return {
          ...day,
          netPL,
          commission
        };
      });
    },
    enabled: !!session && downlineUsernames !== undefined,
  });

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  const grandTotal = dailyData?.reduce((acc, day) => ({
    totalBets: acc.totalBets + day.totalBets,
    totalStake: acc.totalStake + day.totalStake,
    totalWon: acc.totalWon + day.totalWon,
    totalLost: acc.totalLost + day.totalLost,
    netPL: acc.netPL + day.netPL,
    commission: acc.commission + day.commission,
  }), { totalBets: 0, totalStake: 0, totalWon: 0, totalLost: 0, netPL: 0, commission: 0 });

  const exportColumns = [
    { key: "date", label: "Date" },
    { key: "totalBets", label: "Bets" },
    { key: "totalStake", label: "Stake" },
    { key: "totalWon", label: "Won" },
    { key: "totalLost", label: "Lost" },
    { key: "netPL", label: "Net P&L" },
    { key: "commission", label: "Commission" },
  ];

  const exportData = (dailyData || []).map((day) => ({
    date: day.date,
    totalBets: day.totalBets,
    totalStake: day.totalStake.toFixed(2),
    totalWon: day.totalWon.toFixed(2),
    totalLost: day.totalLost.toFixed(2),
    netPL: day.netPL.toFixed(2),
    commission: day.commission.toFixed(2),
  }));

  return (
    <div className="bg-[#f4f6f7] pb-16">
      <main className="px-0 pt-0 pb-8 max-w-5xl mx-auto font-sans">
        <div className="h-2" />
        
        <div className="mx-2 mb-2">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Date Filter Card */}
        <div className="mx-2 mb-2">
          <section className="bg-white border border-[#d5d8dc] rounded-none shadow-none">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#d5d8dc] bg-[#ecf0f1]">
              <Filter className="w-4 h-4 fill-[#2c3e50] text-[#2c3e50]" />
              <span className="font-bold text-[#2c3e50] text-sm">Filters</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full border border-[#d5d8dc] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#00b181]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full border border-[#d5d8dc] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#00b181]"
                  />
                </div>
              </div>
              <button 
                onClick={handleSearch}
                className="bg-[#00b181] text-white w-full py-2 rounded text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#4dbd74] transition-colors"
              >
                <Search className="w-4 h-4" />
                Get Report
              </button>
            </div>
          </section>
        </div>

        {/* Report Table */}
        <div className="mx-2">
          <section className="bg-white border border-[#d5d8dc] overflow-hidden">
            <div className="bg-[#ecf0f1] border-b border-[#d5d8dc] px-3 py-2 flex items-center gap-2">
              <strong className="text-[13px] text-[#2c3e50]">Daily P&L</strong>
              <ExportButtons 
                data={exportData} 
                columns={exportColumns} 
                filename={`Daily-PL-${fromDate}-${toDate}`} 
                disabled={!dailyData?.length} 
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#254465] text-white">
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">Date</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-center font-medium">Bets</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Stake</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Won</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Lost</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Net P&L</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Comm.</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b181] mx-auto" />
                      </td>
                    </tr>
                  ) : dailyData && dailyData.length > 0 ? (
                    dailyData.map((day, i) => (
                      <tr key={day.date} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f4f6f7]")}>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-700 font-medium">{day.date}</td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-center text-gray-700">{day.totalBets}</td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-right text-gray-700 font-medium">{day.totalStake.toFixed(2)}</td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-right text-[#00b181] font-medium">{day.totalWon.toFixed(2)}</td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-right text-[#e74c3c] font-medium">{day.totalLost.toFixed(2)}</td>
                        <td className={cn(
                          "border border-[#d5d8dc] px-2 py-1.5 text-right font-bold",
                          day.netPL >= 0 ? "text-[#00b181]" : "text-[#e74c3c]"
                        )}>
                          {day.netPL.toFixed(2)}
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-right text-gray-500 italic">
                          {day.commission.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 italic">
                        No daily records found.
                      </td>
                    </tr>
                  )}
                </tbody>
                {dailyData && dailyData.length > 0 && grandTotal && (
                  <tfoot>
                    <tr className="bg-[#ecf0f1] font-bold">
                      <td className="border border-[#d5d8dc] px-2 py-2 text-right text-[#2c3e50]">Total:</td>
                      <td className="border border-[#d5d8dc] px-2 py-2 text-center text-[#2c3e50]">{grandTotal.totalBets}</td>
                      <td className="border border-[#d5d8dc] px-2 py-2 text-right text-[#2c3e50]">{grandTotal.totalStake.toFixed(2)}</td>
                      <td className="border border-[#d5d8dc] px-2 py-2 text-right text-[#00b181]">{grandTotal.totalWon.toFixed(2)}</td>
                      <td className="border border-[#d5d8dc] px-2 py-2 text-right text-[#e74c3c]">{grandTotal.totalLost.toFixed(2)}</td>
                      <td className={cn(
                        "border border-[#d5d8dc] px-2 py-2 text-right",
                        grandTotal.netPL >= 0 ? "text-[#00b181]" : "text-[#e74c3c]"
                      )}>
                        {grandTotal.netPL.toFixed(2)}
                      </td>
                      <td className="border border-[#d5d8dc] px-2 py-2 text-right text-gray-600 font-normal">
                        {grandTotal.commission.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
