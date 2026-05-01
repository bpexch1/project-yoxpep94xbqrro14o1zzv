import React, { useState, useMemo, useEffect } from "react";
import { Pencil, User, Book, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/entities";
import { DataTablePagination } from "./DataTablePagination";

interface ClientSummaryCardProps {
  clients: any[];
  isLoading: boolean;
  username?: string;
  searchFilter?: string;
  onRefresh?: () => void;
  hideCreateButton?: boolean;
  hideHeader?: boolean;
}

export function ClientSummaryCard({ 
  clients, 
  isLoading, 
  username = "Admin", 
  searchFilter = "",
  onRefresh,
  hideCreateButton = false,
  hideHeader = false,
}: ClientSummaryCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [localSearch, setLocalSearch] = useState("");
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load Balance handler
  const handleLoadBalance = async () => {
    setIsLoadingBalances(true);
    // Small delay to show loading effect, then reveal data
    await new Promise(resolve => setTimeout(resolve, 500));
    setBalancesLoaded(true);
    setIsLoadingBalances(false);
    
    // Auto-expand ALL client rows after balance loads
    const allIds = new Set((filteredClients || []).map((c: any) => c.id));
    setExpandedIds(allIds);
  };
  
  // Feature 2 states
  const [rowLoadedMap, setRowLoadedMap] = useState<Record<string, boolean>>({});
  const [rowRefreshingMap, setRowRefreshingMap] = useState<Record<string, boolean>>({});
  const [refreshedData, setRefreshedData] = useState<Record<string, any>>({});
  
  // Feature 3 state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // DataTable states
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [tableSearch, setTableSearch] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getTypeLabel = (role: string) => {
    switch(role?.toLowerCase()) {
      case 'company': return 'Company';
      case 'superadmin': return 'SuperAdmin';
      case 'supermaster': return 'SuperMaster';
      case 'admin': return 'Admin';
      case 'client': return 'Bettor';
      default: return 'Bettor';
    }
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const list = [...clients];
    const query = localSearch.toLowerCase() || searchFilter.toLowerCase();
    return list.filter(
      (c) =>
        c.role?.toLowerCase() !== 'company' &&
        (c.username?.toLowerCase().includes(query) ||
        c.full_name?.toLowerCase().includes(query))
    );
  }, [clients, localSearch, searchFilter]);

  const totals = useMemo(() =>
    filteredClients.reduce(
      (acc, c) => ({
        credit_received: acc.credit_received + (c.credit_received || 0),
        credit_remaining: acc.credit_remaining + (c.credit_remaining || 0),
        cash: acc.cash + (c.cash || 0),
        pl_downline: acc.pl_downline + (c.pl_downline || 0),
        balance_upline: acc.balance_upline + (c.balance_upline || 0),
      }),
      { credit_received: 0, credit_remaining: 0, cash: 0, pl_downline: 0, balance_upline: 0 }
    ),
    [filteredClients]
  );

  // DataTable Logic
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredClients.length, tableSearch]);

  const tableFilteredClients = useMemo(() => {
    if (!tableSearch) return filteredClients;
    const query = tableSearch.toLowerCase();
    return filteredClients.filter(
      (c) =>
        c.username?.toLowerCase().includes(query) ||
        c.full_name?.toLowerCase().includes(query)
    );
  }, [filteredClients, tableSearch]);

  const sortedClients = useMemo(() => {
    if (!sortColumn) return tableFilteredClients;

    return [...tableFilteredClients].sort((a, b) => {
      let valA: any = a[sortColumn];
      let valB: any = b[sortColumn];

      // Handle specific numeric columns
      const numericCols = ['credit_received', 'cash', 'pl_downline', 'downline_share', 'credit_remaining'];
      if (numericCols.includes(sortColumn)) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tableFilteredClients, sortColumn, sortDirection]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedClients.slice(start, start + pageSize);
  }, [sortedClients, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedClients.length / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, sortedClients.length);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <i className="fas fa-sort text-gray-400 ml-1 text-[10px]" />;
    return sortDirection === 'asc' 
      ? <i className="fas fa-sort-up text-white ml-1 text-[10px]" />
      : <i className="fas fa-sort-down text-white ml-1 text-[10px]" />;
  };

  const handleRowRefresh = async (client: any) => {
    try {
      setRowRefreshingMap(prev => ({ ...prev, [client.id]: true }));
      const results = await Client.filter({ username: client.username }, "-created_at", 1);
      if (results && results.length > 0) {
        setRefreshedData(prev => ({ ...prev, [client.id]: results[0] }));
        setRowLoadedMap(prev => ({ ...prev, [client.id]: true }));
      }
      toast({ title: "Updated", description: `Balance updated for ${client.username}` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Refresh Failed" });
    } finally {
      setRowRefreshingMap(prev => ({ ...prev, [client.id]: false }));
    }
  };

  const toggleStatus = async (client: any) => {
    try {
      const newStatus = client.status === "active" ? "inactive" : "active";
      await Client.update(client.id, { status: newStatus });
      toast({ title: "Status Updated", description: `${client.username} is now ${newStatus}` });
      onRefresh && onRefresh();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const isAdminType = (role: string) => {
    const adminRoles = ['admin', 'superadmin', 'supermaster', 'company'];
    return adminRoles.includes(role?.toLowerCase());
  };

  const getClientDisplayData = (client: any) => {
    const fresh = refreshedData[client.id] || client;
    const isLoaded = balancesLoaded || rowLoadedMap[client.id];
    
    return {
      credit: isLoaded ? (fresh.credit_received || 0) : null,
      balance: isLoaded ? (fresh.cash || 0) : null,
      plDownline: isLoaded ? (fresh.pl_downline || 0) : null,
      share: isLoaded ? (fresh.downline_share || 0) : null,
      available: isLoaded ? (fresh.credit_remaining || 0) : null,
      isLoaded
    };
  };

  return (
    <section className="bg-white border border-[#dee2e6] shadow-sm rounded-[4px] overflow-hidden mb-4" style={{ fontFamily: "Roboto, system-ui, sans-serif" }}>
      {/* Card title */}
      {!hideHeader && (
        <div className="bg-[#ecf0f1] border-b border-[#d0d0d0]" style={{ padding: "6px 8px" }}>
          <span className="font-bold text-sm text-[#212529]">
            {username} - Clients List{!balancesLoaded ? " | Default" : ""}
          </span>
        </div>
      )}

      <div style={{ padding: "8px 6px" }}>
        {/* Summary Stats Table — use balancesLoaded to show 0 vs real totals */}
        <div className="mb-3 overflow-x-auto">
          {!balancesLoaded ? (
            <table className="border-collapse border border-[#dee2e6] text-[13px]">
              <thead>
                <tr className="bg-white">
                  <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Credit<br/>Remaining</th>
                  <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Cash</th>
                  <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">P/L<br/>Downline</th>
                  <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Users</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">0</td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">0</td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">0</td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">{filteredClients.length}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="border-collapse border border-[#dee2e6] text-[13px]">
              <thead>
                <tr className="bg-white">
                  <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Credit<br/>Received</th>
                  <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Credit<br/>Remaining</th>
                  <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Cash</th>
                  <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">P/L<br/>Downline</th>
                  <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Balance<br/>UpLine</th>
                  <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Users</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">
                    {totals.credit_received.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">
                    {totals.credit_remaining.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">
                    {totals.cash.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">
                    {totals.pl_downline.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">
                    {totals.balance_upline.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">
                    {filteredClients.length}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {!hideCreateButton && (
              <button
                onClick={() => navigate("/accounts/create")}
                className="bg-[#00b181] hover:bg-[#4dbd74] text-white font-bold text-[11px] py-0.5 px-2 rounded-[3px] flex items-center gap-1 transition-colors"
              >
                <User className="w-3 h-3" /> New User
              </button>
            )}
            <button
              onClick={() => navigate(`/reports/daily`)}
              className="bg-[#00b181] hover:bg-[#4dbd74] text-white font-bold text-[11px] py-0.5 px-2 rounded-[3px] flex items-center gap-1 transition-colors"
            >
              <Book className="w-3 h-3" /> Account Ledger
            </button>
          </div>

          {/* Legend - 2 rows exactly like screenshot */}
          <div className="flex flex-col gap-1 text-[10px] font-bold text-[#212529]">
            {/* Row 1: C, Edit, L, A */}
            <div className="flex items-center gap-x-2">
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 bg-[#ffc107] text-black flex items-center justify-center rounded text-[11px] font-black">C</span>
                <span>Cash / Credit</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 bg-[#28a745] text-white flex items-center justify-center rounded"><Pencil className="w-3 h-3" /></span>
                <span>Edit</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 bg-[#17a2b8] text-white flex items-center justify-center rounded text-[11px] font-black">L</span>
                <span>Ledger</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 bg-[#28a745] text-white flex items-center justify-center rounded text-[11px] font-black">A</span>
                <span>Active</span>
              </div>
            </div>
            {/* Row 2: D, S */}
            <div className="flex items-center gap-x-2">
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 bg-white border border-[#dc3545] text-[#dc3545] flex items-center justify-center rounded text-[11px] font-black">D</span>
                <span>InActive</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 bg-[#e74c3c] text-white flex items-center justify-center rounded text-[11px] font-black">S</span>
                <span>Settle Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Search box - matching original design */}
        <div style={{ textAlign: "center", marginBottom: 12, marginTop: 4 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#212529", marginBottom: 6 }}>
            Search:
          </label>
          <input
            type="search"
            value={tableSearch}
            onChange={(e) => {
              setTableSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "calc(100% - 32px)",
              maxWidth: 400,
              border: "1px solid #d1d5db",
              borderRadius: 4,
              padding: "6px 12px",
              fontSize: 14,
              outline: "none",
              fontFamily: "Roboto, system-ui, sans-serif"
            }}
            placeholder=""
          />
        </div>

        {/* Mobile Table View */}
        <div className="block lg:hidden overflow-x-auto">
          <table className="w-full border-collapse text-[13px]" style={{ fontFamily: "Roboto, system-ui, sans-serif" }}>
            <tbody>
              {/* GREEN TOTAL ROW — always first */}
              {!isLoading && (
                <tr style={{ background: "#00b181", color: "#fff", fontWeight: 700 }}>
                  {!balancesLoaded ? (
                    <td colSpan={4} className="px-2 py-2 border border-[#4dbd74]">
                      <button
                        onClick={handleLoadBalance}
                        style={{
                          background: "#ffc107",
                          color: "#000",
                          border: "none",
                          padding: "3px 12px",
                          fontWeight: 700,
                          fontSize: 12,
                          borderRadius: 3,
                          cursor: "pointer"
                        }}
                      >
                        {isLoadingBalances ? "Loading..." : "Load Balance"}
                      </button>
                    </td>
                  ) : (
                    <>
                      <td colSpan={2} className="px-2 py-2 border border-[#4dbd74] font-bold">Total</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right font-bold">{totals.credit_received.toLocaleString()}</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right font-bold">{totals.credit_remaining.toLocaleString()}</td>
                    </>
                  )}
                </tr>
              )}

              {/* COLUMN HEADER ROW — below total row */}
              <tr style={{ background: "#fff" }}>
                <th className="px-2 py-2 border border-[#d5d8dc] text-left text-[12px] font-bold text-[#212529]">Username</th>
                <th className="px-2 py-2 border border-[#d5d8dc] text-left text-[12px] font-bold text-[#212529]">Type</th>
                <th className="px-2 py-2 border border-[#d5d8dc] text-right text-[12px] font-bold text-[#212529]">Credit</th>
                <th className="px-2 py-2 border border-[#d5d8dc] text-right text-[12px] font-bold text-[#212529] w-6"></th>
              </tr>

              {/* USER ROWS */}
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : tableFilteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-gray-500 italic">No clients found</td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  const display = getClientDisplayData(client);
                  const isExpanded = expandedIds.has(client.id);
                  return (
                    <React.Fragment key={client.id}>
                      <tr
                        className="border-b border-[#d5d8dc] hover:bg-[#f8f9fa] cursor-pointer"
                        onClick={() => toggleExpand(client.id)}
                      >
                        <td className="px-2 py-2 border-r border-[#d5d8dc]">
                          <span
                            className={cn(
                              "font-bold text-[#212529]",
                              isAdminType(client.role) ? "text-[#00b181]" : ""
                            )}
                            onClick={(e) => {
                              if (isAdminType(client.role)) {
                                e.stopPropagation();
                                navigate(`/accounts/view/${client.username}`);
                              }
                            }}
                          >
                            {client.username}
                          </span>
                        </td>
                        <td className="px-2 py-2 border-r border-[#d5d8dc] text-[#212529]">
                          {getTypeLabel(client.role)}
                        </td>
                        <td className="px-2 py-2 border-r border-[#d5d8dc] text-right text-[#212529]">
                          {display.isLoaded ? display.credit?.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-400 text-[11px]">
                          {isExpanded ? "▲" : "▼"}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-white">
                          <td colSpan={4} className="px-3 py-2 border-b border-[#d5d8dc]">
                            <ul className="text-[13px] text-[#212529] space-y-0.5 mb-2">
                              <li>• Balance <span className="font-bold text-[#212529]">{display.isLoaded ? display.balance?.toLocaleString() : '-'}</span></li>
                              <li>• Client (P/L) <span className="font-bold text-[#212529]">{display.isLoaded ? display.plDownline?.toLocaleString() : '-'}</span></li>
                              <li>• Share <span className="font-bold text-[#212529]">{display.isLoaded ? display.share : '-'}</span></li>
                              <li>• Exposure <span className="font-bold text-[#212529]">0</span></li>
                              <li>• Available Balance <span className="font-bold text-[#212529]">{display.isLoaded ? display.available?.toLocaleString() : '-'}</span></li>
                            </ul>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[12px] text-[#212529] mr-1 font-bold">• Options</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/accounts/cash-credit/${client.username}`); }}
                                className="w-6 h-6 bg-[#ffc107] text-black font-black rounded text-[11px] flex items-center justify-center"
                              >C</button>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/accounts/edit/${client.username}`); }}
                                className="w-6 h-6 bg-[#28a745] text-white rounded flex items-center justify-center"
                              ><Pencil className="w-3 h-3" /></button>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/accounts/ledger/${client.username}`); }}
                                className="w-6 h-6 bg-[#17a2b8] text-white font-black rounded text-[11px] flex items-center justify-center"
                              >L</button>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleStatus(client); }}
                                className={cn(
                                  "w-6 h-6 font-black rounded text-[11px] flex items-center justify-center",
                                  client.status === "active" ? "bg-[#28a745] text-white" : "bg-white border border-[#dc3545] text-[#dc3545]"
                                )}
                              >{client.status === "active" ? "A" : "D"}</button>
                              {client.can_settle_pl && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/accounts/settle-pl/${client.username}`); }}
                                  className="w-6 h-6 bg-[#e74c3c] text-white font-black rounded text-[11px] flex items-center justify-center"
                                >S</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto border-x border-b border-[#d5d8dc]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#ecf0f1] text-[#212529] text-[12px] font-black whitespace-nowrap">
                <th 
                  onClick={() => handleSort('username')}
                  className={cn(
                    "px-2 py-2 border border-[#d5d8dc] text-left cursor-pointer select-none transition-colors",
                    sortColumn === 'username' ? "bg-[#d5d8dc]" : "hover:bg-[#e2e6e9]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    Username {getSortIcon('username')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('role')}
                  className={cn(
                    "px-2 py-2 border border-[#d5d8dc] text-left cursor-pointer select-none transition-colors",
                    sortColumn === 'role' ? "bg-[#d5d8dc]" : "hover:bg-[#e2e6e9]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    Type {getSortIcon('role')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('credit_received')}
                  className={cn(
                    "px-2 py-2 border border-[#d5d8dc] text-right cursor-pointer select-none transition-colors",
                    sortColumn === 'credit_received' ? "bg-[#d5d8dc]" : "hover:bg-[#e2e6e9]"
                  )}
                >
                  <div className="flex items-center justify-end">
                    Credit {getSortIcon('credit_received')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('cash')}
                  className={cn(
                    "px-2 py-2 border border-[#d5d8dc] text-right cursor-pointer select-none transition-colors",
                    sortColumn === 'cash' ? "bg-[#d5d8dc]" : "hover:bg-[#e2e6e9]"
                  )}
                >
                  <div className="flex items-center justify-end">
                    Balance {getSortIcon('cash')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('pl_downline')}
                  className={cn(
                    "px-2 py-2 border border-[#d5d8dc] text-right cursor-pointer select-none transition-colors",
                    sortColumn === 'pl_downline' ? "bg-[#d5d8dc]" : "hover:bg-[#e2e6e9]"
                  )}
                >
                  <div className="flex items-center justify-end">
                    Client (P/L) {getSortIcon('pl_downline')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('downline_share')}
                  className={cn(
                    "px-2 py-2 border border-[#d5d8dc] text-right cursor-pointer select-none transition-colors",
                    sortColumn === 'downline_share' ? "bg-[#d5d8dc]" : "hover:bg-[#e2e6e9]"
                  )}
                >
                  <div className="flex items-center justify-end">
                    Share {getSortIcon('downline_share')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('exposure')}
                  className={cn(
                    "px-2 py-2 border border-[#d5d8dc] text-right cursor-pointer select-none transition-colors",
                    sortColumn === 'exposure' ? "bg-[#d5d8dc]" : "hover:bg-[#e2e6e9]"
                  )}
                >
                  <div className="flex items-center justify-end">
                    Exposure {getSortIcon('exposure')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('credit_remaining')}
                  className={cn(
                    "px-2 py-2 border border-[#d5d8dc] text-right cursor-pointer select-none transition-colors",
                    sortColumn === 'credit_remaining' ? "bg-[#d5d8dc]" : "hover:bg-[#e2e6e9]"
                  )}
                >
                  <div className="flex items-center justify-end">
                    Available Balance {getSortIcon('credit_remaining')}
                  </div>
                </th>
                <th className="px-2 py-2 border border-[#d5d8dc] text-center">Options</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {/* Green Total Row */}
              {!isLoading && tableFilteredClients.length > 0 && (
                <tr className="bg-[#00b181] text-white font-black whitespace-nowrap">
                  {!balancesLoaded ? (
                    <td className="px-2 py-2 border border-[#4dbd74]" colSpan={9}>
                      <button
                        onClick={handleLoadBalance}
                        disabled={isLoadingBalances}
                        style={{
                          background: "#ffc107",
                          color: "#000",
                          border: "none",
                          padding: "4px 14px",
                          fontWeight: 700,
                          fontSize: 13,
                          borderRadius: 3,
                          cursor: "pointer"
                        }}
                      >
                        {isLoadingBalances ? "Loading..." : "Load Balance"}
                      </button>
                    </td>
                  ) : (
                    <>
                      <td className="px-2 py-2 border border-[#4dbd74]" colSpan={2}>Total</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">
                        {totals.credit_received.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">
                        {totals.cash.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">
                        {totals.pl_downline.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">-</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">0</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">
                        {totals.credit_remaining.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 border border-[#4dbd74]"></td>
                    </>
                  )}
                </tr>
              )}

              {/* Client Rows */}
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-2 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading clients...
                  </td>
                </tr>
              ) : tableFilteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-8 text-center text-gray-500 italic">No clients found</td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  const display = getClientDisplayData(client);
                  const isExpanded = expandedIds.has(client.id);

                  return (
                    <React.Fragment key={client.id}>
                      <tr className={cn(
                        "hover:bg-[#f8f9fa] border-b border-[#d5d8dc] whitespace-nowrap transition-colors",
                        isExpanded && "bg-[#f8f9fa]"
                      )}>
                        <td className="px-2 py-2 border-r border-[#d5d8dc]">
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => toggleExpand(client.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <span 
                              onClick={() => isAdminType(client.role) && navigate(`/accounts/view/${client.username}`)}
                              className={cn(
                                "font-bold text-[#212529]",
                                isAdminType(client.role) ? "cursor-pointer hover:text-[#00b181] hover:underline" : ""
                              )}
                            >
                              {client.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 border-r border-[#d5d8dc] text-gray-600">{getTypeLabel(client.role)}</td>
                        <td className="px-2 py-2 border-r border-[#d5d8dc] text-right text-[#212529]">
                          {display.isLoaded ? display.credit?.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 border-r border-[#d5d8dc] text-right text-[#212529]">
                          {display.isLoaded ? display.balance?.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 border-r border-[#d5d8dc] text-right text-[#212529]">
                          {display.isLoaded ? display.plDownline?.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 border-r border-[#d5d8dc] text-right text-[#212529]">
                          {display.isLoaded ? `${display.share}%` : "-"}
                        </td>
                        <td className="px-2 py-2 border-r border-[#d5d8dc] text-right text-[#212529]">
                          0
                        </td>
                        <td className="px-2 py-2 border-r border-[#d5d8dc] text-right text-[#212529]">
                          {display.isLoaded ? display.available?.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-1.5 border-r border-[#d5d8dc]">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => navigate(`/accounts/cash-credit/${client.username}`)}
                              className="w-6 h-6 bg-[#ffc107] hover:bg-[#e0a800] text-black font-black rounded text-[11px] flex items-center justify-center shadow-sm"
                              title="Cash/Credit"
                            >
                              C
                            </button>
                            <button
                              onClick={() => navigate(`/accounts/edit/${client.username}`)}
                              className="w-6 h-6 bg-[#28a745] hover:bg-[#218838] text-white rounded flex items-center justify-center shadow-sm"
                              title="Edit"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => navigate(`/accounts/ledger/${client.username}`)}
                              className="w-6 h-6 bg-[#17a2b8] hover:bg-[#138496] text-white font-black rounded text-[11px] flex items-center justify-center shadow-sm"
                              title="Ledger"
                            >
                              L
                            </button>
                            <button
                              onClick={() => toggleStatus(client)}
                              className={cn(
                                "w-6 h-6 font-black rounded text-[11px] flex items-center justify-center transition-colors shadow-sm",
                                client.status === "active" 
                                  ? "bg-[#28a745] hover:bg-[#218838] text-white" 
                                  : "bg-white border border-[#dc3545] text-[#dc3545] hover:bg-red-50"
                              )}
                              title={client.status === "active" ? "Deactivate" : "Activate"}
                            >
                              {client.status === "active" ? "A" : "D"}
                            </button>
                            <button
                              onClick={() => navigate(`/accounts/settle-pl/${client.username}`)}
                              className="w-6 h-6 bg-[#e74c3c] hover:bg-[#c0392b] text-white font-black rounded text-[11px] flex items-center justify-center shadow-sm"
                              title="Settle Account"
                            >
                              S
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-[#f0f3f5] text-[13px] whitespace-nowrap">
                          <td colSpan={9} className="p-0 border-b border-[#d5d8dc]">
                            <div className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                <div>
                                  <span className="text-gray-500 mr-2">Full Name:</span>
                                  <span className="font-bold">{client.full_name || client.username}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 mr-2">Created:</span>
                                  <span className="font-bold">{new Date(client.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRowRefresh(client)}
                                  disabled={rowRefreshingMap[client.id]}
                                  className="bg-[#2c3e50] hover:bg-[#1a252f] text-white px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1"
                                >
                                  {rowRefreshingMap[client.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh Balance"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && sortedClients.length > 0 && (
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            totalRecords={sortedClients.length}
            startRecord={startRecord}
            endRecord={endRecord}
          />
        )}
      </div>
    </section>
  );
}
