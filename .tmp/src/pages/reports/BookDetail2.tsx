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
        return date >= fromDate && date <= toDate;
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
    <div className="bg-[#e8e8e8] min-h-screen pb-16">
      <main className="px-0 pt-0 pb-8 max-w-5xl mx-auto font-sans">
        <div className="h-2" />
        
        <div className="mx-2 mb-2">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Date Filter Card */}
        <div className="mx-2 mb-2">
          <section className="bg-white border border-[#c8c8c8] rounded-none shadow-none">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#c8c8c8] bg-[#dcdcdc]">
              <Filter className="w-4 h-4 fill-[#2d2d2d] text-[#2d2d2d]" />
              <span className="font-bold text-[#2d2d2d] text-sm">Filters</span>
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
          <section className="bg-white border border-[#c8c8c8] overflow-hidden">
            <div className="bg-[#dcdcdc] border-b border-[#c8c8c8] px-3 py-2 flex items-center gap-2">
              <strong className="text-sm font-bold text-[#2d2d2d]">Book Detail 2</strong>
              <ExportButtons 
                data={exportData} 
                columns={exportColumns} 
                filename={`Book-Detail-2-${fromDate}-${toDate}`} 
                disabled={!bets?.length} 
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#254465] text-white">
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">S.No</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">Date</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">Match</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">Selection</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-center font-medium">Type</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Odds</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Stake</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">P&L</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b181] mx-auto" />
                      </td>
                    </tr>
                  ) : bets && bets.length > 0 ? (
                    bets.map((b, i) => (
                      <tr key={b.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f4f6f7]")}>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-700">{i + 1}</td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-700 whitespace-nowrap">
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-700 min-w-[120px] font-medium">
                          {b.match_title}
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-700">{b.selection}</td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-center">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold uppercase",
                            b.bet_type === "back" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"
                          )}>
                            {b.bet_type}
                          </span>
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-right font-medium text-gray-700">{b.odds}</td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-right font-medium text-gray-700">{b.stake}</td>
                        <td className={cn(
                          "border border-[#d5d8dc] px-2 py-1.5 text-right font-bold",
                          getPL(b) > 0 ? "text-[#00b181]" : getPL(b) < 0 ? "text-[#e74c3c]" : "text-gray-400"
                        )}>
                          {getPL(b) > 0 ? `+${getPL(b)}` : getPL(b)}
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-center">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                            b.status === "won" ? "bg-[#00b181] text-white" : 
                            b.status === "lost" ? "bg-[#e74c3c] text-white" : 
                            "bg-gray-200 text-gray-600"
                          )}>
                            {b.status}
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
                {bets && bets.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#ecf0f1] font-bold">
                      <td colSpan={6} className="border border-[#d5d8dc] px-2 py-2 text-right text-[#2c3e50]">Total:</td>
                      <td className="border border-[#d5d8dc] px-2 py-2 text-right text-[#2c3e50]">{totalStake.toFixed(2)}</td>
                      <td className={cn(
                        "border border-[#d5d8dc] px-2 py-2 text-right",
                        totalPL >= 0 ? "text-[#00b181]" : "text-[#e74c3c]"
                      )}>
                        {totalPL.toFixed(2)}
                      </td>
                      <td className="border border-[#d5d8dc] px-2 py-2"></td>
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
