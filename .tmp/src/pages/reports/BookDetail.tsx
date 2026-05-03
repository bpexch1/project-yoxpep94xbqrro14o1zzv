import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, Search, Loader2, BookOpen } from "lucide-react";
import { Transaction as TransactionEntity, Client } from "@/entities";
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
      
      // If a specific username is filtered
      if (usernameFilter.trim() !== "") {
        // Still check if the user is allowed to see this client
        const isAllowed = downlineUsernames === null || (downlineUsernames && downlineUsernames.includes(usernameFilter)) || usernameFilter === session.username;
        
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
          if (!downlineUsernames || downlineUsernames.length === 0) {
            // Also show own transactions
            all = await TransactionEntity.query().where("client_username", session.username).sort("-created_at").exec();
          } else {
            const allTxns = await TransactionEntity.query().sort("-created_at").exec();
            const allAllowed = [session.username, ...downlineUsernames];
            all = allTxns.filter((t: any) => allAllowed.includes(t.client_username));
          }
        }
      }
      
      // Filter by date range
      return all.filter(t => {
        const date = t.created_at.split('T')[0];
        return date >= fromDate && date <= toDate;
      }).reverse(); // Reverse to chronological for running balance calculation
    },
    enabled: !!session && downlineUsernames !== undefined && searchTrigger > 0,
  });

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  // Calculate running balance starting from the first transaction in the period
  let runningBalance = 0;
  const processedTransactions = transactions?.map((t) => {
    const amount = t.amount || 0;
    const isCredit = amount > 0;
    const dr = isCredit ? 0 : Math.abs(amount);
    const cr = isCredit ? amount : 0;
    
    // Use the entity's recorded balance if present
    const balance = t.after_balance !== undefined ? t.after_balance : (runningBalance += amount);
    
    return {
      ...t,
      dr,
      cr,
      balance
    };
  }).reverse(); // Back to reverse chronological for table display

  const totalDr = processedTransactions?.reduce((acc, t) => acc + t.dr, 0) || 0;
  const totalCr = processedTransactions?.reduce((acc, t) => acc + t.cr, 0) || 0;

  const exportColumns = [
    { key: "sno", label: "S.No" },
    { key: "dateStr", label: "Date/Time" },
    { key: "description", label: "Description" },
    { key: "dr", label: "Dr" },
    { key: "cr", label: "Cr" },
    { key: "balance", label: "Balance" },
  ];

  const exportData = processedTransactions?.map((t, i) => ({
    sno: i + 1,
    dateStr: new Date(t.created_at).toLocaleString(),
    description: t.description || "",
    dr: t.dr.toFixed(2),
    cr: t.cr.toFixed(2),
    balance: t.balance.toFixed(2),
  })) || [];

  return (
    <div className="bg-[#e8e8e8] min-h-screen pb-16">
      <main className="max-w-5xl mx-auto font-sans px-[5px]">
        <div className="h-2" />
        
        <div className="mt-2 mb-3">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Filters Card */}
        <div className="mb-3">
          <section className="bg-white border border-[#c8c8c8] rounded-[4px] overflow-hidden shadow-sm">
            <div className="bg-[#dcdcdc] border-b border-[#c8c8c8] px-3 py-2 flex items-center gap-2">
              <Filter className="w-4 h-4 fill-[#2d2d2d] text-[#2d2d2d]" />
              <strong className="text-sm font-bold text-[#2d2d2d]">Filters</strong>
            </div>
            <div className="p-3">
              {/* Row 1: Username */}
              <div className="mb-3">
                <label className="text-[11px] font-bold text-[#555] uppercase mb-1 block">Client Username</label>
                <input
                  type="text"
                  placeholder="Enter username or leave blank for all"
                  list="downline-users-list"
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  className="w-full h-[32px] border border-[#ced4da] rounded px-2 text-[13px] focus:outline-none focus:border-[#1a9e71] transition-colors"
                />
                <datalist id="downline-users-list">
                  {downlineUsernames?.map((name: string) => (
                    <option key={name} value={name} />
                  ))}
                  <option value={session?.username} />
                </datalist>
              </div>

              {/* Row 2: From/To Dates */}
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-[#555] uppercase mb-1 block">From Date</label>
                  <input 
                    type="date" 
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)} 
                    className="w-full h-[32px] border border-[#ced4da] rounded px-2 text-[13px] focus:outline-none focus:border-[#1a9e71] transition-colors" 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-[#555] uppercase mb-1 block">To Date</label>
                  <input 
                    type="date" 
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)} 
                    className="w-full h-[32px] border border-[#ced4da] rounded px-2 text-[13px] focus:outline-none focus:border-[#1a9e71] transition-colors" 
                  />
                </div>
              </div>

              {/* Get Report button */}
              <button
                onClick={handleSearch}
                className="w-full h-[34px] bg-[#1a9e71] hover:bg-[#158a60] text-white text-[13px] font-bold rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Search className="w-4 h-4" /> Get Report
              </button>
            </div>
          </section>
        </div>

        {/* Results Card */}
        <div>
          <section className="bg-white border border-[#c8c8c8] rounded-[4px] overflow-hidden shadow-sm">
            <div className="bg-[#dcdcdc] border-b border-[#c8c8c8] px-3 py-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2d2d2d]" />
              <strong className="text-sm font-bold text-[#2d2d2d]">
                {usernameFilter ? `${usernameFilter} — Book Detail` : "Book Detail"}
              </strong>
              <ExportButtons 
                data={exportData} 
                columns={exportColumns} 
                filename={`Book-Detail-${fromDate}-${toDate}`} 
                disabled={!processedTransactions?.length} 
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[#254465] text-white">
                    <th className="border border-[#1a3550] px-3 py-2 text-left font-medium">S.No</th>
                    <th className="border border-[#1a3550] px-3 py-2 text-left font-medium">Date/Time</th>
                    <th className="border border-[#1a3550] px-3 py-2 text-left font-medium">Description</th>
                    <th className="border border-[#1a3550] px-3 py-2 text-right font-medium">Dr</th>
                    <th className="border border-[#1a3550] px-3 py-2 text-right font-medium">Cr</th>
                    <th className="border border-[#1a3550] px-3 py-2 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {searchTrigger === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#888] text-[13px] italic">
                        Use the filters above and click <strong>Get Report</strong> to load data.
                      </td>
                    </tr>
                  ) : isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#1a9e71] mx-auto" />
                      </td>
                    </tr>
                  ) : processedTransactions && processedTransactions.length > 0 ? (
                    processedTransactions.map((t, i) => (
                      <tr key={t.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f8f9fa]")}>
                        <td className="border border-[#dee2e6] px-3 py-1.5 text-[#495057]">{i + 1}</td>
                        <td className="border border-[#dee2e6] px-3 py-1.5 text-[#495057]">
                          {new Date(t.created_at).toLocaleDateString()}<br/>
                          <span className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="border border-[#dee2e6] px-3 py-1.5 text-[#495057] min-w-[150px]">{t.description}</td>
                        <td className={cn("border border-[#dee2e6] px-3 py-1.5 text-right font-bold", t.dr > 0 ? "text-[#e74c3c]" : "text-gray-400")}>
                          {t.dr > 0 ? t.dr.toFixed(2) : "0.00"}
                        </td>
                        <td className={cn("border border-[#dee2e6] px-3 py-1.5 text-right font-bold", t.cr > 0 ? "text-[#1a9e71]" : "text-gray-400")}>
                          {t.cr > 0 ? t.cr.toFixed(2) : "0.00"}
                        </td>
                        <td className="border border-[#dee2e6] px-3 py-1.5 text-right font-bold text-[#254465]">
                          {t.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#888] text-[13px] italic">
                        No records found for selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {processedTransactions && processedTransactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#ecf0f1] font-bold">
                      <td colSpan={3} className="border border-[#dee2e6] px-3 py-2 text-right text-[#2c3e50]">Total:</td>
                      <td className="border border-[#dee2e6] px-3 py-2 text-right text-[#e74c3c]">{totalDr.toFixed(2)}</td>
                      <td className="border border-[#dee2e6] px-3 py-2 text-right text-[#1a9e71]">{totalCr.toFixed(2)}</td>
                      <td className="border border-[#dee2e6] px-3 py-2 text-right text-[#254465]">
                        {(totalCr - totalDr).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {searchTrigger > 0 && !isLoading && (
              <div className="px-3 py-2 text-[11px] text-[#555] bg-[#f8f9fa] border-t border-[#d0d0d0]">
                Showing {processedTransactions?.length || 0} entries
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
