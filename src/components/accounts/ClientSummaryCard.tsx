import { useState, useMemo } from "react";
import { Plus, BookOpen, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditClientModal } from "./EditClientModal";
import { useNavigate } from "react-router-dom";

interface ClientSummaryCardProps {
  clients: any[];
  isLoading: boolean;
}

export function ClientSummaryCard({ clients, isLoading }: ClientSummaryCardProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingClient, setEditingClient] = useState<any | null>(null);

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
        balance_upline: acc.balance_upline + (client.balance_upline || 0),
      }),
      { credit_received: 0, credit_remaining: 0, cash: 0, pl_downline: 0, balance_upline: 0 }
    );
  }, [filteredClients]);

  const getTypeLabel = (role: string) => {
    if (role === "supermaster" || role === "admin") return "SuperMaster";
    if (role === "client" || role === "bettor") return "Bettor";
    return role || "Bettor";
  };

  const total_credit = totals.credit_remaining.toLocaleString();
  const total_balance = totals.balance_upline.toLocaleString();

  return (
    <section className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      {/* Card title */}
      <div className="px-4 py-3 border-b border-gray-200">
        <span className="font-bold text-sm text-gray-900">
          NomanSA8592 - Clients List
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Table */}
        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Credit Received</th>
                <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Credit Remaining</th>
                <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">Cash</th>
                <th className="p-2 border-r border-gray-200 font-bold text-gray-800 whitespace-nowrap">P/L Downline</th>
                <th className="p-2 font-bold text-gray-800 whitespace-nowrap">Balance Upline</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="p-2 border-r border-gray-200 text-emerald-600 underline font-bold">{totals.credit_received.toLocaleString()}</td>
                <td className="p-2 border-r border-gray-200 text-emerald-600 underline font-bold">{totals.credit_remaining.toLocaleString()}</td>
                <td className={cn("p-2 border-r border-gray-200 font-bold", totals.cash < 0 ? "text-red-500" : "text-emerald-600")}>
                  {totals.cash.toLocaleString()}
                </td>
                <td className={cn("p-2 border-r border-gray-200 font-bold", totals.pl_downline < 0 ? "text-red-500" : "text-emerald-600")}>
                  {totals.pl_downline.toLocaleString()}
                </td>
                <td className={cn("p-2 font-bold", totals.balance_upline < 0 ? "text-red-500" : "text-emerald-600")}>
                  {totals.balance_upline.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Horizontal divider */}
        <div className="border-t border-gray-200" />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/accounts/create")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New User
          </button>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1 transition-colors">
            <BookOpen className="w-3.5 h-3.5" /> Account Ledger
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-orange-400 rounded flex items-center justify-center text-white font-bold text-[11px]">C</div>
              <span className="text-xs text-gray-700">Cash / Credit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-white">
                <Pencil className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-gray-700">Edit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-sky-400 rounded flex items-center justify-center text-white font-bold text-[11px]">L</div>
              <span className="text-xs text-gray-700">Ledger</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-white font-bold text-[11px]">A</div>
              <span className="text-xs text-gray-700">Active</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 border-2 border-red-400 rounded flex items-center justify-center text-red-400 font-bold text-[11px]">D</div>
            <span className="text-xs text-gray-700">InActive</span>
          </div>
        </div>

        {/* Search row */}
        <div className="flex flex-col items-center gap-1 pt-2">
          <span className="text-sm text-gray-700">Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-teal-500 text-center"
          />
        </div>
      </div>

      {/* Client Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-emerald-500 text-white font-bold">
              <td className="px-3 py-2 border-r border-emerald-400">Total</td>
              <td className="px-3 py-2 border-r border-emerald-400"></td>
              <td className="px-3 py-2 border-r border-emerald-400">{total_credit}</td>
              <td className="px-3 py-2">{total_balance}</td>
            </tr>
            <tr className="bg-white border-b border-gray-200 font-bold text-gray-800">
              <th className="px-3 py-2 border-r border-gray-200">Username</th>
              <th className="px-3 py-2 border-r border-gray-200">Type</th>
              <th className="px-3 py-2 border-r border-gray-200">Credit</th>
              <th className="px-3 py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500 text-xs">Loading clients...</td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500 text-xs">No data available in table</td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => (
                <tr key={client.id} className={cn("border-b border-gray-100", idx % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                  <td className="px-3 py-2 border-r border-gray-100 font-medium flex items-center gap-1">
                    <span className="text-emerald-600 underline cursor-pointer hover:text-emerald-700">{client.username}</span>
                    <div className="flex gap-0.5 ml-1">
                      <button className="w-4 h-4 bg-orange-400 rounded text-white font-bold text-[8px] flex items-center justify-center">C</button>
                      <button
                        onClick={() => setEditingClient(client)}
                        className="w-4 h-4 bg-emerald-500 rounded text-white flex items-center justify-center"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                      <button className="w-4 h-4 bg-sky-400 rounded text-white font-bold text-[8px] flex items-center justify-center">L</button>
                      <button
                        className={cn(
                          "w-4 h-4 rounded font-bold text-[8px] flex items-center justify-center",
                          client.status === "active" ? "bg-emerald-500 text-white" : "border border-red-400 text-red-400"
                        )}
                      >
                        {client.status === "active" ? "A" : "D"}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-r border-gray-100 text-gray-700">{getTypeLabel(client.role)}</td>
                  <td className="px-3 py-2 border-r border-gray-100 text-gray-700">{(client.credit_remaining || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-emerald-600 font-bold">{(client.balance_upline || 0).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
          Showing {filteredClients.length === 0 ? "0 to 0 of 0" : `1 to ${filteredClients.length} of ${filteredClients.length}`} entries
        </div>
      </div>

      <EditClientModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
      />
    </section>
  );
}
