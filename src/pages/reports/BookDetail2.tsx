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

export default function BookDetail2() {
  const [activeTab, setActiveTab] = useState("Book Detail 2");
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

  const { data: bets, isLoading } = useQuery({
    queryKey: ["bets-detail-2", session?.username, fromDate, toDate, searchTrigger, downlineUsernames],
    queryFn: async () => {
      if (!session || downlineUsernames === undefined) return [];
      
      let query = BetEntity.query().sort("-created_at");
      const safeDownlineUsernames = Array.isArray(downlineUsernames) ? downlineUsernames : [];
      
      // Ownership check: Only Company sees all
      if (downlineUsernames === null) {
        // Company role: sees all
      } else if (session.role === 'client') {
        query = query.where("user_email", session.username);
      } else {
        // Admin/Agent roles: see self + downline
        const allowedUsernames = [session.username, ...safeDownlineUsernames];
        query = query.in("user_email", allowedUsernames);
      }
      
      const all = await query.exec();
      const safeAll = Array.isArray(all) ? all : [];
      
      return safeAll.filter(b => {
        if (!b?.created_at) return false;
        const date = b.created_at.split('T')[0];
        return date >= fromDate && date <= toDate;
      });
    },
    enabled: !!session && downlineUsernames !== undefined,
  });

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  const getPL = (bet: any) => {
    if (!bet) return 0;
    if (bet.status === "won") return bet.potential_win || 0;
    if (bet.status === "lost") return -(bet.stake || 0);
    return 0;
  };

  // Safe array conversion for reduce and map functions
  const safeBets = Array.isArray(bets) ? bets : [];

  const totalStake = safeBets.reduce((acc, b) => acc + (b?.stake || 0), 0) || 0;
  const totalPL = safeBets.reduce((acc, b) => acc + getPL(b), 0) || 0;

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

  const exportData = safeBets.map((b, i) => ({
    sno: i + 1,
    dateStr: b?.created_at ? new Date(b.created_at).toLocaleString() : "—",
    client: b?.user_email || "",
    match_title: b?.match_title || "",
    selection: b?.selection || "",
    bet_type: b?.bet_type || "",
    stake: (b?.stake || 0).toFixed(2),
    pl: getPL(b).toFixed(2),
    status: b?.status || "",
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
              <strong className="text-[0.875rem] font-bold text-[rgb(35,40,44)]">Book Detail 2</strong>
              <ExportButtons 
                data={exportData} 
                columns={exportColumns} 
                filename={`Book-Detail-2-${fromDate}-${toDate}`} 
                disabled={!safeBets.length} 
              />
            </div>
            <div className="overflow-x-auto">
              <table className="table table-bordered table-striped table-sm mb-0 text-[0.875rem]">
                <thead>
                  <tr className="bg-[#f0f3f5] text-[rgb(35,40,44)]">
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold">S.No</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold">Date</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold">Match</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold">Selection</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center font-bold">Type</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold">Odds</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold">Stake</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold">P&L</th>
                    <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b98a] mx-auto" />
                      </td>
                    </tr>
                  ) : safeBets.length > 0 ? (
                    safeBets.map((b, i) => (
                      <tr key={b?.id || i} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f8f9fa]")}>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-gray-500">{i + 1}</td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-[rgb(35,40,44)] whitespace-nowrap">
                          {b?.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-[rgb(35,40,44)] min-w-[120px] font-medium">
                          {b?.match_title || "—"}
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-[rgb(35,40,44)]">{b?.selection || "—"}</td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold uppercase",
                            b?.bet_type === "back" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"
                          )}>
                            {b?.bet_type || "—"}
                          </span>
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-medium text-[rgb(35,40,44)]">{b?.odds || 0}</td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-medium text-[rgb(35,40,44)]">{b?.stake || 0}</td>
                        <td className={cn(
                          "border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold",
                          getPL(b) > 0 ? "text-[#00b98a]" : getPL(b) < 0 ? "text-[#dc3545]" : "text-gray-400"
                        )}>
                          {getPL(b) > 0 ? `+${getPL(b).toFixed(2)}` : getPL(b).toFixed(2)}
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-center">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                            b?.status === "won" ? "bg-[#00b98a] text-white" : 
                            b?.status === "lost" ? "bg-[#dc3545] text-white" : 
                            "bg-gray-200 text-gray-600"
                          )}>
                            {b?.status || "—"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500 italic">
                        No bets found for selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {safeBets.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#e4e5e6] font-bold">
                      <td colSpan={6} className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[rgb(35,40,44)]">Total:</td>
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[rgb(35,40,44)]">{totalStake.toFixed(2)}</td>
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
