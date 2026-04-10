import { useState, useMemo } from "react";
import { Plus, BookOpen, Pencil, Loader2, Users, Search, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewUserModal } from "./NewUserModal";
import { EditClientModal } from "./EditClientModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ClientSummaryCardProps {
  clients: any[];
  isLoading: boolean;
}

export function ClientSummaryCard({ clients, isLoading }: ClientSummaryCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [showRealBalances, setShowRealBalances] = useState(false);
  const [isLoadBalanceLoading, setIsLoadBalanceLoading] = useState(false);

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString();
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchQuery) return clients;
    
    const query = searchQuery.toLowerCase();
    return clients.filter(client => 
      (client.username?.toLowerCase().includes(query)) || 
      (client.full_name?.toLowerCase().includes(query))
    );
  }, [clients, searchQuery]);

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

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none px-1.5 py-0 text-[9px] uppercase font-bold">Admin</Badge>;
      case 'agent':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-1.5 py-0 text-[9px] uppercase font-bold">Agent</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-1.5 py-0 text-[9px] uppercase font-bold">Client</Badge>;
    }
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
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded pl-7 pr-2 py-1 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Username or name..."
            />
          </div>
        </div>

        {/* Client List Table */}
        <div className="overflow-x-auto border rounded mt-4">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-700 text-white font-bold uppercase">
              <tr>
                <th className="p-2 border-r border-slate-600 w-8">#</th>
                <th className="p-2 border-r border-slate-600">Username</th>
                <th className="p-2 border-r border-slate-600">Role</th>
                <th className="p-2 border-r border-slate-600">Credit</th>
                <th className="p-2 border-r border-slate-600">Cash</th>
                <th className="p-2 border-r border-slate-600">P/L</th>
                <th className="p-2 border-r border-slate-600">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-2 border-r border-slate-100"><Skeleton className="h-3 w-4" /></td>
                    <td className="p-2 border-r border-slate-100"><Skeleton className="h-3 w-20" /></td>
                    <td className="p-2 border-r border-slate-100"><Skeleton className="h-4 w-12" /></td>
                    <td className="p-2 border-r border-slate-100"><Skeleton className="h-3 w-16" /></td>
                    <td className="p-2 border-r border-slate-100"><Skeleton className="h-3 w-12" /></td>
                    <td className="p-2 border-r border-slate-100"><Skeleton className="h-3 w-12" /></td>
                    <td className="p-2 border-r border-slate-100"><Skeleton className="h-4 w-12" /></td>
                    <td className="p-2"><Skeleton className="h-6 w-20" /></td>
                  </tr>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client, index) => (
                  <tr 
                    key={client.id} 
                    className={cn(
                      "border-b border-slate-100 transition-colors hover:bg-emerald-50/50",
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    )}
                  >
                    <td className="p-2 border-r border-slate-100 text-slate-400">{index + 1}</td>
                    <td className="p-2 border-r border-slate-100">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{client.username}</span>
                        <span className="text-[9px] text-slate-400">{client.full_name}</span>
                      </div>
                    </td>
                    <td className="p-2 border-r border-slate-100">{getRoleBadge(client.role)}</td>
                    <td className={cn(
                      "p-2 border-r border-slate-100 font-bold",
                      (client.credit_remaining || 0) < 0 ? "text-red-500" : "text-emerald-600"
                    )}>
                      {formatNumber(client.credit_remaining)}
                    </td>
                    <td className="p-2 border-r border-slate-100 font-medium text-slate-600">
                      {formatNumber(client.cash)}
                    </td>
                    <td className={cn(
                      "p-2 border-r border-slate-100 font-bold",
                      (client.pl_downline || 0) < 0 ? "text-red-500" : "text-emerald-600"
                    )}>
                      {formatNumber(client.pl_downline)}
                    </td>
                    <td className="p-2 border-r border-slate-100">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                        client.status === 'active' 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        <div className={cn("w-1 h-1 rounded-full", client.status === 'active' ? "bg-emerald-500" : "bg-red-500")} />
                        {client.status || 'Active'}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <button className="w-6 h-6 bg-orange-500 hover:bg-orange-600 rounded flex items-center justify-center text-white font-bold text-[10px] shadow-sm transition-colors">C</button>
                        <button 
                          onClick={() => setEditingClient(client)}
                          className="w-6 h-6 bg-emerald-500 hover:bg-emerald-600 rounded flex items-center justify-center text-white shadow-sm transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button className="w-6 h-6 bg-sky-500 hover:bg-sky-600 rounded flex items-center justify-center text-white font-bold text-[10px] shadow-sm transition-colors">L</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                // Empty State
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-slate-200" />
                      <p className="text-xs font-medium">No clients found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
      <EditClientModal 
        isOpen={!!editingClient} 
        onClose={() => setEditingClient(null)} 
        client={editingClient} 
      />
    </section>
  );
}
