import { useState } from "react";
import { Lock, Unlock, Search, Filter, Loader2, ShieldOff, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Client } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function BetLock() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["bet-lock-clients"],
    queryFn: () => Client.list("-created_at"),
  });

  const filteredClients = clients?.filter(c => 
    c.role !== 'company' &&
    (c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handleToggleLock = async (client: any) => {
    try {
      setIsUpdating(client.id);
      const newStatus = client.bet_lock ? false : true;
      await Client.update(client.id, { bet_lock: newStatus });
      toast({
        title: newStatus ? "Bets Locked" : "Bets Unlocked",
        description: `${client.username} ${newStatus ? 'can no longer' : 'can now'} place bets.`,
        variant: newStatus ? "destructive" : "default",
      });
      refetch();
    } catch (e) {
      console.error(e);
      toast({
        title: "Update Failed",
        description: "Could not change bet lock status.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleLockAll = async () => {
    if (!clients) return;
    try {
      setIsUpdating("all-lock");
      const adminClients = clients.filter(c => c.role !== 'company');
      await Promise.all(adminClients.map(c => Client.update(c.id, { bet_lock: true })));
      toast({ title: "All Locked", description: "All users have been locked from betting." });
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUnlockAll = async () => {
    if (!clients) return;
    try {
      setIsUpdating("all-unlock");
      const adminClients = clients.filter(c => c.role !== 'company');
      await Promise.all(adminClients.map(c => Client.update(c.id, { bet_lock: false })));
      toast({ title: "All Unlocked", description: "All users can now place bets." });
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#e9ecef] p-4 lg:p-6" style={{ fontFamily: "Roboto, sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-[#dee2e6] overflow-hidden">
          {/* Header */}
          <div className="bg-[#ecf0f1] px-6 py-4 border-b border-[#dee2e6] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#212529]" />
              <h1 className="text-lg font-bold text-[#212529]">Bet Lock Management</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleUnlockAll}
                disabled={!!isUpdating}
                className="bg-[#28a745] hover:bg-[#218838] text-white px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isUpdating === 'all-unlock' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                Unlock All
              </button>
              <button
                onClick={handleLockAll}
                disabled={!!isUpdating}
                className="bg-[#dc3545] hover:bg-[#c82333] text-white px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isUpdating === 'all-lock' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Lock All
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Search */}
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
              <input
                type="text"
                placeholder="Search by username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-[#dee2e6] rounded focus:outline-none focus:ring-1 focus:ring-[#3DCCC8]"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-[#dee2e6] rounded">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] text-[#212529] text-xs font-bold uppercase border-b border-[#dee2e6]">
                    <th className="px-4 py-3 text-left">Username</th>
                    <th className="px-4 py-3 text-left">Full Name</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-center">Bet Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <Loader2 className="w-8 h-8 text-[#3DCCC8] animate-spin mx-auto mb-2" />
                        <span className="font-bold text-[#6c757d]">Loading users...</span>
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center font-bold text-[#6c757d]">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="border-b border-[#dee2e6] hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-[#212529]">{client.username}</td>
                        <td className="px-4 py-3 text-[#6c757d]">{client.full_name}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            {client.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {client.bet_lock ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#dc3545] bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                              <ShieldOff className="w-3.5 h-3.5" />
                              LOCKED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#28a745] bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleLock(client)}
                            disabled={isUpdating === client.id}
                            className={cn(
                              "px-3 py-1.5 rounded text-xs font-bold transition-all min-w-[100px] flex items-center justify-center gap-2 mx-auto",
                              client.bet_lock 
                                ? "bg-[#28a745] hover:bg-[#218838] text-white" 
                                : "bg-[#dc3545] hover:bg-[#c82333] text-white"
                            )}
                          >
                            {isUpdating === client.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : client.bet_lock ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                UNLOCK
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                LOCK
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
