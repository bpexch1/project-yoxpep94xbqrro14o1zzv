import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Loader2, AlignJustify } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";

export default function FinalSheet() {
  const [activeTab, setActiveTab] = useState("Final Sheet");
  const [hideZero, setHideZero] = useState(true);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const session = getClientSession();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!session) navigate("/login");
  }, [session, navigate]);

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["final-sheet-v2", session?.username],
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

  const { data: selfClient, isLoading: isLoadingSelf } = useQuery({
    queryKey: ["self-client", session?.username],
    queryFn: async () => {
      if (!session) return null;
      const results = await ClientEntity.query().where("username", session.username).exec();
      return results?.[0] || null;
    },
    enabled: !!session,
  });

  const isLoading = isLoadingClients || isLoadingSelf;

  // Create a special "Cash" entry from selfClient's cash field
  const cashEntry = useMemo(() => {
    const cashAmount = selfClient?.cash || 0;
    if (cashAmount === 0 && hideZero) return null;
    return {
      id: "cash-entry",
      username: "Cash",
      balance_upline: cashAmount,
      isCashRow: true,
    };
  }, [selfClient, hideZero]);

  // Sort clients by name
  const sortedClients = useMemo(() => {
    if (!clients) return [];
    return [...clients].sort((a, b) => {
      const nameA = (a.username || "").toLowerCase();
      const nameB = (b.username || "").toLowerCase();
      return sortDir === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [clients, sortDir]);

  // Split into positive (left) and negative (right) based on balance_upline
  const positiveClients = useMemo(() => {
    const base = sortedClients.filter((c) => {
      const amt = c.balance_upline || 0;
      return hideZero ? amt > 0 : amt >= 0;
    });
    if (cashEntry && cashEntry.balance_upline > 0) {
      return [...base, cashEntry];
    }
    // If not hiding zero and cash is exactly zero, we could show it in positive table by default
    if (cashEntry && cashEntry.balance_upline === 0 && !hideZero) {
      return [...base, cashEntry];
    }
    return base;
  }, [sortedClients, hideZero, cashEntry]);

  const negativeClients = useMemo(() => {
    const base = sortedClients.filter((c) => {
      const amt = c.balance_upline || 0;
      return hideZero ? amt < 0 : amt <= 0;
    });
    if (cashEntry && cashEntry.balance_upline < 0) {
      return [...base, cashEntry];
    }
    return base;
  }, [sortedClients, hideZero, cashEntry]);

  const positiveTotal = positiveClients.reduce((s, c) => s + (c.balance_upline || 0), 0);
  const negativeTotal = negativeClients.reduce((s, c) => s + (c.balance_upline || 0), 0);

  const toggleSort = () => setSortDir((d) => d === "asc" ? "desc" : "asc");

  return (
    <div className="bg-[rgb(228,229,230)] pb-16 min-h-screen text-[rgb(35,40,44)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <main className="pt-0 pb-8 max-w-5xl mx-auto px-2 sm:px-3">
        <div className="h-2" />

        {/* Report Type Tabs */}
        <div className="mb-2">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Title Card */}
        <div className="mb-3">
          <div className="bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] px-3 py-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            {/* Title Row */}
            <div className="flex items-center gap-2 mb-2">
              <AlignJustify className="w-5 h-5 text-[rgb(35,40,44)]" />
              <span className="font-bold text-[0.875rem] text-[rgb(35,40,44)]">
                {session?.username || "Admin"} - Final Sheet
              </span>
            </div>
            {/* Hide Zero Amounts checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideZero}
                onChange={(e) => setHideZero(e.target.checked)}
                className="w-4 h-4 accent-[#00b98a]"
              />
              <span className="text-[0.875rem] text-[rgb(35,40,44)] font-medium">Hide Zero Amounts</span>
            </label>
          </div>
        </div>

        {/* Two Tables Side by Side */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-[#00b98a]" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              {/* LEFT TABLE — Positive Amounts */}
              <div className="flex-1 min-w-0 bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <table className="table table-bordered table-sm mb-0 text-[0.875rem]">
                  <thead>
                    <tr className="bg-[#f0f3f5] text-[rgb(35,40,44)]">
                      <th
                        className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold text-[rgb(35,40,44)] cursor-pointer select-none"
                        onClick={toggleSort}
                      >
                        Name {sortDir === "asc" ? "▲" : "▼"}
                      </th>
                      <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold text-[rgb(35,40,44)]">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {positiveClients.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-2.5 py-6 text-center text-gray-400 italic text-[0.75rem]">
                          No entries
                        </td>
                      </tr>
                    ) : (
                      positiveClients.map((c: any) => {
                        const isCurrentUser = !c.isCashRow && c.username === session?.username;
                        return (
                          <tr
                            key={c.id}
                            className={isCurrentUser ? "bg-[#c8ced3]" : "bg-white hover:bg-[#f8f9fa]"}
                          >
                            <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-[#00b98a] font-medium">
                              {c.username}
                            </td>
                            <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[rgb(35,40,44)] font-medium">
                              {(c.balance_upline || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#00b98a] text-white">
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 font-bold text-[0.875rem]">Total</td>
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold text-[0.875rem]">
                        {positiveTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* RIGHT TABLE — Negative Amounts */}
              <div className="flex-1 min-w-0 bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <table className="table table-bordered table-sm mb-0 text-[0.875rem]">
                  <thead>
                    <tr className="bg-[#f0f3f5] text-[rgb(35,40,44)]">
                      <th
                        className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-left font-bold text-[rgb(35,40,44)] cursor-pointer select-none"
                        onClick={toggleSort}
                      >
                        Name {sortDir === "asc" ? "▲" : "▼"}
                      </th>
                      <th className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold text-[rgb(35,40,44)]">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {negativeClients.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-2.5 py-6 text-center text-gray-400 italic text-[0.75rem]">
                          No entries
                        </td>
                      </tr>
                    ) : (
                      negativeClients.map((c: any) => {
                        const isCurrentUser = !c.isCashRow && c.username === session?.username;
                        return (
                          <tr
                            key={c.id}
                            className={isCurrentUser ? "bg-[#c8ced3]" : "bg-white hover:bg-[#f8f9fa]"}
                          >
                            <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-[#00b98a] font-medium">
                              {c.username}
                            </td>
                            <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right text-[#dc3545] font-medium">
                              {(c.balance_upline || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#dc3545] text-white">
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 font-bold text-[0.875rem]">Total</td>
                      <td className="border border-[rgb(200,206,211)] px-2.5 py-1.5 text-right font-bold text-[0.875rem]">
                        {negativeTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
