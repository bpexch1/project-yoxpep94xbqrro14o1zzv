import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Search, Plus, BookOpen, Pencil, CheckCircle, XCircle } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("Accounts");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => ClientEntity.list("-created_at"),
  });

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const totalStats = clients?.reduce(
    (acc, client) => ({
      credit_received: acc.credit_received + (client.credit_received || 0),
      credit_remaining: acc.credit_remaining + (client.credit_remaining || 0),
      cash: acc.cash + (client.cash || 0),
      pl_downline: acc.pl_downline + (client.pl_downline || 0),
      balance_upline: acc.balance_upline + (client.balance_upline || 0),
    }),
    { credit_received: 0, credit_remaining: 0, cash: 0, pl_downline: 0, balance_upline: 0 }
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <Header />
      <main className="p-4 max-w-6xl mx-auto space-y-4">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Search Users Section */}
        <section className="bg-white rounded shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Search className="w-4 h-4 text-slate-900 fill-slate-900" />
            Search-Users
          </div>
          <div className="p-4 flex gap-2">
            <input
              type="text"
              placeholder="Username"
              className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-1">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </section>

        {/* Clients List Section */}
        <section className="bg-white rounded shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b text-sm font-bold text-slate-800">
            NomanSA8592 - Clients List
          </div>
          
          <div className="p-4 space-y-4">
            {/* Stats Table */}
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-700 font-bold">
                    <th className="p-3 border-r whitespace-nowrap">Credit Received</th>
                    <th className="p-3 border-r whitespace-nowrap">Credit Remaining</th>
                    <th className="p-3 border-r whitespace-nowrap">Cash</th>
                    <th className="p-3 border-r whitespace-nowrap">P/L Downline</th>
                    <th className="p-3 whitespace-nowrap">Balance Upline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-bold">
                    <td className="p-3 border-r text-emerald-600">{formatNumber(totalStats?.credit_received || 0)}</td>
                    <td className="p-3 border-r text-emerald-600">{formatNumber(totalStats?.credit_remaining || 0)}</td>
                    <td className="p-3 border-r text-emerald-600">{formatNumber(totalStats?.cash || 0)}</td>
                    <td className={cn("p-3 border-r", (totalStats?.pl_downline || 0) < 0 ? "text-red-500" : "text-emerald-600")}>
                      {formatNumber(totalStats?.pl_downline || 0)}
                    </td>
                    <td className="p-3 text-emerald-600">{formatNumber(totalStats?.balance_upline || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm">
                New User
              </button>
              <button className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                Account Ledger
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-white">C</div>
                <span>Cash / Credit</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-white">
                  <Pencil className="w-3 h-3" />
                </div>
                <span>Edit</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-sky-500 rounded flex items-center justify-center text-white">L</div>
                <span>Ledger</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center text-white">
                  <CheckCircle className="w-3 h-3" />
                </div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 border border-red-500 rounded flex items-center justify-center text-red-500">
                  <XCircle className="w-3 h-3" />
                </div>
                <span>InActive</span>
              </div>
            </div>

            {/* List Table */}
            <div className="space-y-2 mt-6">
              <div className="flex justify-center items-center gap-2 text-xs">
                <span>Search:</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border rounded px-2 py-1 max-w-[150px]"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-600 font-bold uppercase tracking-wider">
                      <th className="p-3 border-r whitespace-nowrap">User Name</th>
                      <th className="p-3 border-r whitespace-nowrap">Credit Received</th>
                      <th className="p-3 border-r whitespace-nowrap">Credit Remaining</th>
                      <th className="p-3 border-r whitespace-nowrap">Cash</th>
                      <th className="p-3 border-r whitespace-nowrap">P/L Downline</th>
                      <th className="p-3 border-r whitespace-nowrap">Balance Upline</th>
                      <th className="p-3 whitespace-nowrap text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients?.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-3 border-r font-semibold">{client.username}</td>
                        <td className="p-3 border-r">{formatNumber(client.credit_received || 0)}</td>
                        <td className="p-3 border-r">{formatNumber(client.credit_remaining || 0)}</td>
                        <td className="p-3 border-r">{formatNumber(client.cash || 0)}</td>
                        <td className={cn("p-3 border-r", (client.pl_downline || 0) < 0 ? "text-red-500 font-bold" : "")}>
                          {formatNumber(client.pl_downline || 0)}
                        </td>
                        <td className="p-3 border-r">{formatNumber(client.balance_upline || 0)}</td>
                        <td className="p-3 flex items-center justify-center gap-1">
                          <button className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-[10px]">C</button>
                          <button className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-white">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center text-white text-[10px]">L</button>
                          <button className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white">
                            <CheckCircle className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {clients?.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No clients found. Click "New User" to add one.
                        </td>
                      </tr>
                    )}
                    {isLoading && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          Loading clients...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
