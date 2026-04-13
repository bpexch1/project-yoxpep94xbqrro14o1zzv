import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, Search } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { ClientSummaryCard } from "@/components/accounts/ClientSummaryCard";
import { getClientSession } from "@/hooks/useClientAuth";

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("Accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const session = getClientSession();

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: () => ClientEntity.list("-created_at"),
  });

  const handleSearch = () => {
    setSearchFilter(searchQuery);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f7] pb-16">
      <Header />
      
      <main className="px-0 pt-0 pb-8 max-w-[480px] mx-auto font-sans">
        <div className="h-2" />
        
        {/* Report Type card */}
        <div className="mx-2 mb-2">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Search Users Section */}
        <div className="mx-2 mb-2">
          <section className="bg-white border border-[#d5d8dc] rounded-none shadow-none">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#d5d8dc] bg-[#ecf0f1]">
              <Filter className="w-4 h-4 fill-[#2c3e50] text-[#2c3e50]" />
              <span className="font-bold text-[#2c3e50] text-sm">Search-Users</span>
            </div>
            <div className="p-4 flex gap-2">
              <input
                type="text"
                placeholder="Username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 border border-[#d5d8dc] rounded px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-[#16a085] text-[#2c3e50] bg-white"
              />
              <button 
                onClick={handleSearch}
                className="bg-[#16a085] text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-1.5 hover:bg-[#138d75] transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </section>
        </div>

        {/* Client List card */}
        <div className="mx-2">
          <ClientSummaryCard 
            clients={clients || []} 
            isLoading={isLoading} 
            username={session?.username || 'Admin'}
            searchFilter={searchFilter}
            onRefresh={refetch}
          />
        </div>
      </main>
    </div>
  );
}
