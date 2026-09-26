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
    <div className="bg-[rgb(228,229,230)] pb-16 min-h-screen text-[rgb(35,40,44)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <main className="max-w-5xl mx-auto px-2 sm:px-3">
        <div className="h-2" />
        
        {/* Report Type Tabs */}
        <div className="mb-2">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Commission Report Card */}
        <div className="bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          
          {/* Card Header */}
          <div className="bg-[#f0f3f5] border-b border-[rgb(200,206,211)] px-3 py-2 flex items-center gap-2">
            <AlignJustify className="w-4 h-4 text-[rgb(35,40,44)]" />
            <span className="text-[0.875rem] font-bold text-[rgb(35,40,44)]">
              {session?.username || "Admin"} - Commission Report
            </span>
          </div>

          {/* Subtext Banner */}
          <div className="p-3 border-b border-[rgb(200,206,211)] bg-white">
            <span className="text-[0.875rem] font-bold text-[rgb(35,40,44)]">
              All Commission goes to As per share (Auto Commission)
            </span>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#00b98a]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-bordered table-striped table-sm mb-0 text-[0.875rem]">
                <thead>
                  <tr className="bg-[#f0f3f5] border-b border-[rgb(200,206,211)]">
                    <th 
                      onClick={toggleSort}
                      className="border border-[rgb(200,206,211)] px-3 py-2 text-left font-bold text-[rgb(35,40,44)] cursor-pointer select-none"
                    >
                      User Name <span className="text-[#00b98a]">▲</span>
                    </th>
                    <th className="border border-[rgb(200,206,211)] px-3 py-2 text-right font-bold text-[rgb(35,40,44)]">
                      Amount <span className="text-[#00b98a]">▲</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClients.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-5 text-center text-gray-500 italic">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    sortedClients.map((client: any, idx: number) => {
                      const comm = Number(client.commission_amount || client.commission || 0);
                      return (
                        <tr 
                          key={client.id || idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-[#f8f9fa]"}
                        >
                          <td className="border border-[rgb(200,206,211)] px-3 py-1.5 font-bold text-[#00b98a]">
                            {client.username}
                          </td>
                          <td className={cn(
                            "border border-[rgb(200,206,211)] px-3 py-1.5 text-right font-bold",
                            comm >= 0 ? "text-[#00b98a]" : "text-[#dc3545]"
                          )}>
                            {comm.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#00b98a] text-white font-bold text-[0.875rem]">
                    <td className="border border-[rgb(200,206,211)] px-3 py-2">Total</td>
                    <td className="border border-[rgb(200,206,211)] px-3 py-2 text-right">{totalCommission.toLocaleString()}</td>
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
