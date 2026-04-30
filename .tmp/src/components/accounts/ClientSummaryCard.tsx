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
    const query = localSearch.toLowerCase() || searchFilter.toLowerCase();
    return clients.filter(
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
    <section className="bg-white border border-[#d0d0d0] shadow-sm rounded-[10px] overflow-hidden mb-4" style={{ fontFamily: "Roboto, system-ui, sans-serif" }}>
      {/* Card title */}
      {!hideHeader && (
        <div className="bg-[#ecf0f1] border-b border-[#d0d0d0] px-[14px] py-2">
          <span className="font-bold text-sm text-[#212529]">
            {username} - Clients List{!balancesLoaded ? " | Default" : ""}
          </span>
        </div>
      )}

      <div className="p-3">
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
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#28a745]">0</td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#28a745]">0</td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#28a745]">0</td>
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
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#28a745]">
                    {totals.credit_received.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#28a745]">
                    {totals.credit_remaining.toLocaleString()}
                  </td>
                  <td className={cn("border border-[#dee2e6] px-3 py-2 font-bold", 
                    totals.cash < 0 ? "text-[#dc3545]" : "text-[#28a745]")}>
                    {totals.cash.toLocaleString()}
                  </td>
                  <td className={cn("border border-[#dee2e6] px-3 py-2 font-bold", 
                    totals.pl_downline < 0 ? "text-[#dc3545]" : "text-[#28a745]")}>
                    {totals.pl_downline.toLocaleString()}
                  </td>
                  <td className={cn("border border-[#dee2e6] px-3 py-2 font-bold", 
                    totals.balance_upline < 0 ? "text-[#dc3545]" : "text-[#28a745]")}>
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {!hideCreateButton && (
              <button
                onClick={() => navigate("/accounts/create")}
                className="bg-[#00a65a] hover:bg-[#008d4c] text-white font-bold text-[13px] py-1.5 px-4 rounded-[4px] flex items-center gap-2 transition-colors shadow-sm"
              >
                <User className="w-4 h-4" /> New User
              </button>
            )}
            <button
              onClick={() => navigate(`/reports/daily`)}
              className="bg-[#00a65a] hover:bg-[#008d4c] text-white font-bold text-[13px] py-1.5 px-4 rounded-[4px] flex items-center gap-2 transition-colors shadow-sm"
            >
              <Book className="w-4 h-4" /> Account Ledger
            </button>
          </div>

          <div className="flex items-center gap-x-2 text-[10px] font-bold text-[#212529] uppercase flex-wrap gap-y-1">
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



        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto border-x border-b border-[#d5d8dc]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#ecf0f1] text-[#212529] text-[11px] font-black uppercase whitespace-nowrap">
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
            <tbody className="text-[12px]">
              {/* Green Total Row */}
              {!isLoading && tableFilteredClients.length > 0 && (
                <tr className="bg-[#00a65a] text-white font-black whitespace-nowrap">
                  {!balancesLoaded ? (
                    <td className="px-2 py-2 border border-[#008d4c]" colSpan={9}>
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
                      <td className="px-2 py-2 border border-[#008d4c]" colSpan={2}>Total</td>
                      <td className="px-2 py-2 border border-[#008d4c] text-right">
                        {totals.credit_received.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 border border-[#008d4c] text-right">
                        {totals.cash.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 border border-[#008d4c] text-right">
                        {totals.pl_downline.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 border border-[#008d4c] text-right">-</td>
                      <td className="px-2 py-2 border border-[#008d4c] text-right">0</td>
                      <td className="px-2 py-2 border border-[#008d4c] text-right">
                        {totals.credit_remaining.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 border border-[#008d4c] text-center"></td>
                    </>
                  )}
                </tr>
              )}

              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-[#212529] bg-white">
                    <Loader2 className="w-6 h-6 animate-spin text-[#00a65a] mx-auto mb-2" />
                    <span className="font-bold">Loading clients data...</span>
                  </td>
                </tr>
              ) : paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-[#212529] bg-white font-bold">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client, idx) => {
                  const roleLower = client.role?.toLowerCase();
                  const isAdminType = ['admin', 'supermaster', 'superadmin', 'company'].includes(roleLower);
                  const display = getClientDisplayData(client);
                  
                  return (
                    <tr key={client.id} className={cn(idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]", "hover:bg-green-50/50 transition-colors whitespace-nowrap")}>
                      <td className="px-2 py-2 border border-[#d5d8dc]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (isAdminType) {
                                navigate(`/accounts/view/${client.username}`);
                              }
                            }}
                            className={cn(
                              "font-black text-left",
                              isAdminType ? "text-[#254465] hover:underline" : "text-[#212529]"
                            )}
                          >
                            {client.username}
                          </button>
                          {!balancesLoaded && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 16, height: 16, borderRadius: "50%", 
                              background: "#555", color: "#fff", fontSize: 10, fontWeight: 700,
                              marginLeft: 4, flexShrink: 0
                            }}>i</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 border border-[#d5d8dc] font-bold text-[#6c757d]">
                        {getTypeLabel(client.role)}
                      </td>
                      <td className="px-2 py-2 border border-[#d5d8dc] text-right font-black text-[#212529]">
                        {display.credit !== null ? display.credit.toLocaleString() : "-"}
                      </td>
                      <td className={cn(
                        "px-2 py-2 border border-[#d5d8dc] text-right font-black",
                        display.balance !== null ? (display.balance >= 0 ? "text-[#28a745]" : "text-[#dc3545]") : "text-gray-400"
                      )}>
                        {display.balance !== null ? display.balance.toLocaleString() : "-"}
                      </td>
                      <td className={cn(
                        "px-2 py-2 border border-[#d5d8dc] text-right font-black",
                        display.plDownline !== null ? (display.plDownline >= 0 ? "text-[#28a745]" : "text-[#dc3545]") : "text-gray-400"
                      )}>
                        {display.plDownline !== null ? display.plDownline.toLocaleString() : "-"}
                      </td>
                      <td className="px-2 py-2 border border-[#d5d8dc] text-right font-bold text-[#212529]">
                        {display.share !== null ? `${display.share}%` : "-"}
                      </td>
                      <td className="px-2 py-2 border border-[#d5d8dc] text-right font-bold text-[#dc3545]">
                        {display.isLoaded ? "0" : "-"}
                      </td>
                      <td className="px-2 py-2 border border-[#d5d8dc] text-right font-black text-[#28a745]">
                        {display.available !== null ? display.available.toLocaleString() : "-"}
                      </td>
                      <td className="px-2 py-1 border border-[#d5d8dc] text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => navigate(`/accounts/cash-credit/${client.username}`)}
                            className="w-6 h-6 bg-[#ffc107] hover:bg-[#e0a800] text-black font-black text-[11px] flex items-center justify-center rounded transition-colors shadow-sm"
                            title="Cash / Credit"
                          >
                            C
                          </button>
                          <button 
                            onClick={() => navigate(`/accounts/edit/${client.username}`)}
                            className="w-6 h-6 bg-[#28a745] hover:bg-[#218838] text-white flex items-center justify-center rounded transition-colors shadow-sm"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => navigate(`/accounts/ledger/${client.username}`)}
                            className="w-6 h-6 bg-[#17a2b8] hover:bg-[#138496] text-white font-black text-[11px] flex items-center justify-center rounded transition-colors shadow-sm"
                            title="Ledger"
                          >
                            L
                          </button>
                          <button 
                            onClick={() => toggleStatus(client)}
                            className={cn(
                              "w-6 h-6 font-black text-[11px] flex items-center justify-center rounded transition-colors shadow-sm",
                              client.status === "active" 
                                ? "bg-[#28a745] hover:bg-[#218838] text-white" 
                                : "bg-white border border-[#dc3545] text-[#dc3545] hover:bg-red-50"
                            )}
                            title={client.status === "active" ? "Deactivate" : "Activate"}
                          >
                            {client.status === "active" ? "A" : "D"}
                          </button>
                          {client.can_settle_pl && (
                            <button 
                              onClick={() => navigate(`/accounts/settle-pl/${client.username}`)}
                              className="w-6 h-6 bg-[#6f42c1] hover:bg-[#5a32a3] text-white font-black text-[11px] flex items-center justify-center rounded transition-colors shadow-sm"
                              title="Settle Account"
                            >
                              S
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE TABLE VIEW — exact clone of screenshot */}
        <div className="lg:hidden overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              {/* COLUMN HEADERS */}
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 15, color: "#212529", borderBottom: "2px solid #ddd", borderRight: "1px solid #ddd", minWidth: 110 }}>Username</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 15, color: "#212529", borderBottom: "2px solid #ddd", borderRight: "1px solid #ddd" }}>Type</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 15, color: "#212529", borderBottom: "2px solid #ddd", borderRight: "1px solid #ddd" }}>Credit</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 15, color: "#212529", borderBottom: "2px solid #ddd" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* GREEN TOTAL ROW */}
              {!isLoading && tableFilteredClients.length > 0 && (
                !balancesLoaded ? (
                  <tr style={{ backgroundColor: "#00a65a" }}>
                    <td colSpan={4} style={{ padding: "10px 12px" }}>
                      <button onClick={handleLoadBalance} disabled={isLoadingBalances}
                        style={{ backgroundColor: "#ffc107", color: "#000", border: "none", padding: "6px 20px", fontWeight: 900, fontSize: 14, borderRadius: 5, cursor: "pointer" }}>
                        {isLoadingBalances ? "Loading..." : "Load Balance"}
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr style={{ backgroundColor: "#00a65a" }}>
                    <td colSpan={2} style={{ padding: "10px 12px", color: "#fff", fontWeight: 700, fontSize: 15 }}>Total</td>
                    <td style={{ padding: "10px 12px", color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "right", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
                      {totals.credit_received.toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "right", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
                      {totals.cash.toLocaleString()}
                    </td>
                  </tr>
                )
              )}

              {/* LOADING STATE */}
              {isLoading && (
                <tr>
                  <td colSpan={4} style={{ padding: "40px 0", textAlign: "center" }}>
                    <Loader2 className="w-6 h-6 animate-spin text-[#00a65a] mx-auto mb-2" />
                    <span style={{ fontSize: 15, fontWeight: 700 }}>Loading...</span>
                  </td>
                </tr>
              )}

              {/* EMPTY STATE */}
              {!isLoading && paginatedClients.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "32px 0", textAlign: "center", fontSize: 15, fontWeight: 700, color: "#6c757d" }}>
                    No users found
                  </td>
                </tr>
              )}

              {/* USER ROWS — each user = 2 rows */}
              {!isLoading && paginatedClients.map((client, idx) => {
                const display = getClientDisplayData(client);
                const roleLower = client.role?.toLowerCase();
                const isAdminType = ['admin', 'supermaster', 'superadmin', 'company'].includes(roleLower);
                
                return (
                  <React.Fragment key={client.id}>
                    {/* ROW A - 4 columns: Username | Type | Credit | Balance */}
                    <tr style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #e5e5e5" }}>
                      {/* Username cell */}
                      <td style={{ padding: "10px 12px", fontSize: 15, lineHeight: "22px", borderRight: "1px solid #e5e5e5" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{ 
                              fontWeight: 700, 
                              cursor: "pointer",
                              color: isAdminType ? "#00a65a" : "#212529"
                            }}
                            onClick={() => navigate(`/accounts/view/${client.username}`)}
                          >
                            {client.username}
                          </span>
                          {/* Show ℹ expand button only before load */}
                          {!balancesLoaded && (
                            <button
                              onClick={() => toggleExpand(client.id)}
                              style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#333", color: "#fff", border: "none", fontSize: 12, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                            >i</button>
                          )}
                        </div>
                      </td>
                      
                      {/* Type cell */}
                      <td style={{ padding: "10px 12px", fontSize: 15, lineHeight: "22px", fontWeight: 400, color: "#6c757d", borderRight: "1px solid #e5e5e5" }}>
                        {getTypeLabel(client.role)}
                      </td>
                      
                      {/* Credit cell — dark text, not green */}
                      <td style={{ padding: "10px 12px", fontSize: 15, lineHeight: "22px", fontWeight: 700, textAlign: "right", color: "#212529", borderRight: "1px solid #e5e5e5" }}>
                        {!balancesLoaded ? "-" : (display.credit ?? 0).toLocaleString()}
                      </td>

                      {/* Balance cell — dark text */}
                      <td style={{ padding: "10px 12px", fontSize: 15, lineHeight: "22px", fontWeight: 700, textAlign: "right", color: "#212529" }}>
                        {!balancesLoaded ? "-" : (display.balance ?? 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* ROW B - expanded bullet card */}
                    {(balancesLoaded || expandedIds.has(client.id)) && (
                      <tr style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                        <td colSpan={4} style={{ padding: "4px 14px 14px 14px", borderBottom: "1px solid #e5e5e5" }}>
                          <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 14, color: "#212529" }}>
                            
                            <li style={{ padding: "2px 0" }}>
                              • Balance {balancesLoaded ? (display.balance ?? 0).toLocaleString() : "-"}
                            </li>
                            
                            <li style={{ padding: "2px 0" }}>
                              • Client (P/L) {balancesLoaded ? (display.plDownline ?? 0).toLocaleString() : "-"}
                            </li>
                            
                            <li style={{ padding: "2px 0" }}>
                              • Share {balancesLoaded ? (display.share ?? 0) : "-"}
                            </li>
                            
                            <li style={{ padding: "2px 0" }}>
                              • Exposure 0
                            </li>
                            
                            <li style={{ padding: "2px 0" }}>
                              • Available Balance {balancesLoaded ? (display.available ?? 0).toLocaleString() : "-"}
                            </li>
                            
                            {/* Options buttons */}
                            <li style={{ padding: "4px 0", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span>• Options </span>
                              
                              <button style={{ width: 32, height: 32, backgroundColor: "#ffc107", color: "#000", border: "none", borderRadius: 4, fontWeight: 900, fontSize: 14, cursor: "pointer" }}
                                onClick={() => navigate(`/accounts/cash-credit/${client.username}`)}>C</button>
                              
                              <button style={{ width: 32, height: 32, backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                onClick={() => navigate(`/accounts/edit/${client.username}`)}>
                                <Pencil style={{ width: 14, height: 14 }} />
                              </button>
                              
                              <button style={{ width: 32, height: 32, backgroundColor: "#17a2b8", color: "#fff", border: "none", borderRadius: 4, fontWeight: 900, fontSize: 14, cursor: "pointer" }}
                                onClick={() => navigate(`/accounts/ledger/${client.username}`)}>L</button>
                              
                              <button
                                style={{ 
                                  width: 32, height: 32, borderRadius: 4, fontWeight: 900, fontSize: 14, cursor: "pointer",
                                  backgroundColor: client.status === "active" ? "#28a745" : "#fff",
                                  color: client.status === "active" ? "#fff" : "#dc3545",
                                  border: client.status === "active" ? "none" : "2px solid #dc3545"
                                }}
                                onClick={() => toggleStatus(client)}>
                                {client.status === "active" ? "A" : "D"}
                              </button>
                              
                              {client.can_settle_pl && (
                                <button style={{ width: 32, height: 32, backgroundColor: "#e74c3c", color: "#fff", border: "none", borderRadius: 4, fontWeight: 900, fontSize: 14, cursor: "pointer" }}
                                  onClick={() => navigate(`/accounts/settle-pl/${client.username}`)}>S</button>
                              )}
                            </li>
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* DataTable Bottom Controls */}
        <div className="mt-4">
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={sortedClients.length}
            pageSize={pageSize}
            startRecord={startRecord}
            endRecord={endRecord}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            searchValue={tableSearch}
            onSearchChange={setTableSearch}
            showTopControls={false}
          />
        </div>
      </div>
    </section>
  );
}
