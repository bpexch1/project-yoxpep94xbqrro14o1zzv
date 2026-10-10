import { Fragment, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/entities";
import { Filter } from "lucide-react";
import { getClientSession } from "@/hooks/useClientAuth";
import { verifyInHierarchy } from "@/lib/hierarchyCheck";
import { LedgerDateTimeField } from "@/components/accounts/LedgerDateTimeField";
import { ledgerLocalToUtc } from "@/lib/ledgerDateTime";
import "./ledgerReference.css";

function todayAt(time: string) {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${time}`;
}
const columns = ["Date", "Description", "Amount", "Balance"];

export default function LedgerPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const walletFilter = ["cash", "credit"].includes(searchParams.get("wallet") || "") ? searchParams.get("wallet") : null;
  const [ledgerKind, setLedgerKind] = useState<"all" | "parent" | "settlements">("all");
  const session = getClientSession();
  const username = params.username || session?.username;
  const [fromDate, setFromDate] = useState(() => todayAt("00:00"));
  const [toDate, setToDate] = useState(() => todayAt("23:59"));
  const [range, setRange] = useState(() => ({
    from: ledgerLocalToUtc(todayAt("00:00")) || new Date().toISOString(),
    to: ledgerLocalToUtc(todayAt("23:59")) || new Date().toISOString(),
  }));
  const [filterError, setFilterError] = useState("");
  const [exportError, setExportError] = useState("");
  const [pageSize, setPageSize] = useState(100);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<"date" | "description" | "amount" | "balance">("date");
  const [sortAscending, setSortAscending] = useState(true);
  const toggleSort = (column: "date" | "description" | "amount" | "balance") => {
    if (column === sortColumn) setSortAscending(previous => !previous);
    else { setSortColumn(column); setSortAscending(true); }
    setPage(1);
  };
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());
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
    const start = Date.parse(range.from);
    const end = Date.parse(range.to) + 59999;
    const rows = (transactions || []).filter(tx => {
      const date = new Date(tx.created_at).getTime();
      const type = String(tx.type || "").toLowerCase();
      if (walletFilter && type !== walletFilter && type !== "opening_balance") return false;
      if (ledgerKind === "parent" && !tx.operator_username) return false;
      if (ledgerKind === "settlements" && !/settle|pl[ _-]/i.test(type)) return false;
      return date >= start && date <= end;
    }).map(tx => ({
      id: tx.id,
      timestamp: new Date(tx.created_at).getTime(),
      date: new Date(tx.created_at).toLocaleString(),
      description: tx.description || tx.type || "Transaction",
      amount: Number(tx.amount) || 0,
      // Only display the recorded balance; never synthesize financial history.
      balance: tx.after_balance == null ? "—" : Number(tx.after_balance),
    })).filter(row => [row.date, row.description, row.amount, row.balance]
      .some(value => String(value).toLowerCase().includes(search.toLowerCase())));
    return rows.sort((a, b) => {
      const left = sortColumn === "date" ? a.timestamp : a[sortColumn];
      const right = sortColumn === "date" ? b.timestamp : b[sortColumn];
      const comparison = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), undefined, { numeric: true });
      return sortAscending ? comparison : -comparison;
    });
  }, [transactions, range, search, walletFilter, ledgerKind, sortColumn, sortAscending]);
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
        <form className="card-body ledger-filter" onSubmit={event => {
          event.preventDefault();
          const fromUtc = ledgerLocalToUtc(fromDate);
          const toUtc = ledgerLocalToUtc(toDate);
          if (!fromUtc || !toUtc || Date.parse(fromUtc) > Date.parse(toUtc)) {
            setFilterError("Choose a valid start and end date on or after 01/01/2026.");
            return;
          }
          setFilterError(""); setRange({ from: fromUtc, to: toUtc }); setPage(1);
        }}>
          <LedgerDateTimeField label="From" value={fromDate} onChange={setFromDate} />
          <div className="ledger-date-separator">-</div>
          <LedgerDateTimeField label="To" value={toDate} onChange={setToDate} />
          {filterError && <p role="alert" className="text-red-700">{filterError}</p>}
          <div className="ledger-filter-submit"><button className="btn btn-primary" type="submit">Submit</button></div>
          <fieldset className="ledger-kind-options">
            <legend className="sr-only">Ledger category</legend>
            {(["all", "parent", "settlements"] as const).map(kind => (
              <label key={kind} className="flex items-center gap-1.5">
                <input type="radio" name="ledger-category" checked={ledgerKind === kind}
                  onChange={() => { setLedgerKind(kind); setPage(1); }} />
                {kind === "all" ? "All" : kind === "parent" ? "Parent" : "Settlements"}
              </label>
            ))}
          </fieldset>
        </form>
      </section>
      <section className="card">
        <div className="card-header">
          {walletFilter ? (walletFilter === "cash" ? "Cash" : "Credit") : username} - Account Ledger
        </div>
        <div className="card-body">
          <div className="ledger-controls">
            <label><select aria-label="Entries per page" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{[100,250,500,1000].map(size => <option key={size}>{size}</option>)}</select> entries per page</label>
            <div className="ledger-exports"><button onClick={() => window.print()}>Print</button><button disabled={!entries.length} onClick={() => void exportFile("excel")}>Excel</button><button disabled={!entries.length} onClick={() => void exportFile("pdf")}>PDF</button></div>
            <label className="text-center">Search:<input type="search" className="block border px-2 py-1" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
          </div>
          {exportError && <p role="alert">{exportError}</p>}
          {isError ? <p role="alert">Unable to load ledger. Please try again.</p> : authorized !== true || isLoading ? <p role="status">Loading ledger…</p> : <table className="table table-bordered table-sm mb-0">
            <thead><tr><th>#</th>
              {(["date", "description", "amount", "balance"] as const).map(column => (
                <th key={column}
                  className={column === "amount" || column === "balance" ? "ledger-desktop-cell" : ""}
                  aria-sort={sortColumn === column ? (sortAscending ? "ascending" : "descending") : "none"}>
                  <button type="button" className="ledger-sort-button" onClick={() => toggleSort(column)}>
                    {column.charAt(0).toUpperCase() + column.slice(1)}
                    <span aria-hidden="true">{sortColumn === column ? (sortAscending ? " ▲" : " ▼") : " ↕"}</span>
                  </button>
                </th>
              ))}
            </tr></thead>
            <tbody>{visible.map((row, index) => <Fragment key={row.id}><tr><td><button type="button" className="ledger-expand-button" aria-label={`Toggle details for entry ${offset + index + 1}`} aria-expanded={!collapsedRows.has(row.id)} onClick={() => setCollapsedRows(previous => { const next = new Set(previous); next.has(row.id) ? next.delete(row.id) : next.add(row.id); return next; })}>{collapsedRows.has(row.id) ? "+" : "−"}</button>{offset + index + 1}</td><td className="whitespace-normal">{row.date}</td><td className="whitespace-normal text-[#00b181]">{row.description}</td><td className="ledger-desktop-cell">{row.amount.toLocaleString()}</td><td className="ledger-desktop-cell">{typeof row.balance === "number" ? row.balance.toLocaleString() : row.balance}</td></tr><tr className="ledger-mobile-row" hidden={collapsedRows.has(row.id)}><td colSpan={3}><div className="ledger-meta"><div><strong>Amount</strong>{row.amount.toLocaleString()}</div><div><strong>Balance</strong>{typeof row.balance === "number" ? row.balance.toLocaleString() : row.balance}</div></div></td></tr></Fragment>)}{!visible.length && <tr><td colSpan={5}>No transactions found</td></tr>}</tbody>
          </table>}
          <p className="text-center mt-3">Showing {entries.length ? offset + 1 : 0} to {Math.min(offset + pageSize, entries.length)} of {entries.length} entries</p>
          <div className="ledger-pagination"><button aria-label="First page" className="admin-page-button" disabled={currentPage === 1} onClick={() => setPage(1)}>«</button><button aria-label="Previous page" className="admin-page-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button><span className="admin-page-button admin-page-current">{currentPage}</span><button aria-label="Next page" className="admin-page-button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>›</button><button aria-label="Last page" className="admin-page-button" disabled={currentPage === pages} onClick={() => setPage(pages)}>»</button></div>
        </div>
      </section>
    </div>
  );
}
