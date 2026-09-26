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
      let all: any[] = [];
      const safeDownlineUsernames = Array.isArray(downlineUsernames) ? downlineUsernames : [];

      if (downlineUsernames === null) {
        // Company role: see all bets
        const res = await BetEntity.query().sort("-created_at").exec();
        all = Array.isArray(res) ? res : [];
      } else if (session.role === 'client') {
        const res = await BetEntity.query().where("user_email", session.username).sort("-created_at").exec();
        all = Array.isArray(res) ? res : [];
      } else {
        // Admin/agent: see downline bets
        if (safeDownlineUsernames.length === 0) return [];
        const allBets = await BetEntity.query().sort("-created_at").exec();
        const safeAllBets = Array.isArray(allBets) ? allBets : [];
        all = safeAllBets.filter((b: any) => b?.user_email && safeDownlineUsernames.includes(b.user_email));
      }
      
      const filtered = all.filter(b => {
        if (!b?.created_at) return false;
        const date = b.created_at.split('T')[0];
        return date >= fromDate && date <= toDate;
      });

      // Group by date
      const groups: Record<string, any> = {};
      filtered.forEach(b => {
        if (!b?.created_at) return;
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

  // Safe array conversion for render logic
  const safeDailyData = Array.isArray(dailyData) ? dailyData : [];

  const grandTotal = safeDailyData.reduce((acc, day) => ({
    totalBets: acc.totalBets + (day?.totalBets || 0),
    totalStake: acc.totalStake + (day?.totalStake || 0),
    totalWon: acc.totalWon + (day?.totalWon || 0),
    totalLost: acc.totalLost + (day?.totalLost || 0),
    netPL: acc.netPL + (day?.netPL || 0),
    commission: acc.commission + (day?.commission || 0),
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

  const exportData = safeDailyData.map((day) => ({
    date: day?.date || "—",
    totalBets: day?.totalBets || 0,
    totalStake: (day?.totalStake || 0).toFixed(2),
    totalWon: (day?.totalWon || 0).toFixed(2),
    totalLost: (day?.totalLost || 0).toFixed(2),
    netPL: (day?.netPL || 0).toFixed(2),
    commission: (day?.commission || 0).toFixed(2),
  }));

  return (
    <div className="bg-[rgb(228,229,230)] min-h-screen pb-16 text-[rgb(35,40,44)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <main className="pt-0 pb-8 max-w-5xl mx-auto px-2 sm:px-3">
        <div className="h-2" />
        
        <div className="mb-2">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Date Filter Card */}
        <div className="mb-2">
          <section className="bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] shadow-[0_1px_1px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[rgb(200,206,211)] bg-[#f0f3f5]">
              <Filter className="w-4 h-4 fill-[rgb(35,40,44)] text-[rgb(35,40,44)]" />
              <span className="font-bold text-[rgb(35,40,44)] text-[0.875rem]">Filters</span>
            </div>
            <div className="p-3 flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[11px] text-[#6c757d] uppercase font-bold mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full border border-[rgb(200,206,211)] rounded-[0.25rem] px-2.5 py-1.5 text-[0.875rem] focus:outline-none focus:border-[#00b98a]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] text-[#6c757d] uppercase font-bold mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full border border-[rgb(200,206,211)] rounded-[0.25rem] px-2.5 py-1.5 text-[0.875rem] focus:outline-none focus:border-[#00b98a]"
                  />
                </div>
              </div>
              <button 
                onClick={handleSearch}
                className="bg-[#00b98a] hover:bg-[#138a72] text-white w-full py-1.5 rounded-[0.2rem] text-[0.875rem] font-medium flex items-center justify-center gap-2 transition-colors border border-[#00b98a]"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                Get Report
              </button>
            </div>
          </section>
        </div>

        {/* Report Table */}
        <div>
          <section className="bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] shadow-[0_1px_1px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="bg-[#f0f3f5] border-b border-[rgb(200,206,211)] px-3 py-2 flex items-center justify-between gap-2">
              <strong className="text-[0.875rem] font-bold text-[rgb(35,40,44)]">Daily P&L</strong>
              <ExportButtons 
                data={exportData} 
                columns={exportColumns} 
                filename={`Daily-PL-${fromDate}-${toDate}`} 
                disabled={!safeDailyData.length} 
              />
            </div>
            <div className="overflow-x-auto">
              <table className="table table-bordered table-striped table-sm mb-0 text-[0.875rem]">
                <thead>
                  <tr className="bg-[#f0f3f5] text-[rgb(35,40,44)]">
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold">Date</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center font-bold">Bets</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold">Stake</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold">Won</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold">Lost</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold">Net P&L</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold">Comm.</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b98a] mx-auto" />
                      </td>
                    </tr>
                  ) : safeDailyData.length > 0 ? (
                    safeDailyData.map((day, i) => (
                      <tr key={day?.date || i} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f8f9fa]")}>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-[rgb(35,40,44)] font-medium">{day?.date || "—"}</td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center text-[rgb(35,40,44)]">{day?.totalBets || 0}</td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[rgb(35,40,44)] font-medium">{(day?.totalStake || 0).toFixed(2)}</td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[#00b98a] font-medium">{(day?.totalWon || 0).toFixed(2)}</td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[#dc3545] font-medium">{(day?.totalLost || 0).toFixed(2)}</td>
                        <td className={cn(
                          "border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold",
                          (day?.netPL || 0) >= 0 ? "text-[#00b98a]" : "text-[#dc3545]"
                        )}>
                          {(day?.netPL || 0).toFixed(2)}
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-gray-500 italic">
                          {(day?.commission || 0).toFixed(2)}
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
                {safeDailyData.length > 0 && grandTotal && (
                  <tfoot>
                    <tr className="bg-[#e4e5e6] font-bold">
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[rgb(35,40,44)]">Total:</td>
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center text-[rgb(35,40,44)]">{grandTotal.totalBets}</td>
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[rgb(35,40,44)]">{grandTotal.totalStake.toFixed(2)}</td>
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[#00b98a]">{grandTotal.totalWon.toFixed(2)}</td>
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[#dc3545]">{grandTotal.totalLost.toFixed(2)}</td>
                      <td className={cn(
                        "border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right",
                        grandTotal.netPL >= 0 ? "text-[#00b98a]" : "text-[#dc3545]"
                      )}>
                        {grandTotal.netPL.toFixed(2)}
                      </td>
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[rgb(35,40,44)] font-normal">
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
