import React, { useState, useMemo, useEffect } from "react";
import { Pencil, User, Book, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
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
  const [balancesLoaded, setBalancesLoaded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Feature 2 states
  const [rowLoadedMap, setRowLoadedMap] = useState<Record<string, boolean>>({});
  const [rowRefreshingMap, setRowRefreshingMap] = useState<Record<string, boolean>>({});
  const [refreshedData, setRefreshedData] = useState<Record<string, any>>({});
  
  // Feature 3 state
  const [mobileExpandedIds, setMobileExpandedIds] = useState<Set<string>>(new Set());

  // DataTable states
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [tableSearch, setTableSearch] = useState("");

  const toggleMobileExpand = (id: string) => {
    const next = new Set(mobileExpandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setMobileExpandedIds(next);
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

  const handleLoadBalance = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setBalancesLoaded(true);
    setTimeout(() => setIsRefreshing(false), 800);
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
            {username} - Clients List | Default
          </span>
        </div>
      )}

      <div className="p-3">
        {/* Summary Stats Table — matches original exactly */}
        <div className="mb-3 overflow-x-auto">
          <table className="w-full border-collapse border border-[#dee2e6] text-[13px]">
            <thead>
              <tr className="bg-white">
                <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Credit Received</th>
                <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Credit Remaining</th>
                <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Cash</th>
                <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">P/L Downline</th>
                <th className="border border-[#dee2e6] px-3 py-2 text-left font-bold text-[#212529] whitespace-nowrap">Balance UpLine</th>
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
                <td className={cn("border border-[#dee2e6] px-3 py-2 font-bold", totals.cash < 0 ? "text-[#dc3545]" : "text-[#28a745]")}>
                  {totals.cash.toLocaleString()}
                </td>
                <td className={cn("border border-[#dee2e6] px-3 py-2 font-bold", totals.pl_downline < 0 ? "text-[#dc3545]" : "text-[#212529]")}>
                  {totals.pl_downline.toLocaleString()}
                </td>
                <td className={cn("border border-[#dee2e6] px-3 py-2 font-bold", totals.balance_upline < 0 ? "text-[#dc3545]" : "text-[#212529]")}>
                  {totals.balance_upline.toLocaleString()}
                </td>
                <td className="border border-[#dee2e6] px-3 py-2 font-bold text-[#212529]">
                  {filteredClients.length}
                </td>
              </tr>
            </tbody>
          </table>
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

          <div className="flex items-center gap-x-2 text-[10px] font-bold text-[#212529] uppercase flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-[#ffc107] text-black flex items-center justify-center rounded-[2px]">C</span>
              <span>Cash/Credit</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-[#254465] text-white flex items-center justify-center rounded-[2px]"><Pencil className="w-2.5 h-2.5" /></span>
              <span>Edit</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-[#17a2b8] text-white flex items-center justify-center rounded-[2px]">L</span>
              <span>Ledger</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-[#28a745] text-white flex items-center justify-center rounded-[2px]">A</span>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-white border border-[#dc3545] text-[#dc3545] flex items-center justify-center rounded-[2px]">D</span>
              <span>InActive</span>
            </div>
          </div>
        </div>

        {/* DataTable Top Controls */}
        <div className="mb-4">
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
            showBottomControls={false}
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
                  <td className="px-2 py-2 border border-[#008d4c]" colSpan={2}>Total</td>
                  <td className="px-2 py-2 border border-[#008d4c] text-right">
                    {balancesLoaded ? totals.credit_received.toLocaleString() : "-"}
                  </td>
                  <td className="px-2 py-2 border border-[#008d4c] text-right">
                    {balancesLoaded ? totals.cash.toLocaleString() : "-"}
                  </td>
                  <td className="px-2 py-2 border border-[#008d4c] text-right">
                    {balancesLoaded ? totals.pl_downline.toLocaleString() : "-"}
                  </td>
                  <td className="px-2 py-2 border border-[#008d4c] text-right">-</td>
                  <td className="px-2 py-2 border border-[#008d4c] text-right">0</td>
                  <td className="px-2 py-2 border border-[#008d4c] text-right">
                    {balancesLoaded ? totals.credit_remaining.toLocaleString() : "-"}
                  </td>
                  <td className="px-2 py-2 border border-[#008d4c] text-center"></td>
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
                  const isRefreshingRow = rowRefreshingMap[client.id];
                  
                  return (
                    <tr key={client.id} className={cn(idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]", "hover:bg-green-50/50 transition-colors whitespace-nowrap")}>
                      <td className="px-2 py-2 border border-[#d5d8dc]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRowRefresh(client)}
                            disabled={isRefreshingRow}
                            className="text-[#6c757d] hover:text-[#00a65a] transition-colors"
                          >
                            <RefreshCw className={cn("w-3 h-3", isRefreshingRow && "animate-spin text-[#00a65a]")} />
                          </button>
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
                        </div>
                      </td>
                      <td className="px-2 py-2 border border-[#d5d8dc] font-bold text-[#6c757d]">
                        {getTypeLabel(client.role)}
                      </td>
                      <td className="px-2 py-2 border border-[#d5d8dc] text-right font-black text-[#28a745]">
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
                            className="w-6 h-6 bg-[#ffc107] hover:bg-[#e0a800] text-black font-black text-[11px] flex items-center justify-center rounded-[2px] transition-colors shadow-sm"
                            title="Cash / Credit"
                          >
                            C
                          </button>
                          <button 
                            onClick={() => navigate(`/accounts/edit/${client.username}`)}
                            className="w-6 h-6 bg-[#254465] hover:bg-[#1d354f] text-white flex items-center justify-center rounded-[2px] transition-colors shadow-sm"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => navigate(`/accounts/ledger/${client.username}`)}
                            className="w-6 h-6 bg-[#17a2b8] hover:bg-[#138496] text-white font-black text-[11px] flex items-center justify-center rounded-[2px] transition-colors shadow-sm"
                            title="Ledger"
                          >
                            L
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden flex flex-col gap-3">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#00a65a] mx-auto mb-4" />
              <p className="font-bold text-gray-500">Loading clients...</p>
            </div>
          ) : paginatedClients.map((client) => {
            const display = getClientDisplayData(client);
            const isExpanded = mobileExpandedIds.has(client.id);
            const isRefreshingRow = rowRefreshingMap[client.id];

            return (
              <div key={client.id} className="border border-[#d5d8dc] rounded-lg overflow-hidden bg-white shadow-sm">
                <div 
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleMobileExpand(client.id)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowRefresh(client);
                      }}
                      disabled={isRefreshingRow}
                      className="text-[#6c757d] hover:text-[#00a65a]"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", isRefreshingRow && "animate-spin text-[#00a65a]")} />
                    </button>
                    <div className="flex flex-col">
                      <span className="font-black text-[#254465]">{client.username}</span>
                      <span className="text-[10px] text-gray-500 uppercase font-bold">{getTypeLabel(client.role)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "font-black text-sm",
                        display.balance !== null ? (display.balance >= 0 ? "text-[#28a745]" : "text-[#dc3545]") : "text-gray-400"
                      )}>
                        {display.balance !== null ? display.balance.toLocaleString() : "-"}
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Balance</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-2 gap-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Credit</span>
                        <span className="font-black text-[#28a745]">{display.credit?.toLocaleString() ?? "-"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Client P/L</span>
                        <span className={cn(
                          "font-black",
                          display.plDownline !== null ? (display.plDownline >= 0 ? "text-[#28a745]" : "text-[#dc3545]") : "text-gray-400"
                        )}>{display.plDownline?.toLocaleString() ?? "-"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Share</span>
                        <span className="font-black">{display.share !== null ? `${display.share}%` : "-"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Available</span>
                        <span className="font-black text-[#28a745]">{display.available?.toLocaleString() ?? "-"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button 
                        onClick={() => navigate(`/accounts/cash-credit/${client.username}`)}
                        className="flex-1 bg-[#ffc107] text-black font-black text-xs py-2 rounded flex items-center justify-center gap-2"
                      >
                        CASH/CREDIT
                      </button>
                      <button 
                        onClick={() => navigate(`/accounts/edit/${client.username}`)}
                        className="flex-1 bg-[#254465] text-white font-black text-xs py-2 rounded flex items-center justify-center gap-2"
                      >
                        <Pencil className="w-3.5 h-3.5" /> EDIT
                      </button>
                      <button 
                        onClick={() => navigate(`/accounts/ledger/${client.username}`)}
                        className="flex-1 bg-[#17a2b8] text-white font-black text-xs py-2 rounded flex items-center justify-center gap-2"
                      >
                        LEDGER
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
