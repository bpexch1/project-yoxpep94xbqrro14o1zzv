
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { supabase } from "@/integrations/supabase";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { Calendar, AlignJustify } from "lucide-react";

function todayInPakistan(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi", month: "2-digit", day: "2-digit", year: "numeric"
  }).format(new Date());
}

function parsePakistanDateTime(date: string, time: string, amPm: string): string {
  const d = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date.trim());
  const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!d || !t) throw new Error("Enter dates as MM/DD/YYYY and time as HH:MM.");
  const month = Number(d[1]), day = Number(d[2]), year = Number(d[3]);
  const hour = Number(t[1]), minute = Number(t[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 1 || hour > 12 || minute > 59)
    throw new Error("Invalid report date or time.");
  const check = new Date(Date.UTC(year, month-1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month-1 || check.getUTCDate() !== day)
    throw new Error("Invalid calendar date.");
  const hour24 = hour % 12 + (amPm === "PM" ? 12 : 0);
  // PKT is UTC+05:00 (no daylight saving time).
  return new Date(Date.UTC(year,month-1,day,hour24-5,minute)).toISOString();
}

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

  const [fromDate, setFromDate] = useState(todayInPakistan);
  const [fromTime, setFromTime] = useState("12:00");
  const [fromAmPm, setFromAmPm] = useState("AM");

  const [toDate, setToDate] = useState(todayInPakistan);
  const [toTime, setToTime] = useState("11:59");
  const [toAmPm, setToAmPm] = useState("PM");

  const [filterError, setFilterError] = useState("");
  const [range, setRange] = useState(() => ({
    from: parsePakistanDateTime(todayInPakistan(), "12:00", "AM"),
    to: parsePakistanDateTime(todayInPakistan(), "11:59", "PM")
  }));
  const handleSubmit = () => {
    try {
      const from = parsePakistanDateTime(fromDate, fromTime, fromAmPm);
      const to = parsePakistanDateTime(toDate, toTime, toAmPm);
      if (new Date(from).getTime() > new Date(to).getTime())
        throw new Error("From date must not be later than To date.");
      setFilterError("");
      setRange({ from, to });
    } catch (err: any) {
      setFilterError(err?.message || "Invalid dates");
    }
  };

  const { data: bets, isLoading, error: loadError } = useQuery({
    queryKey: ["user-pl-data", session?.username, range.from, range.to],
    queryFn: async () => {
      if (!session?.username) return [];
      const pageSize = 500;
      const all: any[] = [];
      for (let page = 0; page < 20; page++) {
        const { data, error } = await supabase
          .from("bets").select("id, match_title, stake, potential_win, status, created_at")
          .eq("user_email", session.username)
          .in("status", ["won", "lost"])
          .gte("created_at", range.from).lte("created_at", range.to)
          .order("created_at", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw new Error(error.message);
        all.push(...(data || []));
        if (!data || data.length < pageSize) return all;
      }
      throw new Error("Report exceeds 10,000 rows. Narrow the date range.");
    },
    enabled: !!session?.username
  });

  if (!session) {
    return null;
  }

  const settledBets = bets || [];
  const netPL = settledBets.reduce((sum: number, bet: any) =>
    sum + (bet.status === "won" ? Number(bet.potential_win || 0) : -Number(bet.stake || 0)), 0);

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

      <main className="w-full max-w-none mx-0 p-2 sm:p-4 pb-20">
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
                onClick={handleSubmit}
                className="bg-[#00a676] hover:bg-[#008f64] text-white font-bold text-xs px-6 py-2 rounded-none transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {(filterError || loadError) && (
          <p role="alert" className="text-red-700 bg-red-50 border border-red-200 p-2 mb-3 text-xs">
            {filterError || (loadError as Error)?.message}
          </p>
        )}

        {/* 2. Sports ProfitLoss Card */}
        <div className="bg-white rounded-none border border-[#c8d4e2] shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#eaeff5] border-b border-[#cbd7e6]">
            <AlignJustify className="w-4 h-4 text-[#142a45]" />
            <span className="font-bold text-[13px] text-[#142a45]">Sports ProfitLoss</span>
          </div>

          <div className="overflow-x-auto">
            {settledBets.length === 0 ? (
              <div className="min-h-10 p-3 text-xs text-gray-600" aria-label="No profit/loss records">
                {isLoading ? "Loading report…" : "No settled bets in the selected date range."}
              </div>
            ) : <table className="w-full min-w-[560px] text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#dee2e6] text-[#142a45]">
                  <th className="p-2.5 font-bold border-r border-[#dee2e6]">#</th>
                  <th className="p-2.5 font-bold border-r border-[#dee2e6]">Event Name</th>
                  <th className="p-2.5 font-bold border-r border-[#dee2e6] text-right">Stake</th>
                  <th className="p-2.5 font-bold text-right">Net P/L</th>
                </tr>
              </thead>
              <tbody>
                {settledBets.map((b, i) => (
                    <tr key={b.id} className="border-b border-[#dee2e6] hover:bg-gray-50">
                      <td className="p-2.5 border-r border-[#dee2e6] text-gray-600">{i + 1}</td>
                      <td className="p-2.5 border-r border-[#dee2e6] font-bold text-[#142a45]">{b.match_title}</td>
                      <td className="p-2.5 border-r border-[#dee2e6] text-right font-medium">{b.stake}</td>
                      <td className={`p-2.5 text-right font-bold ${b.status === "won" ? "text-[#28a745]" : "text-[#dc3545]"}`}>
                        {b.status === "won" ? `+${Number(b.potential_win || 0).toFixed(2)}` : `-${Number(b.stake || 0).toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>}
          </div>
          {!isLoading && !loadError && (
            <div className="border-t border-[#c8d4e2] p-3 text-right text-sm font-bold">
              Total Net P/L: {netPL.toFixed(2)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

