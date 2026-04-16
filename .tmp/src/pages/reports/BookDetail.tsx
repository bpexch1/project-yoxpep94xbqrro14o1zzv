import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, Search, Loader2 } from "lucide-react";
import { Transaction as TransactionEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { cn } from "@/lib/utils";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";

export default function BookDetail() {
  const [activeTab, setActiveTab] = useState("Book Detail");
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

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", session?.username, fromDate, toDate, searchTrigger, downlineUsernames],
    queryFn: async () => {
      if (!session) return [];
      
      let all: any[];
      if (downlineUsernames === null) {
        // SuperAdmin/Company: see all transactions
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
      
      // Filter by date range
      return all.filter(t => {
        const date = t.created_at.split('T')[0];
        return date >= fromDate && date <= toDate;
      }).reverse(); // Reverse to chronological for running balance calculation
    },
    enabled: !!session && downlineUsernames !== undefined,
  });

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  // Calculate running balance starting from the first transaction in the period
  let runningBalance = 0;
  const processedTransactions = transactions?.map((t, index) => {
    // In a real system, the balance would be cumulative. 
    // Here we use the before/after balance from the entity if available.
    // If not, we simulate.
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

  return (
    <div className="bg-[#f4f6f7] pb-16">
      <main className="px-0 pt-0 pb-8 max-w-5xl mx-auto font-sans">
        <div className="h-2" />
        
        <div className="mx-4 mb-3">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Date Filter Card */}
        <div className="mx-4 mb-3">
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
        <div className="mx-4">
          <section className="bg-white border border-[#d5d8dc] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#254465] text-white">
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">S.No</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">Date/Time</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-left font-medium">Description</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Dr</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Cr</th>
                    <th className="border border-[#1a3550] px-2 py-2 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b181] mx-auto" />
                      </td>
                    </tr>
                  ) : processedTransactions && processedTransactions.length > 0 ? (
                    processedTransactions.map((t, i) => (
                      <tr key={t.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f4f6f7]")}>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-700">{i + 1}</td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-700">
                          {new Date(t.created_at).toLocaleDateString()}<br/>
                          <span className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-gray-700 min-w-[100px]">{t.description}</td>
                        <td className={cn("border border-[#d5d8dc] px-2 py-1.5 text-right font-bold", t.dr > 0 ? "text-[#e74c3c]" : "text-gray-400")}>
                          {t.dr > 0 ? t.dr.toFixed(2) : "0.00"}
                        </td>
                        <td className={cn("border border-[#d5d8dc] px-2 py-1.5 text-right font-bold", t.cr > 0 ? "text-[#00b181]" : "text-gray-400")}>
                          {t.cr > 0 ? t.cr.toFixed(2) : "0.00"}
                        </td>
                        <td className="border border-[#d5d8dc] px-2 py-1.5 text-right font-bold text-[#254465]">
                          {t.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 italic">
                        No records found for selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {processedTransactions && processedTransactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#ecf0f1] font-bold">
                      <td colSpan={3} className="border border-[#d5d8dc] px-2 py-2 text-right text-[#2c3e50]">Total:</td>
                      <td className="border border-[#d5d8dc] px-2 py-2 text-right text-[#e74c3c]">{totalDr.toFixed(2)}</td>
                      <td className="border border-[#d5d8dc] px-2 py-2 text-right text-[#00b181]">{totalCr.toFixed(2)}</td>
                      <td className="border border-[#d5d8dc] px-2 py-2 text-right text-[#254465]">
                        {(totalCr - totalDr).toFixed(2)}
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
