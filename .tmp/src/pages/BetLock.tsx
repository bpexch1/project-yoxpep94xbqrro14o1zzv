import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Client } from "@/entities";
import { getClientSession } from "@/hooks/useClientAuth";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";
import { Lock, Unlock, Search, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function BetLock() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const session = getClientSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: downlineUsernames, isLoading: isLoadingDownline } = useDownlineUsernames(
    session?.username,
    session?.role
  );

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["bet-lock-clients", session?.username],
    queryFn: async () => {
      const allClients = await Client.list("-created_at", 1000);
      return allClients as any[];
    },
    enabled: !!session,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, betting_allowed }: { id: string; betting_allowed: boolean }) => {
      setLoadingIds((prev) => new Set(prev).add(id));
      try {
        await Client.update(id, { betting_allowed });
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet-lock-clients"] });
      toast({
        title: "Success",
        description: "Betting status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update betting status",
        variant: "destructive",
      });
    },
  });

  const bulkToggleMutation = useMutation({
    mutationFn: async ({ ids, betting_allowed }: { ids: string[]; betting_allowed: boolean }) => {
      // In a real app we might use bulkUpdate if available, 
      // but here we'll loop or use the batch API if comfortable.
      // EntityManager has batch().update()
      const updates = ids.map(id => ({ id, data: { betting_allowed } }));
      await (Client as any).batch().update(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet-lock-clients"] });
      toast({
        title: "Success",
        description: "Bulk betting status updated",
      });
    },
  });

  if (session?.role?.toLowerCase() === "client") {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-600">Clients cannot manage bet locks.</p>
      </div>
    );
  }

  const filteredClients = clients.filter((c) => {
    // 1. Role hierarchy: only show roles "below" current user or specific downline
    // If company/superadmin, downlineUsernames is null, show all except self
    const isDownline = downlineUsernames === null || downlineUsernames.includes(c.username);
    if (!isDownline) return false;
    if (c.username === session?.username) return false;

    // 2. Search query
    if (searchQuery && !c.username?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const allowedCount = filteredClients.filter(c => c.betting_allowed).length;
  const lockedCount = filteredClients.length - allowedCount;

  const handleBulkToggle = (allow: boolean) => {
    const ids = filteredClients.map(c => c.id);
    if (ids.length === 0) return;
    bulkToggleMutation.mutate({ ids, betting_allowed: allow });
  };

  return (
    <div className="p-4 bg-[#e9ecef] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Header Card */}
        <div className="bg-white border border-[#dee2e6] rounded-sm shadow-sm overflow-hidden">
          <div className="bg-[#ecf0f1] px-3 py-2 border-b border-[#dee2e6] flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[#254465]">
              <ShieldAlert className="w-4 h-4" />
              <span>Bet Lock Management</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkToggle(false)}
                className="bg-[#dc3545] hover:bg-[#c82333] text-white text-[11px] px-3 py-1 rounded-sm transition-colors flex items-center gap-1"
                disabled={bulkToggleMutation.isPending}
              >
                {bulkToggleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                Lock All Visible
              </button>
              <button
                onClick={() => handleBulkToggle(true)}
                className="bg-[#28a745] hover:bg-[#218838] text-white text-[11px] px-3 py-1 rounded-sm transition-colors flex items-center gap-1"
                disabled={bulkToggleMutation.isPending}
              >
                {bulkToggleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                Unlock All Visible
              </button>
            </div>
          </div>
          <div className="p-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search username..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-[#dee2e6] rounded focus:outline-none focus:ring-1 focus:ring-[#00ab81]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Summary Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-[#dee2e6] rounded-sm p-3 shadow-sm">
            <div className="text-xs text-gray-500 uppercase font-semibold">Total Clients</div>
            <div className="text-2xl font-bold text-[#254465]">{filteredClients.length}</div>
          </div>
          <div className="bg-[#28a745] rounded-sm p-3 shadow-sm text-white">
            <div className="text-xs opacity-80 uppercase font-semibold">Betting Allowed</div>
            <div className="text-2xl font-bold">{allowedCount}</div>
          </div>
          <div className="bg-[#dc3545] rounded-sm p-3 shadow-sm text-white">
            <div className="text-xs opacity-80 uppercase font-semibold">Betting Locked</div>
            <div className="text-2xl font-bold">{lockedCount}</div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-[#dee2e6] rounded-sm shadow-sm overflow-hidden">
          <div className="bg-[#ecf0f1] px-3 py-2 border-b border-[#dee2e6] flex items-center gap-2">
            <span className="font-bold text-[#254465]">Client List</span>
            <span className="text-[10px] bg-[#254465] text-white px-1.5 py-0.5 rounded-full">
              {filteredClients.length} found
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#254465] text-white border-b border-[#dee2e6]">
                <tr>
                  <th className="px-3 py-2 font-semibold">S.No</th>
                  <th className="px-3 py-2 font-semibold">Username</th>
                  <th className="px-3 py-2 font-semibold">Full Name</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold text-center">Status</th>
                  <th className="px-3 py-2 font-semibold text-center">Betting</th>
                  <th className="px-3 py-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dee2e6]">
                {isLoadingClients || isLoadingDownline ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading clients...
                    </td>
                  </tr>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client, index) => (
                    <tr key={client.id} className={cn(index % 2 === 0 ? "bg-white" : "bg-[#f8f9fa]", "hover:bg-[#f2f4f6] transition-colors")}>
                      <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                      <td className="px-3 py-2 font-bold text-[#254465]">{client.username}</td>
                      <td className="px-3 py-2 text-gray-700">{client.full_name || "-"}</td>
                      <td className="px-3 py-2 capitalize text-gray-600">{client.role}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          client.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        )}>
                          {client.status || "active"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center">
                          {client.betting_allowed ? (
                            <span className="bg-[#d4edda] text-[#155724] text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm border border-[#c3e6cb]">
                              <Unlock className="w-3 h-3" /> ALLOWED
                            </span>
                          ) : (
                            <span className="bg-[#f8d7da] text-[#721c24] text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm border border-[#f5c6cb]">
                              <Lock className="w-3 h-3" /> LOCKED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {loadingIds.has(client.id) ? (
                          <div className="flex justify-end pr-4">
                            <Loader2 className="w-4 h-4 animate-spin text-[#00ab81]" />
                          </div>
                        ) : client.betting_allowed ? (
                          <button
                            onClick={() => toggleMutation.mutate({ id: client.id, betting_allowed: false })}
                            className="bg-[#dc3545] hover:bg-[#c82333] text-white text-[11px] px-2.5 py-1 rounded shadow-sm transition-all flex items-center gap-1 ml-auto"
                          >
                            <Lock className="w-3 h-3" /> Lock Bet
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleMutation.mutate({ id: client.id, betting_allowed: true })}
                            className="bg-[#28a745] hover:bg-[#218838] text-white text-[11px] px-2.5 py-1 rounded shadow-sm transition-all flex items-center gap-1 ml-auto"
                          >
                            <Unlock className="w-3 h-3" /> Unlock Bet
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-gray-500 italic">
                      No clients found in your downline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
