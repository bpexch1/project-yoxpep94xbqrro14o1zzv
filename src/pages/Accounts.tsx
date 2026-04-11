import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, Search } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { ClientSummaryCard } from "@/components/accounts/ClientSummaryCard";

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("Accounts");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => ClientEntity.list("-created_at"),
  });

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <Header />
      
      <main className="p-4 max-w-4xl mx-auto space-y-4">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Search Users Section */}
        <section className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4 text-black fill-black" />
            Search-Users
          </div>
          <div className="p-4 flex gap-2">
            <input
              type="text"
              placeholder="Username"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button className="bg-emerald-500 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-1.5 shadow-sm hover:bg-emerald-600 transition-colors">
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
