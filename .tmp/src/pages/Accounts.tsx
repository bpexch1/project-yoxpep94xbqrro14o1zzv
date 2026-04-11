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
    <div className="min-h-screen bg-[#ECEFF1] pb-16">
      <Header />
      
      <main className="px-0 pt-0 pb-8 max-w-[480px] mx-auto">
        <div className="h-2" />
        
        {/* Report Type card */}
        <div className="mx-2 mb-2">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Search Users Section */}
        <div className="mx-2 mb-2">
          <section className="bg-white border border-[#E0E0E0] rounded-none shadow-none">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E0E0E0]">
              <Filter className="w-4 h-4 fill-black text-black" />
              <span className="font-bold text-black text-sm">Search-Users</span>
            </div>
            <div className="p-4 flex gap-2">
              <input
                type="text"
                placeholder="Username"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-[#26A69A]"
              />
              <button className="bg-[#43A047] text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-1.5 hover:bg-[#388E3C] transition-colors shadow-sm">
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </section>
        </div>

        {/* Client List card */}
        <div className="mx-2">
          <ClientSummaryCard clients={clients || []} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
