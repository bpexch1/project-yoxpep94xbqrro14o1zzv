import { useState, useMemo } from "react";
import { Plus, BookOpen, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewUserModal } from "./NewUserModal";

interface ClientSummaryCardProps {
  clients: any[];
  isLoading: boolean;
}

export function ClientSummaryCard({ clients, isLoading }: ClientSummaryCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [showRealBalances, setShowRealBalances] = useState(false);
  const [isLoadBalanceLoading, setIsLoadBalanceLoading] = useState(false);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const totalStats = useMemo(() => {
    return clients?.reduce(
      (acc, client) => ({
        credit_received: acc.credit_received + (client.credit_received || 0),
        credit_remaining: acc.credit_remaining + (client.credit_remaining || 0),
        cash: acc.cash + (client.cash || 0),
        pl_downline: acc.pl_downline + (client.pl_downline || 0),
      }),
      { credit_received: 0, credit_remaining: 0, cash: 0, pl_downline: 0 }
    );
  }, [clients]);

  const handleLoadBalance = () => {
    setIsLoadBalanceLoading(true);
    setTimeout(() => {
      setIsLoadBalanceLoading(false);
      setShowRealBalances(true);
    }, 800);
  };

  return (
    <section className="bg-white rounded shadow-sm overflow-hidden border">
      <div className="bg-slate-50 px-4 py-2 border-b text-sm font-bold text-slate-800">
        NomanSA8592 - Clients List {showRealBalances ? "" : "| Default"}
      </div>
      
      <div className="p-4 space-y-4">
        {/* Summary Table */}
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-700 font-bold uppercase">
                {showRealBalances ? (
                  <>
                    <th className="p-2 border-r whitespace-nowrap">Credit Received</th>
                    <th className="p-2 border-r whitespace-nowrap">Credit Remaining</th>
                    <th className="p-2 border-r whitespace-nowrap">Cash</th>
                    <th className="p-2 whitespace-nowrap">P/L Downline</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border-r whitespace-nowrap">Credit Remaining</th>
                    <th className="p-2 border-r whitespace-nowrap">Cash</th>
                    <th className="p-2 border-r whitespace-nowrap">P/L Downline</th>
                    <th className="p-2 whitespace-nowrap">Users</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold">
                {showRealBalances ? (
                  <>
                    <td className="p-2 border-r text-emerald-600">{formatNumber(totalStats?.credit_received || 0)}</td>
                    <td className="p-2 border-r text-emerald-600">{formatNumber(totalStats?.credit_remaining || 0)}</td>
                    <td className="p-2 border-r text-emerald-600">{formatNumber(totalStats?.cash || 0)}</td>
                    <td className={cn("p-2", (totalStats?.pl_downline || 0) < 0 ? "text-red-500" : "text-emerald-600")}>
                      {formatNumber(totalStats?.pl_downline || 0)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border-r text-emerald-600">0</td>
                    <td className="p-2 border-r text-emerald-600">0</td>
                    <td className="p-2 border-r text-emerald-600">0</td>
                    <td className="p-2 text-emerald-600">{clients.length}</td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Button 
            onClick={() => setIsNewUserModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 text-[11px] font-bold px-3 gap-1 rounded shadow-sm border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            New User
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 text-[11px] font-bold px-3 gap-1 rounded shadow-sm border-none">
            <BookOpen className="w-3.5 h-3.5" />
            Account Ledger
          </Button>
        </div>

        {/* Legend Row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-[10px]">C</div>
            <span className="text-[10px] font-bold text-gray-600">Cash / Credit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-white">
              <Pencil className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-gray-600">Edit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center text-white font-bold text-[10px]">L</div>
            <span className="text-[10px] font-bold text-gray-600">Ledger</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-[10px]">A</div>
            <span className="text-[10px] font-bold text-gray-600">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 border-2 border-red-500 rounded flex items-center justify-center text-red-500 font-bold text-[10px]">D</div>
            <span className="text-[10px] font-bold text-gray-600">InActive</span>
          </div>
        </div>

        {/* Search Input Row */}
        <div className="flex justify-end items-center gap-2 mt-6">
          <span className="text-xs font-medium text-gray-500">Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Load Balance Button & Extras */}
      <div className="mt-4">
        <button 
          onClick={handleLoadBalance}
          disabled={isLoadBalanceLoading || showRealBalances}
          className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-amber-200 text-black font-bold py-3 text-sm transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
        >
          {isLoadBalanceLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load Balance"
          )}
        </button>
        <div className="w-full h-1.5 bg-emerald-500"></div>
        <div className="flex items-center justify-center gap-1.5 py-2 bg-white">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        </div>
      </div>

      <NewUserModal isOpen={isNewUserModalOpen} onClose={() => setIsNewUserModalOpen(false)} />
    </section>
  );
}
