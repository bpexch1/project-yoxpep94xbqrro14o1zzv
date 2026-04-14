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
    <div className="bg-[#f0f0f0] min-h-screen pb-16">
      <main className="px-0 pt-0 pb-8 max-w-5xl mx-auto font-sans">
        <div className="h-3" />
        
        {/* Report Type card */}
        <div className="mx-3 mb-3">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Search Users Section */}
        <div className="mx-3 mb-3">
          <section className="bg-white border border-[#d5d8dc] rounded-lg shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#d5d8dc] bg-[#f0f0f0]">
              <Filter className="w-4 h-4 fill-[#333333] text-[#333333]" />
              <span className="font-bold text-[#2c3e50] text-sm">Search-Users</span>
            </div>
            <div className="flex gap-2 px-4 py-4">
              <input
                type="text"
                placeholder="Username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm placeholder:text-[#999] focus:outline-none focus:border-[#1a9e71] text-[#2c3e50] bg-white"
              />
              <button 
                onClick={handleSearch}
                className="bg-[#1a9e71] hover:bg-[#158c61] text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </section>
        </div>

        {/* Client List card */}
        <div className="mx-3">
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
