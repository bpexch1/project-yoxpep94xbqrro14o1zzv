import { Fragment, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { walletLedger, type LedgerWallet } from "@/services/walletLedger";
import { Filter } from "lucide-react";
import { getClientSession } from "@/hooks/useClientAuth";
import { verifyInHierarchy } from "@/lib/hierarchyCheck";

function todayAt(time: string) {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${time}`;
}
const columns = ["Date", "Description", "Amount", "Balance"];
type LedgerRow = { id: string; date: string; description: string; amount: number; balance: number | string };

export default function LedgerPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const requestedWallet = searchParams.get("wallet");
  const wallet: LedgerWallet = requestedWallet === "credit" || requestedWallet === "pl" ? requestedWallet : "cash";
  const walletLabel = wallet === "pl" ? "P/L" : wallet === "cash" ? "Cash" : "Credit";
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
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());
  const { data: authorized, isError: authorizationError } = useQuery({
    queryKey: ["ledger-access", username, session?.username, session?.role],
    queryFn: () => verifyInHierarchy(username!, session!.username, session!.role),
    enabled: !!username && !!session,
  });
  const { data: ledger, isLoading, isError } = useQuery({
    queryKey: ["transactions", username, wallet, range],
    queryFn: async () => {
      const start = new Date(range.from).toISOString();
      const end = new Date(new Date(range.to).getTime() + 60000).toISOString();
      return walletLedger({username: username!, wallet, from: start, to: end, limit: 10000});
    },
    enabled: authorized === true,
    refetchInterval: 15000,
  });
  const entries = useMemo(() => {
    const current = ledger?.rows || [];
    const opening = ledger?.openingBalance;
    const rows: LedgerRow[] = [{ id: "opening", date: new Date(range.from).toLocaleString(), description: "Opening Balance", amount: 0, balance: opening == null ? "—" : Number(opening) }];
    rows.push(...current.map(tx => ({
      id: tx.id,
      date: new Date(tx.created_at).toLocaleString(),
      description: `${tx.description || tx.type || "Transaction"}${(tx.description || "").endsWith(`(${walletLabel})`) ? "" : ` (${walletLabel})`}`,
      amount: Number(tx.amount) || 0,
      balance: tx.after_balance == null ? "—" : Number(tx.after_balance),
    })));
    return rows.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(search.toLowerCase())));
  }, [ledger, range, search, wallet]);
  const pages = Math.max(1, Math.ceil(entries.length / pageSize));
  const currentPage = Math.min(page, pages);
  const offset = (currentPage - 1) * pageSize;
  const visible = entries.slice(offset, offset + pageSize);
  const exportRows = entries.map(row => [row.date, row.description, row.amount, row.balance]);
  const exportFile = async (kind: "excel" | "pdf") => {
    setExportError("");
    try {
      const filename = `${username}-${wallet}-ledger`;
      if (kind === "excel") {
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([columns, ...exportRows]), "Ledger");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
        const doc = new jsPDF();
        doc.text(`${walletLabel} - Account Ledger`, 14, 16);
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
        <form className="card-body ledger-filter" onSubmit={event => {
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
        <div className="card-header">{walletLabel} - Account Ledger</div>
        <div className="card-body">
          <div className="ledger-controls">
            <label><select aria-label="Entries per page" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{[100,250,500,1000].map(size => <option key={size}>{size}</option>)}</select> entries per page</label>
            <div className="ledger-exports"><button onClick={() => window.print()}>Print</button><button disabled={!entries.length || isError || isLoading || authorized !== true || ledger?.truncated} onClick={() => void exportFile("excel")}>Excel</button><button disabled={!entries.length || isError || isLoading || authorized !== true || ledger?.truncated} onClick={() => void exportFile("pdf")}>PDF</button></div>
            <label className="text-center">Search:<input type="search" className="block border px-2 py-1" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
          </div>
          {ledger?.truncated && <p role="alert">More than 10,000 entries: narrow the date range before exporting.</p>}
          {exportError && <p role="alert">{exportError}</p>}
          {isError ? <p role="alert">Unable to load ledger. Please try again.</p> : authorized !== true || isLoading ? <p role="status">Loading ledger…</p> : <table className="table table-bordered table-sm mb-0">
            <thead><tr><th>#</th><th>Date</th><th>Description</th><th className="ledger-desktop-cell">Amount</th><th className="ledger-desktop-cell">Balance</th></tr></thead>
            <tbody>{visible.map((row, index) => <Fragment key={row.id}><tr><td><button type="button" className="ledger-expand-button" aria-label={`Toggle details for entry ${offset + index + 1}`} aria-expanded={!collapsedRows.has(row.id)} onClick={() => setCollapsedRows(previous => { const next = new Set(previous); next.has(row.id) ? next.delete(row.id) : next.add(row.id); return next; })}>{collapsedRows.has(row.id) ? "+" : "−"}</button>{offset + index + 1}</td><td className="whitespace-normal">{row.date}</td><td className="whitespace-normal text-[#00b181]">{row.description}</td><td className="ledger-desktop-cell">{row.amount.toLocaleString()}</td><td className="ledger-desktop-cell">{typeof row.balance === "number" ? row.balance.toLocaleString() : row.balance}</td></tr><tr className="ledger-mobile-row" hidden={collapsedRows.has(row.id)}><td colSpan={3}><div className="ledger-meta"><div><strong>Amount</strong>{row.amount.toLocaleString()}</div><div><strong>Balance</strong>{typeof row.balance === "number" ? row.balance.toLocaleString() : row.balance}</div></div></td></tr></Fragment>)}{!visible.length && <tr><td colSpan={5}>No transactions found</td></tr>}</tbody>
          </table>}
          <p className="text-center mt-3">Showing {entries.length ? offset + 1 : 0} to {Math.min(offset + pageSize, entries.length)} of {entries.length} entries</p>
          <div className="ledger-pagination"><button aria-label="First page" className="admin-page-button" disabled={currentPage === 1} onClick={() => setPage(1)}>«</button><button aria-label="Previous page" className="admin-page-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button><span className="admin-page-button admin-page-current">{currentPage}</span><button aria-label="Next page" className="admin-page-button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>›</button><button aria-label="Last page" className="admin-page-button" disabled={currentPage === pages} onClick={() => setPage(pages)}>»</button></div>
        </div>
      </section>
    </div>
  );
}
