import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, Search } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { ClientSummaryCard } from "@/components/accounts/ClientSummaryCard";
import { getClientSession } from "@/hooks/useClientAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("Accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const session = getClientSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
      // Only Company role can list all clients
      if (role === 'company') {
        return ClientEntity.list("-created_at");
      }
      return ClientEntity.filter({ parent_username: session.username }, "-created_at");
    },
    enabled: !!session,
  });

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  return (
    <div className="min-h-screen bg-[#d8d8d8]" style={arialFont}>
      <main className={cn(
        "mx-auto",
        isMobile ? "p-1 w-full" : "max-w-[980px] p-2"
      )}>

        {/* 1. Report Type Card */}
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 2. Search-Users Card */}
        <div className={cn(
          "bg-white border border-[#ccc] mb-2 overflow-hidden",
          isMobile ? "rounded-lg" : "rounded-none"
        )}>
          <div className="flex items-center gap-2 px-[14px] py-2 bg-[#e8e8e8] border-b border-[#ccc]">
            <Filter className="w-3.5 h-3.5 text-[#333]" />
            <span className="font-bold text-[14px] text-[#333]">Search-Users</span>
          </div>
          <div className="p-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-[34px] border border-[#ccc] rounded-none px-2.5 text-[14px] text-[#333] outline-none"
                style={arialFont}
              />
              <button
                className="h-[34px] px-4 bg-[#12b886] text-white font-bold text-[14px] rounded-none flex items-center gap-1.5 shrink-0"
                style={arialFont}
              >
                <Search className="w-[15px] h-[15px]" />
                Search
              </button>
            </div>
          </div>
        </div>

        {/* 3. Clients table/list — header shown inside ClientSummaryCard */}
        <ClientSummaryCard
          clients={clients || []}
          isLoading={isLoading}
          username={session?.username || 'Admin'}
          searchFilter={searchQuery}
          onRefresh={refetch}
          autoLoadBalance={true}
        />

      </main>
    </div>
  );
}
