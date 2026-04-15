import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/login");
    }

    // One-time fix: update Book account role to "company"
    async function fixBookRole() {
      try {
        const results = await ClientEntity.filter({ username: "Book" }, "-created_at", 1);
        if (results && results.length > 0) {
          const book = results[0];
          if (book.role === "superadmin") {
            console.log("Updating Book role to company...");
            await ClientEntity.update(book.id, { role: "company" });
          }
        }
      } catch (e) {
        console.error("Book role fix error:", e);
      }
    }
    fixBookRole();
  }, [session, navigate]);

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients", session?.username],
    queryFn: () => {
      if (!session) return [];
      const role = session.role?.toLowerCase();
      
      if (role === 'superadmin' || role === 'company') {
        // Show all clients
        return ClientEntity.list("-created_at");
      }
      if (role === 'admin' || role === 'supermaster' || role === 'agent') {
        // Show only their direct downline
        return ClientEntity.filter({ parent_username: session.username }, "-created_at");
      }
      // Regular clients see nobody (or only their own record)
      return ClientEntity.filter({ parent_username: session.username }, "-created_at");
    },
    enabled: !!session,
  });

  const handleSearch = () => {
    setSearchFilter(searchQuery);
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <main className="max-w-2xl mx-auto px-3 pt-4 pb-16 font-sans">
        
        {/* Report Type card */}
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Search Users Section */}
        <div className="bg-white border border-[#d0d0d0] rounded-xl shadow-sm mb-4 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#d0d0d0]">
            <Filter className="w-4 h-4 fill-[#2c3e50] text-[#2c3e50]" />
            <span className="font-bold text-[#2c3e50] text-base">Search-Users</span>
          </div>
          <div className="p-4 flex gap-2">
            <input
              type="text"
              placeholder="Username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border-2 border-[#d0d0d0] rounded-lg px-4 py-3 text-base placeholder-gray-400 focus:outline-none focus:border-[#26bebe] text-[#2c3e50] bg-white"
            />
            <button 
              onClick={handleSearch}
              className="bg-[#1a9e71] hover:bg-[#158c61] text-white px-5 py-3 rounded-lg font-medium flex items-center gap-2 text-[15px] transition-colors"
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </div>
        </div>

        {/* Username Header Card */}
        <div className="bg-white border border-[#d0d0d0] rounded-xl shadow-sm mb-4 px-5 py-4">
          <h2 className="font-bold text-[#2c3e50] text-lg">
            {session?.username || 'Admin'} - Clients List
          </h2>
        </div>

        {/* Client List card */}
        <ClientSummaryCard 
          clients={clients || []} 
          isLoading={isLoading} 
          username={session?.username || 'Admin'}
          searchFilter={searchFilter}
          onRefresh={refetch}
          hideHeader={true} // We'll add this prop to ClientSummaryCard
        />
      </main>
    </div>
  );
}
