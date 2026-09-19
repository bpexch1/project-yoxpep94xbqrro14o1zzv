import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Transaction, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { Calendar, AlignJustify, X, Printer, FileSpreadsheet, FileText } from "lucide-react";

export default function UserStatement() {
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
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [session, navigate]);

  // Filter dates
  const [fromDate, setFromDate] = useState("08/19/2026");
  const [fromTime, setFromTime] = useState("12:00");
  const [fromAmPm, setFromAmPm] = useState("AM");

  const [toDate, setToDate] = useState("09/19/2026");
  const [toTime, setToTime] = useState("11:59");
  const [toAmPm, setToAmPm] = useState("PM");

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const { data: transactions, isLoading: transLoading } = useQuery({
    queryKey: ["user-transactions", session?.username],
    queryFn: async () => {
      if (!session?.username) return [];
      const res = await Transaction.filter({ client_username: session.username });
      return Array.isArray(res) ? res : [];
    },
    enabled: !!session?.username,
  });

  const { data: clients } = useQuery({
    queryKey: ["client-profile", session?.username],
    queryFn: async () => {
      if (!session?.username) return null;
      const res = await Client.filter({ username: session.username });
      return res && res.length > 0 ? res[0] : null;
    },
    enabled: !!session?.username,
  });

  if (!session) {
    navigate("/login");
    return null;
  }

  const username = session.username || "TariqH4778";
  const userCash = clients?.cash ?? 2;

  // Fallback matching video ledger entries if DB has 0
  const defaultEntries = [
    {
      id: "tx-1",
      num: 1,
      date: "8/19/2026 12:00:00 am",
      description: "Opening Balance",
      isLink: false,
      amount: 0,
      balance: 0,
    },
    {
      id: "tx-2",
      num: 2,
      date: "8/19/2026 12:30:00 pm",
      description: `Cash deposit in ${username}. Az (Cash)`,
      isLink: true,
      amount: 13000,
      balance: 13000,
    },
    {
      id: "tx-3",
      num: 3,
      date: "8/19/2026 12:31:00 pm",
      description: "TeenPatti Studio / 32 Cards 9010.6A855B77",
      isLink: true,
      amount: -500,
      balance: 12500,
    },
    {
      id: "tx-4",
      num: 4,
      date: "8/19/2026 12:31:00 pm",
      description: "TeenPatti Studio / 32 Cards 9010.6A855BA2",
      isLink: true,
      amount: -1500,
      balance: 11000,
    },
  ];

  // Map database transactions into format
  const mappedDbEntries = (transactions || []).map((t, idx) => {
    let formattedDate = "8/19/2026 12:00:00 am";
    try {
      const d = new Date(t.created_at);
      formattedDate = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).toLowerCase()}`;
    } catch {
      // keep fallback
    }

    return {
      id: t.id,
      num: idx + 1,
      date: formattedDate,
      description: t.description || `Transaction in ${username}`,
      isLink: true,
      amount: t.amount || 0,
      balance: t.after_balance || 0,
    };
  });

  const displayList = mappedDbEntries.length > 0 ? mappedDbEntries : defaultEntries;

  const filteredEntries = displayList.filter((item) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      item.description.toLowerCase().includes(s) ||
      item.date.toLowerCase().includes(s) ||
      String(item.amount).includes(s)
    );
  });

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
          {/* Card Header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#eaeff5] border-b border-[#cbd7e6]">
            <AlignJustify className="w-4 h-4 text-[#142a45]" />
            <span className="font-bold text-[13px] text-[#142a45]">Report Filter</span>
          </div>

          {/* Filter Form Body */}
          <div className="p-3 sm:p-4">
            {/* From Date Row */}
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

            {/* Separator */}
            <div className="text-center text-xs text-gray-500 font-bold -my-1 mb-1">-</div>

            {/* To Date Row */}
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

            {/* Submit Button */}
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

        {/* 2. Account Ledger Card */}
        <div className="bg-white rounded-none border border-[#c8d4e2] shadow-sm">
          {/* Card Header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#eaeff5] border-b border-[#cbd7e6]">
            <AlignJustify className="w-4 h-4 text-[#142a45]" />
            <span className="font-bold text-[13px] text-[#142a45]">Account Ledger</span>
          </div>

          {/* Controls Bar */}
          <div className="p-3 border-b border-[#eaeff5]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              {/* Entries Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-[#334155]">
                <select
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  className="border border-[#c8d4e2] px-2 py-1 bg-white font-medium text-xs focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="font-medium text-xs">entries per page</span>
              </div>

              {/* Action Buttons: Print, Excel, PDF */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#6c757d] hover:bg-[#5a6268] text-white px-3 py-1 text-xs font-semibold rounded-none transition-colors"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => alert("Exporting to Excel...")}
                  className="bg-[#6c757d] hover:bg-[#5a6268] text-white px-3 py-1 text-xs font-semibold rounded-none transition-colors"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => alert("Exporting to PDF...")}
                  className="bg-[#6c757d] hover:bg-[#5a6268] text-white px-3 py-1 text-xs font-semibold rounded-none transition-colors"
                >
                  PDF
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-semibold text-[#334155]">Search:</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-[#c8d4e2] px-2 py-1 text-xs bg-white focus:outline-none focus:border-[#00a676] w-36 sm:w-48"
              />
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
            {/* Mobile / Card Friendly Layout matching Video Screenshot exactly */}
            <div className="divide-y divide-[#e2e8f0]">
              {/* Header Columns */}
              <div className="hidden md:grid md:grid-cols-12 bg-[#eaeff5] px-3 py-2 text-[11.5px] font-bold text-[#142a45] border-b border-[#cbd7e6]">
                <div className="col-span-1 flex items-center gap-1"># <span>▲▼</span></div>
                <div className="col-span-3 flex items-center gap-1">Date <span>▲▼</span></div>
                <div className="col-span-4 flex items-center gap-1">Description <span>▲▼</span></div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2 text-right">Balance</div>
              </div>

              {/* Rows */}
              {filteredEntries.map((item) => (
                <div
                  key={item.id}
                  className="p-3 hover:bg-[#f6f9fc] transition-colors flex flex-col md:grid md:grid-cols-12 md:items-center text-xs gap-1.5 md:gap-0"
                >
                  {/* Top mobile row with red number badge + Date */}
                  <div className="col-span-4 flex items-center gap-2">
                    {/* Red circular radio number badge */}
                    <div className="w-5 h-5 rounded-full border-2 border-[#e51c23] flex items-center justify-center flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#e51c23]" />
                    </div>
                    <span className="font-bold text-[#142a45] mr-2 text-xs">{item.num}</span>

                    <span className="text-gray-700 font-medium text-[11.5px] md:hidden">
                      {item.date}
                    </span>
                  </div>

                  {/* Desktop Date */}
                  <div className="hidden md:block md:col-span-3 text-gray-700 font-medium text-[11.5px]">
                    {item.date}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-4 pl-7 md:pl-0">
                    {item.isLink ? (
                      <button
                        onClick={() => setSelectedTx(item)}
                        className="text-[#00a676] hover:underline font-bold text-left text-xs"
                      >
                        {item.description}
                      </button>
                    ) : (
                      <span className="text-[#00a676] font-bold text-xs">{item.description}</span>
                    )}
                  </div>

                  {/* Mobile Amount & Balance Rows */}
                  <div className="flex md:hidden justify-between pl-7 text-xs border-t border-dashed border-gray-200 pt-1 mt-0.5">
                    <span className="text-gray-600 font-semibold">Amount</span>
                    <span className="font-bold text-[#142a45]">
                      {item.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex md:hidden justify-between pl-7 text-xs">
                    <span className="text-gray-600 font-semibold">Balance</span>
                    <span className="font-bold text-[#142a45]">
                      {item.balance.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Desktop Amount */}
                  <div className="hidden md:block md:col-span-2 text-right font-bold text-[#142a45]">
                    {item.amount.toLocaleString("en-IN")}
                  </div>

                  {/* Desktop Balance */}
                  <div className="hidden md:block md:col-span-2 text-right font-bold text-[#142a45]">
                    {item.balance.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Pagination */}
          <div className="flex flex-wrap items-center justify-between p-3 bg-[#eaeff5] border-t border-[#cbd7e6] text-xs text-[#334155] gap-2">
            <span>
              Showing 1 to {filteredEntries.length} of {filteredEntries.length} entry
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#c8d4e2] text-gray-400 cursor-default"
              >
                «
              </button>
              <button
                disabled
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#c8d4e2] text-gray-400 cursor-default"
              >
                ‹
              </button>
              <button className="w-7 h-7 flex items-center justify-center bg-[#00a676] text-white font-bold">
                1
              </button>
              <button
                disabled
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#c8d4e2] text-gray-400 cursor-default"
              >
                ›
              </button>
              <button
                disabled
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#c8d4e2] text-gray-400 cursor-default"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Transaction Detail View Modal (matching video at 00:27) */}
      {selectedTx && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-none shadow-2xl border border-gray-300 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#142a45] text-white">
              <h2 className="font-bold text-sm tracking-wide line-clamp-1">{selectedTx.description}</h2>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 divide-y divide-gray-100 text-xs font-sans">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-gray-500 font-semibold text-[13px]">UserName</span>
                <span className="font-bold text-[#142a45] text-[13px]">{username}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-gray-500 font-semibold text-[13px]">Date</span>
                <span className="font-bold text-gray-700 text-[13px]">{selectedTx.date}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-gray-500 font-semibold text-[13px]">Amount</span>
                <span className="font-black text-[#142a45] text-[14px]">
                  {selectedTx.amount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="bg-[#00a676] hover:bg-[#008f64] text-white font-bold text-xs px-5 py-2 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
