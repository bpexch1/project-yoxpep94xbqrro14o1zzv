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
      if (!session) return [];
      
      let query = BetEntity.query().sort("-created_at");
      const safeDownlineUsernames = Array.isArray(downlineUsernames) ? downlineUsernames : [];
      
      // Ownership check: Only Company sees all
      if (downlineUsernames === null) {
        // Company role: sees all
      } else if (session.role === 'client') {
        query = query.where("user_email", session.username);
      } else {
        // Admin/Agent roles: see self + downline
        const allowedUsernames = [session.username, ...safeDownlineUsernames].filter(Boolean);
        query = query.in("user_email", allowedUsernames);
      }

      const all = await query.exec();
      const safeAll = Array.isArray(all) ? all : [];
      
      return safeAll.filter((b: any) => {
        if (!b?.created_at) return false;
        const date = b.created_at.split('T')[0];
        const dateMatch = date >= fromDate && date <= toDate;
        const userMatch = usernameFilter 
          ? b.user_email?.toLowerCase().includes(usernameFilter.toLowerCase()) 
          : true;
        
        return dateMatch && userMatch;
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

  // Safe array conversion for calculations
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
    <div className="bg-[#e8e8e8] min-h-screen pb-16">
      <main className="pt-0 pb-8 max-w-5xl mx-auto font-sans px-[5px]">
        <div className="h-2" />
        
        <div className="mb-2">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Filters Card */}
        <div className="mb-2">
          <section className="bg-white border border-[#c8c8c8] rounded-none shadow-none">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#dee2e6] bg-[#f8f9fa]">
              <Filter className="w-4 h-4 fill-[#212529] text-[#212529]" />
              <span className="font-bold text-[#212529] text-sm">Filters</span>
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
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Username</label>
                <input
                  type="text"
                  placeholder="Filter by user..."
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  className="w-full border border-[#d5d8dc] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#00b181]"
                />
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
        <div>
          <section className="bg-white border border-[#c8c8c8] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#dee2e6] px-3 py-2 flex items-center gap-2">
              <strong className="text-sm font-bold text-[#212529]">Daily Report</strong>
              <ExportButtons 
                data={exportData} 
                columns={exportColumns} 
                filename={`Daily-Report-${fromDate}-${toDate}`} 
                disabled={!safeBets.length} 
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#254465] text-white">
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">S.No</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">Date</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">User</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">Match</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-center font-medium">B/L</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Stake</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">P&L</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b181] mx-auto" />
                      </td>
                    </tr>
                  ) : safeBets.length > 0 ? (
                    safeBets.map((b: any, i) => (
                      <tr key={b?.id || i} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f8f9fa] hover:bg-gray-50 transition-colors")}>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-500">{i + 1}</td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-700 whitespace-nowrap">
                          {b?.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-[#254465] font-bold">
                          {b?.user_email ? b.user_email.split('@')[0] : "—"}
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-700 min-w-[100px]">
                          <div className="font-medium">{b?.match_title || "—"}</div>
                          <div className="text-[10px] text-gray-400 italic">{b?.selection || "—"}</div>
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-center">
                          <span className={cn(
                            "px-1 py-0.5 rounded text-[9px] font-bold uppercase",
                            b?.bet_type === "back" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"
                          )}>
                            {b?.bet_type ? b.bet_type.charAt(0) : "—"}
                          </span>
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-right font-medium text-gray-700">{b?.stake || 0}</td>
                        <td className={cn(
                          "border border-[#d5d8dc] px-2 py-1.5 text-right font-bold",
                          getPL(b) > 0 ? "text-[#00b181]" : getPL(b) < 0 ? "text-[#e74c3c]" : "text-gray-400"
                        )}>
                          {getPL(b).toFixed(2)}
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-center">
                          <span className={cn(
                            "w-2 h-2 rounded-full inline-block",
                            b?.status === "won" ? "bg-[#00b181]" : 
                            b?.status === "lost" ? "bg-[#e74c3c]" : 
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
                {safeBets.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#ecf0f1] font-bold text-[#2c3e50]">
                      <td colSpan={5} className="border border-[#d5d8dc] px-2 py-2 text-right uppercase text-[10px]">Grand Total</td>
                      <td className="border border-[#d5d8dc] px-2 py-2 text-right">{totalStake.toFixed(2)}</td>
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
