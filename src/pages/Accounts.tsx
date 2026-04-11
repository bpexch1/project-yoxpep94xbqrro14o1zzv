import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, Search } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { ClientSummaryCard } from "@/components/accounts/ClientSummaryCard";
import { SuperAdminSummary } from "@/components/accounts/SuperAdminSummary";

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("Accounts");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => ClientEntity.list("-created_at"),
  });

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <Header />
      
      <main className="p-4 space-y-3">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <SuperAdminSummary clients={clients || []} isLoading={isLoading} />

        {/* Search Users Section */}
        <section className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-slate-50 px-3 py-2 border-b flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-black fill-black" />
            Search-Users
          </div>
          <div className="p-3 flex gap-2">
            <input
              type="text"
              placeholder="Username"
              className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button className="bg-emerald-500 text-white px-6 py-2.5 rounded text-sm font-bold flex items-center gap-1.5 shadow-sm hover:bg-emerald-600 transition-colors">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </section>

        <ClientSummaryCard clients={clients || []} isLoading={isLoading} />
      </main>
    </div>
  );
}
