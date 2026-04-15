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
    <div style={{ minHeight: "100vh", background: "#f0f0f0", fontFamily: "Roboto, system-ui, sans-serif" }}>
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "16px 12px 80px" }}>

        {/* 1. Report Type Card */}
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 2. Search-Users Card */}
        <div style={{
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
          marginBottom: 16,
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderBottom: "1px solid #e5e7eb",
          }}>
            <Filter style={{ width: 16, height: 16, fill: "#212529", color: "#212529", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#212529", fontFamily: "Roboto, system-ui, sans-serif" }}>Search-Users</span>
          </div>
          <div style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="Username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  flex: 1,
                  height: "40px",
                  minHeight: "40px",
                  maxHeight: "40px",
                  border: "1px solid #d1d5db",
                  borderRadius: "7px",
                  padding: "0 12px",
                  fontSize: "14px",
                  color: "#374151",
                  fontFamily: "Roboto, system-ui, sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  height: "40px",
                  minHeight: "40px",
                  maxHeight: "40px",
                  padding: "0 18px",
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "7px",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "Roboto, system-ui, sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}
              >
                <Search style={{ width: 15, height: 15 }} />
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
          searchFilter={searchFilter}
          onRefresh={refetch}
        />

      </main>
    </div>
  );
}
