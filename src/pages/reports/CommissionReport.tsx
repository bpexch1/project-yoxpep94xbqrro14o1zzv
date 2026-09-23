import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { AlignJustify, Loader2 } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";

export default function CommissionReport() {
  const [activeTab, setActiveTab] = useState("Commission Report");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const session = getClientSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) navigate("/login");
  }, [session, navigate]);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["commission-report-clients", session?.username],
    queryFn: async () => {
      if (!session) return [];
      let query = ClientEntity.query().sort("username");
      if (session.role !== "company") {
        query = query.where("parent_username", session.username);
      }
      return await query.exec();
    },
    enabled: !!session,
  });

  const sortedClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    return [...clients].sort((a, b) => {
      const nameA = (a.username || "").toLowerCase();
      const nameB = (b.username || "").toLowerCase();
      return sortDir === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [clients, sortDir]);

  const totalCommission = useMemo(() => {
    return sortedClients.reduce((sum, c) => {
      const comm = Number(c.commission_amount || c.commission || 0);
      return sum + comm;
    }, 0);
  }, [sortedClients]);

  const toggleSort = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f0f0", paddingBottom: "60px", fontFamily: '"Roboto", -apple-system, sans-serif' }}>
      <main style={{ maxWidth: "1024px", margin: "0 auto", padding: "12px 8px" }}>
        
        {/* Report Type Tabs */}
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Commission Report Card */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #dee2e6", borderRadius: "4px", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
          
          {/* Card Header */}
          <div style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlignJustify style={{ width: "16px", height: "16px", color: "#212529" }} />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#212529" }}>
              {session?.username || "Admin"} - Commission Report
            </span>
          </div>

          {/* Subtext Banner */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #dee2e6", backgroundColor: "#ffffff" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#212529" }}>
              All Commission goes to As per share (Auto Commission)
            </span>
          </div>

          {/* Table */}
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
              <Loader2 className="w-6 h-6 animate-spin text-[#00b181]" />
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
                    <th 
                      onClick={toggleSort}
                      style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#212529", cursor: "pointer", userSelect: "none" }}
                    >
                      User Name <span style={{ color: "#00b181" }}>▲</span>
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#212529" }}>
                      Amount <span style={{ color: "#00b181" }}>▲</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClients.length === 0 ? (
                    <tr>
                      <td colSpan={2} style={{ padding: "20px", textAlign: "center", color: "#6c757d" }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    sortedClients.map((client: any, idx: number) => {
                      const comm = Number(client.commission_amount || client.commission || 0);
                      return (
                        <tr 
                          key={client.id || idx}
                          style={{ borderBottom: "1px solid #f1f3f5", backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fcfcfc" }}
                        >
                          <td style={{ padding: "7px 12px", fontWeight: 700, color: "#00b181" }}>
                            {client.username}
                          </td>
                          <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 700, color: comm >= 0 ? "#00b181" : "#dc3545" }}>
                            {comm.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: "#00b181", color: "#ffffff", fontWeight: 700, fontSize: "13.5px" }}>
                    <td style={{ padding: "8px 12px" }}>Total</td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{totalCommission.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
