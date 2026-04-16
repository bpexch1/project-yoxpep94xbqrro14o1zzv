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
    <div style={{ minHeight: "100vh", background: "#ececec", ...arialFont }}>
      <main style={{ maxWidth: 420, margin: "0 auto", padding: "12px 10px 80px" }}>

        {/* 1. Report Type Card */}
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 2. Search-Users Card */}
        <div style={{
          background: "#f3f3f3",
          borderRadius: 6,
          border: "1px solid #d4d4d4",
          marginBottom: 14,
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "#ececec",
            borderBottom: "1px solid #d4d4d4",
          }}>
            <Filter style={{ width: 15, height: 15, color: "#333", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>Search-Users</span>
          </div>
          <div style={{ padding: "10px 12px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="Username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  height: "40px",
                  border: "1px solid #cccccc",
                  borderRadius: "4px",
                  padding: "0 10px",
                  fontSize: "14px",
                  color: "#333",
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#fff",
                  ...arialFont
                }}
              />
              <button
                style={{
                  height: "40px",
                  padding: "0 16px",
                  background: "#12b886",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxSizing: "border-box",
                  flexShrink: 0,
                  ...arialFont
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
          searchFilter={searchQuery}
          onRefresh={refetch}
          autoLoadBalance={false}
        />

      </main>
    </div>
  );
}
