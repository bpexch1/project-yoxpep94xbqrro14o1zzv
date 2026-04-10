import { useState, useMemo } from "react";
import { Plus, BookOpen, Pencil, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewUserModal } from "./NewUserModal";
import { EditClientModal } from "./EditClientModal";

interface ClientSummaryCardProps {
  clients: any[];
  isLoading: boolean;
}

export function ClientSummaryCard({ clients, isLoading }: ClientSummaryCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [showRealBalances, setShowRealBalances] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString();
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(
      (client) =>
        client.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const totals = useMemo(() => {
    return filteredClients.reduce(
      (acc, client) => ({
        credit_received: acc.credit_received + (client.credit_received || 0),
        credit_remaining: acc.credit_remaining + (client.credit_remaining || 0),
        cash: acc.cash + (client.cash || 0),
        pl_downline: acc.pl_downline + (client.pl_downline || 0),
      }),
      { credit_received: 0, credit_remaining: 0, cash: 0, pl_downline: 0 }
    );
  }, [filteredClients]);

  const handleLoadBalance = () => {
    setIsLoadingBalance(true);
    setTimeout(() => {
      setIsLoadingBalance(false);
      setShowRealBalances(true);
    }, 800);
  };

  return (
    <section className="bg-white rounded shadow-sm overflow-hidden border">
      <div className="bg-slate-50 px-4 py-2 border-b text-sm font-bold text-slate-800 flex justify-between items-center">
        <span>NomanSA8592 - Clients List {showRealBalances ? "" : "| Default"}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Table */}
        <div className="overflow-x-auto border rounded shadow-inner bg-slate-50/30">
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
              <tr className="font-bold bg-white">
                {showRealBalances ? (
                  <>
                    <td className="p-2 border-r text-emerald-600">{formatNumber(totals.credit_received)}</td>
                    <td className="p-2 border-r text-emerald-600">{formatNumber(totals.credit_remaining)}</td>
                    <td className="p-2 border-r text-emerald-600">{formatNumber(totals.cash)}</td>
                    <td className={cn("p-2", totals.pl_downline < 0 ? "text-red-500" : "text-emerald-600")}>
                      {formatNumber(totals.pl_downline)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border-r text-slate-400">0</td>
                    <td className="p-2 border-r text-slate-400">0</td>
                    <td className="p-2 border-r text-slate-400">0</td>
                    <td className="p-2 text-emerald-600">{clients.length}</td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsNewUserOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 text-[11px] font-bold px-3 rounded flex items-center gap-1 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> New User
          </button>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 text-[11px] font-bold px-3 rounded flex items-center gap-1 transition-all shadow-sm active:scale-95">
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          {[
            { label: "Cash / Credit", color: "bg-orange-500", icon: "C" },
            { label: "Edit", color: "bg-emerald-500", icon: <Pencil className="w-3 h-3" /> },
            { label: "Ledger", color: "bg-sky-500", icon: "L" },
            { label: "Active", color: "bg-emerald-600", icon: "A" },
            { label: "InActive", color: "border-2 border-red-500 text-red-500", icon: "D" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[9px]", item.color)}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex justify-end items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-gray-400">Search:</span>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-slate-200 rounded px-2 py-1 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white transition-all"
              placeholder="Username or Name..."
            />
          </div>
        </div>

        {/* Client Table */}
        <div className="overflow-x-auto border rounded-md shadow-sm">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-slate-700 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="p-2.5 border-r border-slate-600 w-8 text-center">#</th>
                <th className="p-2.5 border-r border-slate-600">Username</th>
                <th className="p-2.5 border-r border-slate-600">Role</th>
                <th className="p-2.5 border-r border-slate-600 text-right">Credit</th>
                <th className="p-2.5 border-r border-slate-600 text-right">Cash</th>
                <th className="p-2.5 border-r border-slate-600 text-right">P/L</th>
                <th className="p-2.5 border-r border-slate-600 text-center">Status</th>
                <th className="p-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="p-3 border-r last:border-r-0">
                        <div className="h-2.5 bg-slate-100 rounded-full w-12 mx-auto" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-medium bg-slate-50/20 italic">
                    No matching clients found
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, idx) => (
                  <tr key={client.id} className={cn("hover:bg-emerald-50/50 transition-colors group", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                    <td className="p-2.5 border-r border-slate-100 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="p-2.5 border-r border-slate-100 font-bold text-slate-700">{client.username}</td>
                    <td className="p-2.5 border-r border-slate-100">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-tighter",
                        client.role === "admin" ? "bg-purple-100 text-purple-700" :
                        client.role === "agent" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {client.role || "client"}
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-slate-100 text-right text-emerald-600 font-bold">
                      {formatNumber(client.credit_remaining)}
                    </td>
                    <td className="p-2.5 border-r border-slate-100 text-right font-medium text-slate-600">
                      {formatNumber(client.cash)}
                    </td>
                    <td className={cn(
                      "p-2.5 border-r border-slate-100 text-right font-bold",
                      (client.pl_downline || 0) < 0 ? "text-red-500" : "text-emerald-600"
                    )}>
                      {formatNumber(client.pl_downline)}
                    </td>
                    <td className="p-2.5 border-r border-slate-100 text-center">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-tighter",
                        client.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                      )}>
                        {client.status || "active"}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="w-5 h-5 bg-orange-500 hover:bg-orange-600 rounded flex items-center justify-center text-white font-bold text-[9px] transition-all hover:scale-110 active:scale-90">C</button>
                        <button
                          onClick={() => setEditingClient(client)}
                          className="w-5 h-5 bg-emerald-500 hover:bg-emerald-600 rounded flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button className="w-5 h-5 bg-sky-500 hover:bg-sky-600 rounded flex items-center justify-center text-white font-bold text-[9px] transition-all hover:scale-110 active:scale-90">L</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load Balance Section */}
      <div className="mt-2">
        <button
          onClick={handleLoadBalance}
          disabled={isLoadingBalance || showRealBalances}
          className="w-full bg-amber-400 hover:bg-amber-500 text-black font-black py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-80 transition-all uppercase tracking-[0.1em]"
        >
          {isLoadingBalance && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoadingBalance ? "Processing Balance..." : showRealBalances ? "All Balances Loaded" : "Load Balance Now"}
        </button>
        <div className="w-full h-1.5 bg-emerald-500 shadow-[0_-1px_4px_rgba(16,185,129,0.3)]" />
        <div className="flex items-center justify-center gap-2 py-2.5 bg-white border-t border-slate-100">
          <div className={cn("w-2 h-2 rounded-full transition-all duration-300", showRealBalances ? "bg-emerald-500 scale-125" : "bg-emerald-500")} />
          <div className="w-2 h-2 rounded-full bg-slate-200" />
          <div className="w-2 h-2 rounded-full bg-slate-200" />
        </div>
      </div>

      {/* Modals */}
      <NewUserModal isOpen={isNewUserOpen} onClose={() => setIsNewUserOpen(false)} />
      <EditClientModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
      />
    </section>
  );
}
