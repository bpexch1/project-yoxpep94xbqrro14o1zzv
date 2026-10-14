import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { walletLedger } from "@/services/walletLedger";
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
  const today = new Date().toLocaleDateString("en-US");
  const [fromDate, setFromDate] = useState(today);
  const [fromTime, setFromTime] = useState("12:00");
  const [fromAmPm, setFromAmPm] = useState("AM");

  const [toDate, setToDate] = useState(today);
  const [toTime, setToTime] = useState("11:59");
  const [toAmPm, setToAmPm] = useState("PM");

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const [range, setRange] = useState(() => { const start = new Date(); start.setHours(0,0,0,0); const end = new Date(start); end.setDate(end.getDate()+1); return {from:start.toISOString(), to:end.toISOString()}; });
  const [page, setPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const applyRange = () => {
    const parse = (date: string, time: string, period: string) => {
      const d = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date);
      const t = /^(\d{1,2}):(\d{2})$/.exec(time);
      if (!d || !t || +t[1]<1 || +t[1]>12 || +t[2]>59) throw new Error("Use MM/DD/YYYY and a valid time.");
      const result = new Date(+d[3], +d[1]-1, +d[2], (+t[1]%12)+(period === "PM" ? 12 : 0), +t[2]);
      if (result.getMonth()!==+d[1]-1 || result.getDate()!==+d[2]) throw new Error("Choose a valid date.");
      return result;
    };
    try {
      const from = parse(fromDate,fromTime,fromAmPm), to = parse(toDate,toTime,toAmPm);
      if (from>to) throw new Error("Start date must be before end date.");
      to.setMinutes(to.getMinutes()+1);
      setRange({from:from.toISOString(),to:to.toISOString()}); setPage(1); setErrorMessage("");
    } catch(error) { setErrorMessage(error instanceof Error ? error.message : "Invalid dates."); }
  };
  const { data: ledger, isLoading, isError } = useQuery({
    queryKey: ["user-transactions", session?.username, range],
    queryFn: () => walletLedger({username: session!.username, wallet: "combined", ...range, limit: 10000}),
    enabled: !!session?.username, refetchInterval: 15000,
  });
  if (!session) return null;
  const username = session.username;
  const displayList = [
    {id:"opening",date: new Date(range.from).toLocaleString(),description:"Opening Balance",isLink:false,amount:0,balance:ledger?.openingBalance},
    ...(ledger?.rows || []).map(t => ({id:t.id,date:new Date(t.created_at).toLocaleString(),description:t.description,isLink:true,amount:Number(t.amount),balance:t.after_balance})),
  ].map((entry,index)=>({...entry,num:index+1}));
  const filteredEntries = displayList.filter(item => [item.description,item.date,item.amount,item.balance].some(v=>String(v).toLowerCase().includes(searchTerm.toLowerCase())));
  const pages = Math.max(1,Math.ceil(filteredEntries.length/entriesPerPage));
  const currentPage = Math.min(page,pages), offset = (currentPage-1)*entriesPerPage;
  const visibleEntries = filteredEntries.slice(offset,offset+entriesPerPage);
  const exportFile = async (kind: "excel" | "pdf") => {
    try {
      const headings = ["Date","Description","Amount","Balance"];
      const rows = filteredEntries.map(r=>[r.date,r.description,r.amount,r.balance ?? "—"]);
      if (kind === "excel") {
        const XLSX = await import("xlsx"), workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet([headings,...rows]),"Statement"); XLSX.writeFile(workbook,`${username}-statement.xlsx`);
      } else {
        const [{default:jsPDF},{default:autoTable}] = await Promise.all([import("jspdf"),import("jspdf-autotable")]);
        const doc = new jsPDF(); doc.text(`${username} - Account Ledger`,14,16); autoTable(doc,{startY:24,head:[headings],body:rows}); doc.save(`${username}-statement.pdf`);
      }
    } catch { setErrorMessage("Export failed. Please try again."); }
  };

  return (
    <div
      className="user-statement min-h-screen text-[#212529] select-none"
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
                onClick={applyRange}
                className="bg-[#00a676] hover:bg-[#008f64] text-white font-bold text-xs px-6 py-2 rounded-none transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {errorMessage && <p role="alert">{errorMessage}</p>}
        {isError && <p role="alert">Unable to load statement. Please try again.</p>}
        {isLoading && <p role="status">Loading statement…</p>}
        {ledger?.truncated && <p role="alert">Narrow the date range: this statement has more than 10,000 entries.</p>}
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
                  onChange={(e) => {setEntriesPerPage(Number(e.target.value)); setPage(1);}}
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
                  disabled={isLoading || isError || !ledger || ledger.truncated} onClick={() => void exportFile("excel")}
                  className="bg-[#6c757d] hover:bg-[#5a6268] text-white px-3 py-1 text-xs font-semibold rounded-none transition-colors"
                >
                  Excel
                </button>
                <button
                  type="button"
                  disabled={isLoading || isError || !ledger || ledger.truncated} onClick={() => void exportFile("pdf")}
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
                onChange={(e) => {setSearchTerm(e.target.value); setPage(1);}}
                className="border border-[#c8d4e2] px-2 py-1 text-xs bg-white focus:outline-none focus:border-[#00a676] w-36 sm:w-48"
              />
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] text-[#142a45] border-b border-[#dee2e6]">
                  <th className="px-2 py-2 font-bold border-r border-[#dee2e6]">#</th>
                  <th className="px-2 py-2 font-bold border-r border-[#dee2e6]">Date</th>
                  <th className="px-2 py-2 font-bold border-r border-[#dee2e6]">Description</th>
                  <th className="px-2 py-2 font-bold border-r border-[#dee2e6] text-right">Amount</th>
                  <th className="px-2 py-2 font-bold text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {(!isLoading && !isError ? visibleEntries : []).map((item) => (
                  <tr key={item.id} className="border-b border-[#dee2e6] hover:bg-[#f6f9fc]">
                    <td className="px-2 py-2 border-r border-[#dee2e6]">{item.num}</td>
                    <td className="px-2 py-2 border-r border-[#dee2e6] whitespace-nowrap">{item.date}</td>
                    <td className="px-2 py-2 border-r border-[#dee2e6] min-w-[230px]">
                      {item.isLink ? (
                        <button onClick={() => setSelectedTx(item)} className="text-[#00a676] hover:underline font-semibold text-left">
                          {item.description}
                        </button>
                      ) : <span className="text-[#00a676] font-semibold">{item.description}</span>}
                    </td>
                    <td className="px-2 py-2 border-r border-[#dee2e6] text-right font-medium">{item.amount.toLocaleString("en-IN")}</td>
                    <td className="px-2 py-2 text-right font-medium">{item.balance == null ? "—" : Number(item.balance).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr><td colSpan={5} className="h-10 px-3 text-center text-gray-500">{searchTerm ? "No matching records found." : "No records found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="flex flex-wrap items-center justify-between p-3 bg-[#eaeff5] border-t border-[#cbd7e6] text-xs text-[#334155] gap-2">
            <span>
              Showing {filteredEntries.length ? offset+1 : 0} to {Math.min(offset+entriesPerPage,filteredEntries.length)} of {filteredEntries.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1} onClick={() => setPage(1)}
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#c8d4e2] text-gray-400 cursor-default"
              >
                «
              </button>
              <button
                disabled={currentPage === 1} onClick={() => setPage(currentPage-1)}
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#c8d4e2] text-gray-400 cursor-default"
              >
                ‹
              </button>
              <button className="w-7 h-7 flex items-center justify-center bg-[#00a676] text-white font-bold">
                {currentPage}
              </button>
              <button
                disabled={currentPage === pages} onClick={() => setPage(currentPage+1)}
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#c8d4e2] text-gray-400 cursor-default"
              >
                ›
              </button>
              <button
                disabled={currentPage === pages} onClick={() => setPage(pages)}
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
