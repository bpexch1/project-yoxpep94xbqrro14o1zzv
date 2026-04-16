import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, Search, Loader2 } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { cn } from "@/lib/utils";

export default function FinalSheet() {
  const [activeTab, setActiveTab] = useState("Final Sheet");
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [searchTrigger, setSearchTrigger] = useState(0);
  
  const session = getClientSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [session, navigate]);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["final-sheet", session?.username, fromDate, toDate, searchTrigger],
    queryFn: async () => {
      if (!session) return [];
      
      let query = ClientEntity.query().sort("-created_at");
      
      // Ownership check: Only Company role sees all, others see only their direct downline
      if (session.role !== 'company') {
        query = query.where("parent_username", session.username);
      }
      
      return await query.exec();
    },
    enabled: !!session,
  });

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  const totals = clients?.reduce((acc, c) => ({
    creditReceived: acc.creditReceived + (c.credit_received || 0),
    creditRemaining: acc.creditRemaining + (c.credit_remaining || 0),
    cash: acc.cash + (c.cash || 0),
    plDownline: acc.plDownline + (c.pl_downline || 0),
    balanceUpline: acc.balanceUpline + (c.balance_upline || 0),
    netSettlement: acc.netSettlement + ((c.pl_downline || 0) + (c.balance_upline || 0)),
  }), { creditReceived: 0, creditRemaining: 0, cash: 0, plDownline: 0, balanceUpline: 0, netSettlement: 0 });

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
              <span className="font-bold text-[#2c3e50] text-sm">Settlement Period</span>
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
                Generate Sheet
              </button>
            </div>
          </section>
        </div>

        {/* Report Table */}
        <div className="mx-2">
          <section className="bg-white border border-[#d5d8dc] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-[#254465] text-white">
                    <th className="border border-[#1a3550] px-1 py-2 text-left">S.No</th>
                    <th className="border border-[#1a3550] px-1 py-2 text-left">User</th>
                    <th className="border border-[#1a3550] px-1 py-2 text-center">Role</th>
                    <th className="border border-[#1a3550] px-1 py-2 text-right">Cr. Rec</th>
                    <th className="border border-[#1a3550] px-1 py-2 text-right">Cash</th>
                    <th className="border border-[#1a3550] px-1 py-2 text-right">P&L Dn</th>
                    <th className="border border-[#1a3550] px-1 py-2 text-right">Bal Up</th>
                    <th className="border border-[#1a3550] px-1 py-2 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b181] mx-auto" />
                      </td>
                    </tr>
                  ) : clients && clients.length > 0 ? (
                    clients.map((c, i) => {
                      const net = (c.pl_downline || 0) + (c.balance_upline || 0);
                      return (
                        <tr key={c.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f4f6f7]")}>
                          <td className="border border-[#d5d8dc] px-1 py-1.5 text-gray-500">{i + 1}</td>
                          <td className="border border-[#d5d8dc] px-1 py-1.5 text-[#254465] font-bold truncate max-w-[60px]">
                            {c.username}
                          </td>
                          <td className="border border-[#d5d8dc] px-1 py-1.5 text-center text-gray-400 uppercase text-[8px]">
                            {c.role?.charAt(0)}
                          </td>
                          <td className="border border-[#d5d8dc] px-1 py-1.5 text-right font-medium">
                            {(c.credit_received || 0).toLocaleString()}
                          </td>
                          <td className="border border-[#d5d8dc] px-1 py-1.5 text-right font-medium">
                            {(c.cash || 0).toLocaleString()}
                          </td>
                          <td className={cn(
                            "border border-[#d5d8dc] px-1 py-1.5 text-right font-bold",
                            (c.pl_downline || 0) >= 0 ? "text-[#00b181]" : "text-[#e74c3c]"
                          )}>
                            {(c.pl_downline || 0).toLocaleString()}
                          </td>
                          <td className={cn(
                            "border border-[#d5d8dc] px-1 py-1.5 text-right font-bold",
                            (c.balance_upline || 0) >= 0 ? "text-[#00b181]" : "text-[#e74c3c]"
                          )}>
                            {(c.balance_upline || 0).toLocaleString()}
                          </td>
                          <td className={cn(
                            "border border-[#d5d8dc] px-1 py-1.5 text-right font-bold bg-gray-50",
                            net >= 0 ? "text-[#00b181]" : "text-[#e74c3c]"
                          )}>
                            {net.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500 italic">
                        No clients found.
                      </td>
                    </tr>
                  )}
                </tbody>
                {clients && clients.length > 0 && totals && (
                  <tfoot>
                    <tr className="bg-[#ecf0f1] font-bold text-[#2c3e50]">
                      <td colSpan={3} className="border border-[#d5d8dc] px-1 py-2 text-right uppercase text-[8px]">Total</td>
                      <td className="border border-[#d5d8dc] px-1 py-2 text-right">{totals.creditReceived.toLocaleString()}</td>
                      <td className="border border-[#d5d8dc] px-1 py-2 text-right">{totals.cash.toLocaleString()}</td>
                      <td className={cn(
                        "border border-[#d5d8dc] px-1 py-2 text-right",
                        totals.plDownline >= 0 ? "text-[#00b181]" : "text-[#e74c3c]"
                      )}>
                        {totals.plDownline.toLocaleString()}
                      </td>
                      <td className={cn(
                        "border border-[#d5d8dc] px-1 py-2 text-right",
                        totals.balanceUpline >= 0 ? "text-[#00b181]" : "text-[#e74c3c]"
                      )}>
                        {totals.balanceUpline.toLocaleString()}
                      </td>
                      <td className={cn(
                        "border border-[#d5d8dc] px-1 py-2 text-right bg-gray-200",
                        totals.netSettlement >= 0 ? "text-[#00b181]" : "text-[#e74c3c]"
                      )}>
                        {totals.netSettlement.toLocaleString()}
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
