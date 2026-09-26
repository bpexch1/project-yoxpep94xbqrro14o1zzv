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

export default function DailyReport() {
  const [activeTab, setActiveTab] = useState("Daily Report");
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [usernameFilter, setUsernameFilter] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  
  const session = getClientSession();
  const navigate = useNavigate();
  const { data: downlineUsernames } = useDownlineUsernames(session?.username, session?.role);

  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [session, navigate]);

  const { data: bets, isLoading } = useQuery({
    queryKey: ["daily-report", session?.username, fromDate, toDate, usernameFilter, searchTrigger, downlineUsernames],
    queryFn: async () => {
      if (!session || downlineUsernames === undefined) return [];
      
      let query = BetEntity.query().sort("-created_at");
      
      // Ownership check: Only Company sees all
      if (downlineUsernames === null) {
        // Company role: sees all
      } else if (session.role === 'client') {
        query = query.where("user_email", session.username);
      } else {
        // Admin/Agent roles: see self + downline
        const allowedUsernames = [session.username, ...(downlineUsernames || [])];
        query = query.in("user_email", allowedUsernames);
      }

      const all = await query.exec();
      
      return all.filter(b => {
        const date = b.created_at.split('T')[0];
        const dateMatch = date >= fromDate && date <= toDate;
        const userMatch = usernameFilter ? b.user_email?.toLowerCase().includes(usernameFilter.toLowerCase()) : true;
        
        return dateMatch && userMatch;
      });
    },
    enabled: !!session && downlineUsernames !== undefined,
  });

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  const getPL = (bet: any) => {
    if (bet.status === "won") return bet.potential_win || 0;
    if (bet.status === "lost") return -(bet.stake || 0);
    return 0;
  };

  const totalStake = bets?.reduce((acc, b) => acc + (b.stake || 0), 0) || 0;
  const totalPL = bets?.reduce((acc, b) => acc + getPL(b), 0) || 0;

  const exportColumns = [
    { key: "sno", label: "S.No" },
    { key: "dateStr", label: "Date/Time" },
    { key: "client", label: "Client" },
    { key: "match_title", label: "Match" },
    { key: "selection", label: "Selection" },
    { key: "bet_type", label: "Type" },
    { key: "stake", label: "Stake" },
    { key: "pl", label: "P/L" },
    { key: "status", label: "Status" },
  ];

  const exportData = (bets || []).map((b, i) => ({
    sno: i + 1,
    dateStr: new Date(b.created_at).toLocaleString(),
    client: b.user_email || "",
    match_title: b.match_title || "",
    selection: b.selection || "",
    bet_type: b.bet_type || "",
    stake: (b.stake || 0).toFixed(2),
    pl: getPL(b).toFixed(2),
    status: b.status || "",
  }));

  return (
    <div className="bg-[rgb(228,229,230)] min-h-screen pb-16 text-[rgb(35,40,44)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <main className="pt-0 pb-8 max-w-5xl mx-auto px-2 sm:px-3">
        <div className="h-2" />
        
        <div className="mb-2">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Filters Card */}
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
              <div>
                <label className="text-[11px] text-[#6c757d] uppercase font-bold mb-1 block">Username</label>
                <input
                  type="text"
                  placeholder="Filter by user..."
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  className="w-full border border-[rgb(200,206,211)] rounded-[0.25rem] px-2.5 py-1.5 text-[0.875rem] focus:outline-none focus:border-[#00b98a]"
                />
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
              <strong className="text-[0.875rem] font-bold text-[rgb(35,40,44)]">Daily Report</strong>
              <ExportButtons 
                data={exportData} 
                columns={exportColumns} 
                filename={`Daily-Report-${fromDate}-${toDate}`} 
                disabled={!bets?.length} 
              />
            </div>
            <div className="overflow-x-auto">
              <table className="table table-bordered table-striped table-sm mb-0 text-[0.875rem]">
                <thead>
                  <tr className="bg-[#f0f3f5] text-[rgb(35,40,44)]">
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold">S.No</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold">Date</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold">User</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold">Match</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center font-bold">B/L</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold">Stake</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold">P&L</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b98a] mx-auto" />
                      </td>
                    </tr>
                  ) : bets && bets.length > 0 ? (
                    bets.map((b, i) => (
                      <tr key={b.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f8f9fa] hover:bg-gray-50 transition-colors")}>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-gray-500">{i + 1}</td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-[rgb(35,40,44)] whitespace-nowrap">
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-[#00b98a] font-bold">
                          {b.user_email?.split('@')[0]}
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-[rgb(35,40,44)] min-w-[100px]">
                          <div className="font-medium">{b.match_title}</div>
                          <div className="text-[10px] text-gray-400 italic">{b.selection}</div>
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center">
                          <span className={cn(
                            "px-1 py-0.5 rounded-[2px] text-[10px] font-bold uppercase",
                            b.bet_type === "back" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"
                          )}>
                            {b.bet_type?.charAt(0)}
                          </span>
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-medium text-[rgb(35,40,44)]">{b.stake}</td>
                        <td className={cn(
                          "border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold",
                          getPL(b) > 0 ? "text-[#00b98a]" : getPL(b) < 0 ? "text-[#dc3545]" : "text-gray-400"
                        )}>
                          {getPL(b).toFixed(2)}
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full inline-block",
                            b.status === "won" ? "bg-[#00b98a]" : 
                            b.status === "lost" ? "bg-[#dc3545]" : 
                            "bg-gray-300"
                          )} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500 italic">
                        No bets found.
                      </td>
                    </tr>
                  )}
                </tbody>
                {bets && bets.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#e4e5e6] font-bold text-[rgb(35,40,44)]">
                      <td colSpan={5} className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right uppercase text-[11px]">Grand Total</td>
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right">{totalStake.toFixed(2)}</td>
                      <td className={cn(
                        "border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right",
                        totalPL >= 0 ? "text-[#00b98a]" : "text-[#dc3545]"
                      )}>
                        {totalPL.toFixed(2)}
                      </td>
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5"></td>
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
