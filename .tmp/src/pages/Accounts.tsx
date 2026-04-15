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
    if (!session) navigate("/login");
    async function fixBookRole() {
      try {
        const results = await ClientEntity.filter({ username: "Book" }, "-created_at", 1);
        if (results && results.length > 0) {
          const book = results[0];
          if (book.role === "superadmin") {
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
        return ClientEntity.list("-created_at");
      }
      return ClientEntity.filter({ parent_username: session.username }, "-created_at");
    },
    enabled: !!session,
  });

  const handleSearch = () => setSearchFilter(searchQuery);

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <main className="max-w-2xl mx-auto px-3 pt-4 pb-16">

        {/* 1. Report Type Card */}
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 2. Search-Users Card */}
        <div className="bg-white mb-4 overflow-hidden shadow-sm border border-gray-200" style={{ borderRadius: 10 }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
            <Filter className="w-4 h-4 fill-[#1a1a2e] text-[#1a1a2e]" />
            <span className="font-bold text-[#1a1a2e] text-[16px]">Search-Users</span>
          </div>
          <div className="px-4 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]"
                style={{ borderRadius: 8, fontSize: 15 }}
              />
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 px-5 py-3 text-white font-semibold text-[15px] transition-colors hover:bg-[#15803d]"
                style={{ background: '#16a34a', borderRadius: 8 }}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>
          {/* Extra bottom space to match screenshot */}
          <div className="h-3" />
        </div>

        {/* 3. Clients List heading card */}
        <div className="bg-white border border-gray-200 shadow-sm px-5 py-4 mb-4" style={{ borderRadius: 10 }}>
          <h2 className="font-bold text-[#1a1a2e] text-[18px]">
            {session?.username || 'Admin'} - Clients List
          </h2>
        </div>

        {/* 4. Clients table/list */}
        <ClientSummaryCard
          clients={clients || []}
          isLoading={isLoading}
          username={session?.username || 'Admin'}
          searchFilter={searchFilter}
          onRefresh={refetch}
          hideHeader={true}
        />

      </main>
    </div>
  );
}
