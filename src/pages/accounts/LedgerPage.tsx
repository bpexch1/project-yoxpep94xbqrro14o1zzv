import { Fragment, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/entities";
import { Filter } from "lucide-react";
import { getClientSession } from "@/hooks/useClientAuth";
import { verifyInHierarchy } from "@/lib/hierarchyCheck";

function todayAt(time: string) {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${time}`;
}
const columns = ["Date", "Description", "Amount", "Balance"];

export default function LedgerPage() {
  const params = useParams();
  const session = getClientSession();
  const username = params.username || session?.username;
  const [fromDate, setFromDate] = useState(() => todayAt("00:00"));
  const [toDate, setToDate] = useState(() => todayAt("23:59"));
  const [range, setRange] = useState(() => ({ from: todayAt("00:00"), to: todayAt("23:59") }));
  const [filterError, setFilterError] = useState("");
  const [exportError, setExportError] = useState("");
  const [pageSize, setPageSize] = useState(100);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: authorized, isError: authorizationError } = useQuery({
    queryKey: ["ledger-access", username, session?.username, session?.role],
    queryFn: () => verifyInHierarchy(username!, session!.username, session!.role),
    enabled: !!username && !!session,
  });
  const { data: transactions, isLoading, isError } = useQuery({
    queryKey: ["transactions", username],
    queryFn: () => Transaction.filter({ client_username: username }, "created_at"),
    enabled: authorized === true,
    refetchInterval: 15000,
  });
  const entries = useMemo(() => {
    const start = new Date(range.from).getTime();
    const end = new Date(range.to).getTime() + 59999;
    return (transactions || []).filter(tx => {
      const date = new Date(tx.created_at).getTime();
      return date >= start && date <= end;
    }).map(tx => ({
      id: tx.id,
      date: new Date(tx.created_at).toLocaleString(),
      description: tx.description || tx.type || "Transaction",
      amount: Number(tx.amount) || 0,
      // Only display the recorded balance; never synthesize financial history.
      balance: tx.after_balance == null ? "—" : Number(tx.after_balance),
    })).filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(search.toLowerCase())));
  }, [transactions, range, search]);
  const pages = Math.max(1, Math.ceil(entries.length / pageSize));
  const currentPage = Math.min(page, pages);
  const offset = (currentPage - 1) * pageSize;
  const visible = entries.slice(offset, offset + pageSize);
  const exportRows = entries.map(row => [row.date, row.description, row.amount, row.balance]);
  const exportFile = async (kind: "excel" | "pdf") => {
    setExportError("");
    try {
      const filename = `${username}-ledger`;
      if (kind === "excel") {
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([columns, ...exportRows]), "Ledger");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
        const doc = new jsPDF();
        doc.text(`${username} - Account Ledger`, 14, 16);
        autoTable(doc, { startY: 24, head: [columns], body: exportRows });
        doc.save(`${filename}.pdf`);
      }
    } catch { setExportError("Export failed. Please try again."); }
  };
  if (authorizationError || authorized === false) return <div role="alert" className="card card-body">This ledger is not available to your account.</div>;
  return (
    <div className="reference-ledger">
      <section className="card">
        <div className="card-header"><Filter size={16} /> Report Filter</div>
        <form className="card-body" onSubmit={event => {
          event.preventDefault();
          if (!fromDate || !toDate || new Date(fromDate) > new Date(toDate)) { setFilterError("Choose a valid start and end date."); return; }
          setFilterError(""); setRange({ from: fromDate, to: toDate }); setPage(1);
        }}>
          <input aria-label="From date" type="datetime-local" required value={fromDate} onChange={event => setFromDate(event.target.value)} />
          <div className="text-center my-2">-</div>
          <input aria-label="To date" type="datetime-local" required value={toDate} onChange={event => setToDate(event.target.value)} />
          {filterError && <p role="alert" className="text-red-700">{filterError}</p>}
          <div className="text-right mt-3"><button className="btn btn-primary" type="submit">Submit</button></div>
        </form>
      </section>
      <section className="card">
        <div className="card-header">{username} - Account Ledger</div>
        <div className="card-body">
          <div className="ledger-controls">
            <label><select aria-label="Entries per page" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{[10,25,50,100].map(size => <option key={size}>{size}</option>)}</select> entries per page</label>
            <div className="ledger-exports"><button onClick={() => window.print()}>Print</button><button disabled={!entries.length} onClick={() => void exportFile("excel")}>Excel</button><button disabled={!entries.length} onClick={() => void exportFile("pdf")}>PDF</button></div>
            <label className="text-center">Search:<input type="search" className="block border px-2 py-1" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
          </div>
          {exportError && <p role="alert">{exportError}</p>}
          {isError ? <p role="alert">Unable to load ledger. Please try again.</p> : authorized !== true || isLoading ? <p role="status">Loading ledger…</p> : <table className="table table-bordered table-sm mb-0">
            <thead><tr><th>#</th><th>Date</th><th>Description</th></tr></thead>
            <tbody>{visible.map((row, index) => <Fragment key={row.id}><tr><td>{offset + index + 1}</td><td className="whitespace-normal">{row.date}</td><td className="whitespace-normal text-[#00b181]">{row.description}</td></tr><tr><td colSpan={3}><div className="ledger-meta"><div><strong>Amount</strong>{row.amount.toLocaleString()}</div><div><strong>Balance</strong>{typeof row.balance === "number" ? row.balance.toLocaleString() : row.balance}</div></div></td></tr></Fragment>)}{!visible.length && <tr><td colSpan={3}>No transactions found</td></tr>}</tbody>
          </table>}
          <p className="text-center mt-3">Showing {entries.length ? offset + 1 : 0} to {Math.min(offset + pageSize, entries.length)} of {entries.length} entries</p>
          <div className="ledger-pagination"><button aria-label="First page" className="admin-page-button" disabled={currentPage === 1} onClick={() => setPage(1)}>«</button><button aria-label="Previous page" className="admin-page-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button><span className="admin-page-button admin-page-current">{currentPage}</span><button aria-label="Next page" className="admin-page-button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>›</button><button aria-label="Last page" className="admin-page-button" disabled={currentPage === pages} onClick={() => setPage(pages)}>»</button></div>
        </div>
      </section>
    </div>
  );
}
