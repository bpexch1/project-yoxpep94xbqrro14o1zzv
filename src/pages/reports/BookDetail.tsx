import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, Search, Loader2, BookOpen } from "lucide-react";
import { Transaction as TransactionEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { cn } from "@/lib/utils";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";
import { ExportButtons } from "@/components/reports/ExportButtons";

export default function BookDetail() {
  const [activeTab, setActiveTab] = useState("Book Detail");
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

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", session?.username, fromDate, toDate, searchTrigger, usernameFilter, downlineUsernames],
    queryFn: async () => {
      if (!session || searchTrigger === 0) return [];
      
      let all: any[];
      const safeDownlineUsernames = Array.isArray(downlineUsernames) ? downlineUsernames : [];
      
      // If a specific username is filtered
      if (usernameFilter.trim() !== "") {
        // Still check if the user is allowed to see this client
        const isAllowed = downlineUsernames === null || (safeDownlineUsernames.includes(usernameFilter)) || usernameFilter === session.username;
        
        if (!isAllowed) {
          return [];
        }
        
        all = await TransactionEntity.query().where("client_username", usernameFilter).sort("-created_at").exec();
      } else {
        // No username filter, use default visibility logic
        if (downlineUsernames === null) {
          // Company role: see all transactions
          all = await TransactionEntity.query().sort("-created_at").exec();
        } else if (session.role === 'client') {
          all = await TransactionEntity.query().where("client_username", session.username).sort("-created_at").exec();
        } else {
          // Admin/agent: see downline transactions
          if (safeDownlineUsernames.length === 0) {
            // Also show own transactions
            all = await TransactionEntity.query().where("client_username", session.username).sort("-created_at").exec();
          } else {
            const allTxns = await TransactionEntity.query().sort("-created_at").exec();
            const allAllowed = [session.username, ...safeDownlineUsernames];
            const safeAllTxns = Array.isArray(allTxns) ? allTxns : [];
            all = safeAllTxns.filter((t: any) => allAllowed.includes(t?.client_username));
          }
        }
      }
      
      const safeAll = Array.isArray(all) ? all : [];
      // Filter by date range
      return safeAll.filter(t => {
        if (!t?.created_at) return false;
        const date = t.created_at.split('T')[0];
        return date >= fromDate && date <= toDate;
      }).reverse(); // Reverse to chronological for running balance calculation
    },
    enabled: !!session && downlineUsernames !== undefined && searchTrigger > 0,
  });

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Calculate running balance starting from the first transaction in the period
  let runningBalance = 0;
  const processedTransactions = safeTransactions.map((t) => {
    const amount = t?.amount || 0;
    const isCredit = amount > 0;
    const dr = isCredit ? 0 : Math.abs(amount);
    const cr = isCredit ? amount : 0;
    
    // Use the entity's recorded balance if present
    const balance = t?.after_balance !== undefined ? t.after_balance : (runningBalance += amount);
    
    return {
      ...t,
      dr,
      cr,
      balance
    };
  }).reverse(); // Back to reverse chronological for table display

  const safeProcessedTransactions = Array.isArray(processedTransactions) ? processedTransactions : [];

  const totalDr = safeProcessedTransactions.reduce((acc, t) => acc + (t?.dr || 0), 0) || 0;
  const totalCr = safeProcessedTransactions.reduce((acc, t) => acc + (t?.cr || 0), 0) || 0;

  const exportColumns = [
    { key: "sno", label: "S.No" },
    { key: "dateStr", label: "Date/Time" },
    { key: "description", label: "Description" },
    { key: "dr", label: "Dr" },
    { key: "cr", label: "Cr" },
    { key: "balance", label: "Balance" },
  ];

  const exportData = safeProcessedTransactions.map((t, i) => ({
    sno: i + 1,
    dateStr: t?.created_at ? new Date(t.created_at).toLocaleString() : "—",
    description: t?.description || "",
    dr: (t?.dr || 0).toFixed(2),
    cr: (t?.cr || 0).toFixed(2),
    balance: (t?.balance || 0).toFixed(2),
  }));

  const safeDownlineUsernames = Array.isArray(downlineUsernames) ? downlineUsernames : [];

  return (
    <div className="bg-[rgb(228,229,230)] min-h-screen pb-16 text-[rgb(35,40,44)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <main className="max-w-5xl mx-auto px-2 sm:px-3">
        <div className="h-2" />
        
        <div className="mt-2 mb-3">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Filters Card */}
        <div className="mb-3">
          <section className="bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="bg-[#f0f3f5] border-b border-[rgb(200,206,211)] px-3 py-2 flex items-center gap-2">
              <Filter className="w-4 h-4 fill-[rgb(35,40,44)] text-[rgb(35,40,44)]" />
              <strong className="text-[0.875rem] font-bold text-[rgb(35,40,44)]">Filters</strong>
            </div>
            <div className="p-3">
              {/* Row 1: Username */}
              <div className="mb-3">
                <label className="text-[11px] font-bold text-[#6c757d] uppercase mb-1 block">Client Username</label>
                <input
                  type="text"
                  placeholder="Enter username or leave blank for all"
                  list="downline-users-list"
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  className="w-full h-[34px] border border-[rgb(200,206,211)] rounded-[0.25rem] px-2.5 text-[0.875rem] focus:outline-none focus:border-[#00b98a] transition-colors"
                />
                <datalist id="downline-users-list">
                  {safeDownlineUsernames.map((name: string) => (
                    <option key={name} value={name} />
                  ))}
                  <option value={session?.username} />
                </datalist>
              </div>

              {/* Row 2: From/To Dates */}
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-[#6c757d] uppercase mb-1 block">From Date</label>
                  <input 
                    type="date" 
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)} 
                    className="w-full h-[34px] border border-[rgb(200,206,211)] rounded-[0.25rem] px-2.5 text-[0.875rem] focus:outline-none focus:border-[#00b98a] transition-colors" 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-[#6c757d] uppercase mb-1 block">To Date</label>
                  <input 
                    type="date" 
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)} 
                    className="w-full h-[34px] border border-[rgb(200,206,211)] rounded-[0.25rem] px-2.5 text-[0.875rem] focus:outline-none focus:border-[#00b98a] transition-colors" 
                  />
                </div>
              </div>

              {/* Get Report button */}
              <button
                onClick={handleSearch}
                className="w-full h-[34px] bg-[#00b98a] hover:bg-[#138a72] text-white text-[0.875rem] font-medium rounded-[0.2rem] flex items-center justify-center gap-2 transition-colors border border-[#00b98a]"
              >
                <Search className="w-4 h-4 stroke-[2.5]" /> Get Report
              </button>
            </div>
          </section>
        </div>

        {/* Results Card */}
        <div>
          <section className="bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="bg-[#f0f3f5] border-b border-[rgb(200,206,211)] px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[rgb(35,40,44)]" />
                <strong className="text-[0.875rem] font-bold text-[rgb(35,40,44)]">
                  {usernameFilter ? `${usernameFilter} — Book Detail` : "Book Detail"}
                </strong>
              </div>
              <ExportButtons 
                data={exportData} 
                columns={exportColumns} 
                filename={`Book-Detail-${fromDate}-${toDate}`} 
                disabled={!safeProcessedTransactions.length} 
              />
            </div>

            <div className="overflow-x-auto">
              <table className="table table-bordered table-striped table-sm mb-0 text-[0.875rem]">
                <thead>
                  <tr className="bg-[#f0f3f5] text-[rgb(35,40,44)]">
                    <th className="border border-[rgb(200,206,211)] px-3 py-2 text-left font-bold">S.No</th>
                    <th className="border border-[rgb(200,206,211)] px-3 py-2 text-left font-bold">Date/Time</th>
                    <th className="border border-[rgb(200,206,211)] px-3 py-2 text-left font-bold">Description</th>
                    <th className="border border-[rgb(200,206,211)] px-3 py-2 text-right font-bold">Dr</th>
                    <th className="border border-[rgb(200,206,211)] px-3 py-2 text-right font-bold">Cr</th>
                    <th className="border border-[rgb(200,206,211)] px-3 py-2 text-right font-bold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {searchTrigger === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-500 text-[0.875rem] italic">
                        Use the filters above and click <strong>Get Report</strong> to load data.
                      </td>
                    </tr>
                  ) : isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b98a] mx-auto" />
                      </td>
                    </tr>
                  ) : safeProcessedTransactions.length > 0 ? (
                    safeProcessedTransactions.map((t, i) => (
                      <tr key={t?.id || i} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f8f9fa]")}>
                        <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-gray-500">{i + 1}</td>
                        <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[rgb(35,40,44)]">
                          {t?.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}<br/>
                          <span className="text-[10px] text-gray-400">
                            {t?.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[rgb(35,40,44)] min-w-[150px]">{t?.description || "—"}</td>
                        <td className={cn("border border-[rgb(200,206,211)] px-3 py-1.5 text-right font-bold", (t?.dr || 0) > 0 ? "text-[#dc3545]" : "text-gray-400")}>
                          {(t?.dr || 0) > 0 ? (t?.dr || 0).toFixed(2) : "0.00"}
                        </td>
                        <td className={cn("border border-[rgb(200,206,211)] px-3 py-1.5 text-right font-bold", (t?.cr || 0) > 0 ? "text-[#00b98a]" : "text-gray-400")}>
                          {(t?.cr || 0) > 0 ? (t?.cr || 0).toFixed(2) : "0.00"}
                        </td>
                        <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-right font-bold text-[rgb(35,40,44)]">
                          {(t?.balance || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-500 text-[0.875rem] italic">
                        No records found for selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {safeProcessedTransactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#e4e5e6] font-bold">
                      <td colSpan={3} className="border border-[rgb(200,206,211)] px-3 py-2 text-right text-[rgb(35,40,44)]">Total:</td>
                      <td className="border border-[rgb(200,206,211)] px-3 py-2 text-right text-[#dc3545]">{totalDr.toFixed(2)}</td>
                      <td className="border border-[rgb(200,206,211)] px-3 py-2 text-right text-[#00b98a]">{totalCr.toFixed(2)}</td>
                      <td className="border border-[rgb(200,206,211)] px-3 py-2 text-right text-[rgb(35,40,44)]">
                        {(totalCr - totalDr).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {searchTrigger > 0 && !isLoading && (
              <div className="px-3 py-2 text-[11px] text-gray-500 bg-[#f8f9fa] border-t border-[rgb(200,206,211)]">
                Showing {safeProcessedTransactions.length} entries
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
