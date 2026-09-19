
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Bet } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { Calendar, AlignJustify } from "lucide-react";

export default function UserProfitLoss() {
  const navigate = useNavigate();
  const session = getClientSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    const r = session.role?.toLowerCase()?.trim();
    if (r && r !== "client" && r !== "user" && r !== "bettor") {
      navigate("/reports/daily-pl", { replace: true });
      return;
    }
  }, [session, navigate]);

  const [fromDate, setFromDate] = useState("09/19/2026");
  const [fromTime, setFromTime] = useState("12:00");
  const [fromAmPm, setFromAmPm] = useState("AM");

  const [toDate, setToDate] = useState("09/19/2026");
  const [toTime, setToTime] = useState("11:59");
  const [toAmPm, setToAmPm] = useState("PM");

  const { data: bets, isLoading } = useQuery({
    queryKey: ["user-pl-data", session?.username],
    queryFn: async () => {
      if (!session?.username) return [];
      const res = await Bet.filter({ user_email: session.username });
      return Array.isArray(res) ? res : [];
    },
    enabled: !!session?.username,
  });

  if (!session) {
    return null;
  }

  const settledBets = (bets || []).filter((bet) => bet.status === "won" || bet.status === "lost");

  return (
    <div
      className="min-h-screen text-[#212529] select-none"
      style={{
        backgroundColor: "#e8eff5",
        fontFamily:
          '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="max-w-4xl mx-auto p-2 sm:p-4 pb-20">
        {/* 1. Report Filter Card */}
        <div className="bg-white rounded-none border border-[#c8d4e2] shadow-sm mb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#eaeff5] border-b border-[#cbd7e6]">
            <AlignJustify className="w-4 h-4 text-[#142a45]" />
            <span className="font-bold text-[13px] text-[#142a45]">Report Filter</span>
          </div>

          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="flex-1 min-w-0 border border-[#c8d4e2] bg-white px-2.5 py-1.5 text-xs text-center font-medium rounded-none focus:outline-none focus:border-[#00a676]"
              />
              <input
                type="text"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                className="w-16 border border-[#c8d4e2] bg-white px-2 py-1.5 text-xs text-center font-medium rounded-none focus:outline-none focus:border-[#00a676]"
              />
              <select
                value={fromAmPm}
                onChange={(e) => setFromAmPm(e.target.value)}
                className="w-14 border border-[#c8d4e2] bg-white px-1 py-1.5 text-xs text-center font-medium rounded-none focus:outline-none focus:border-[#00a676]"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
              <button
                type="button"
                className="w-9 h-8 flex items-center justify-center bg-[#eaeff5] border border-[#c8d4e2] text-[#142a45] hover:bg-[#d8e2ee]"
              >
                <Calendar className="w-4 h-4 text-[#4a5568]" />
              </button>
            </div>

            <div className="text-center text-xs text-gray-500 font-bold -my-1 mb-1">-</div>

            <div className="flex items-center gap-1.5 mb-3.5">
              <input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="flex-1 min-w-0 border border-[#c8d4e2] bg-white px-2.5 py-1.5 text-xs text-center font-medium rounded-none focus:outline-none focus:border-[#00a676]"
              />
              <input
                type="text"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                className="w-16 border border-[#c8d4e2] bg-white px-2 py-1.5 text-xs text-center font-medium rounded-none focus:outline-none focus:border-[#00a676]"
              />
              <select
                value={toAmPm}
                onChange={(e) => setToAmPm(e.target.value)}
                className="w-14 border border-[#c8d4e2] bg-white px-1 py-1.5 text-xs text-center font-medium rounded-none focus:outline-none focus:border-[#00a676]"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
              <button
                type="button"
                className="w-9 h-8 flex items-center justify-center bg-[#eaeff5] border border-[#c8d4e2] text-[#142a45] hover:bg-[#d8e2ee]"
              >
                <Calendar className="w-4 h-4 text-[#4a5568]" />
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="bg-[#00a676] hover:bg-[#008f64] text-white font-bold text-xs px-6 py-2 rounded-none transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* 2. Sports ProfitLoss Card */}
        <div className="bg-white rounded-none border border-[#c8d4e2] shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#eaeff5] border-b border-[#cbd7e6]">
            <AlignJustify className="w-4 h-4 text-[#142a45]" />
            <span className="font-bold text-[13px] text-[#142a45]">Sports ProfitLoss</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#dee2e6] text-[#142a45]">
                  <th className="p-2.5 font-bold border-r border-[#dee2e6]">#</th>
                  <th className="p-2.5 font-bold border-r border-[#dee2e6]">Event Name</th>
                  <th className="p-2.5 font-bold border-r border-[#dee2e6] text-right">Stake</th>
                  <th className="p-2.5 font-bold text-right">Net P/L</th>
                </tr>
              </thead>
              <tbody>
                {settledBets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500 italic">
                      No profit/loss records found for selected period.
                    </td>
                  </tr>
                ) : (
                  settledBets.map((b, i) => (
                    <tr key={b.id} className="border-b border-[#dee2e6] hover:bg-gray-50">
                      <td className="p-2.5 border-r border-[#dee2e6] text-gray-600">{i + 1}</td>
                      <td className="p-2.5 border-r border-[#dee2e6] font-bold text-[#142a45]">{b.match_title}</td>
                      <td className="p-2.5 border-r border-[#dee2e6] text-right font-medium">{b.stake}</td>
                      <td className={`p-2.5 text-right font-bold ${b.status === "won" ? "text-[#28a745]" : "text-[#dc3545]"}`}>
                        {b.status === "won" ? `+${b.potential_win - b.stake}` : `-${b.stake}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

