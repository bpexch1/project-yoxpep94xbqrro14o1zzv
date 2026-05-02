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
  adminRecord?: any;
}

export function ClientSummaryCard({ 
  clients, 
  isLoading, 
  username = "Admin", 
  searchFilter = "",
  onRefresh,
  hideCreateButton = false,
  hideHeader = false,
  adminRecord,
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

  const getAmountColor = (value: number) => {
    if (value > 0) return "#00b181";
    if (value < 0) return "#dc3545";
    return "#212529";
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

  const summaryData = adminRecord ? {
    credit_received: adminRecord.credit_received || 0,
    credit_remaining: adminRecord.credit_remaining || 0,
    cash: adminRecord.cash || 0,
    pl_downline: adminRecord.pl_downline || 0,
    balance_upline: adminRecord.balance_upline || 0,
  } : totals;

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
        <div style={{ backgroundColor: "#dcdcdc", borderBottom: "1px solid #c8c8c8", padding: "8px 10px" }}>
          <span className="font-bold" style={{ color: "#2d2d2d", fontSize: "14px" }}>
            {username} - Clients List{!balancesLoaded ? " | Default" : ""}
          </span>
        </div>
      )}

      <div style={{ padding: "8px 6px" }}>
        {/* Summary Stats Table */}
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
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold" style={{ color: "#212529", fontWeight: 700 }}>0</td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold" style={{ color: "#212529", fontWeight: 700 }}>0</td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold" style={{ color: "#212529", fontWeight: 700 }}>0</td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold" style={{ color: "#212529", fontWeight: 700 }}>{filteredClients.length}</td>
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
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold" style={{ color: getAmountColor(summaryData.credit_received) }}>
                    {summaryData.credit_received.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold" style={{ color: getAmountColor(summaryData.credit_remaining) }}>
                    {summaryData.credit_remaining.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold" style={{ color: getAmountColor(summaryData.cash) }}>
                    {summaryData.cash.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold" style={{ color: getAmountColor(summaryData.pl_downline) }}>
                    {summaryData.pl_downline.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-2 font-bold" style={{ color: getAmountColor(summaryData.balance_upline) }}>
                    {summaryData.balance_upline.toLocaleString()}
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
                    <td colSpan={3} className="px-2 py-2 border border-[#4dbd74]">
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
                    <td colSpan={3} style={{ background: "#00b181", padding: "6px 10px", border: "1px solid #4dbd74" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Total</span>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{summaryData.credit_received.toLocaleString()}</span>
                      </div>
                    </td>
                  )}
                </tr>
              )}

              {/* COLUMN HEADER ROW — below total row */}
              <tr style={{ background: "#fff" }}>
                <th className="px-2 py-2 border border-[#d5d8dc] text-left text-[13px] font-bold text-[#212529]">Username</th>
                <th className="px-2 py-2 border border-[#d5d8dc] text-left text-[13px] font-bold text-[#212529]">Type</th>
                <th className="px-2 py-2 border border-[#d5d8dc] text-right text-[13px] font-bold text-[#212529]">Credit</th>
              </tr>

              {/* USER ROWS */}
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-2 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : tableFilteredClients.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-2 py-8 text-center text-gray-500 italic">No clients found</td>
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
                            style={{ fontWeight: 700, fontSize: 13, color: isAdminType(client.role) ? "#00b181" : "#212529", cursor: isAdminType(client.role) ? "pointer" : "default" }}
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
                      </tr>
                      {isExpanded && (
                        <tr className="bg-white">
                          <td colSpan={3} className="px-3 py-2 border-b border-[#d5d8dc]">
                            <ul className="text-[13px] text-[#212529] space-y-0.5 mb-2">
                              <li>• Balance <span className="font-bold" style={{ color: display.isLoaded ? getAmountColor(display.balance ?? 0) : "#212529" }}>
                                {display.isLoaded ? display.balance?.toLocaleString() : '-'}
                              </span></li>
                              <li>• Client (P/L) <span className="font-bold" style={{ color: display.isLoaded ? getAmountColor(display.plDownline ?? 0) : "#212529" }}>
                                {display.isLoaded ? display.plDownline?.toLocaleString() : '-'}
                              </span></li>
                              <li>• Share <span className="font-bold" style={{ color: "#212529" }}>{display.isLoaded ? display.share : '-'}</span></li>
                              <li>• Exposure <span className="font-bold" style={{ color: "#212529" }}>0</span></li>
                              <li>• Available Balance <span className="font-bold" style={{ color: display.isLoaded ? getAmountColor(display.available ?? 0) : "#212529" }}>
                                {display.isLoaded ? display.available?.toLocaleString() : '-'}
                              </span></li>
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
                                className="w-6 h-6 bg-[#17a2b8] text-white rounded text-[11px] font-black flex items-center justify-center"
                              >L</button>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleStatus(client); }}
                                className={cn(
                                  "w-6 h-6 rounded text-[11px] font-black flex items-center justify-center",
                                  client.status === "active" ? "bg-[#28a745] text-white" : "bg-white border border-[#dc3545] text-[#dc3545]"
                                )}
                              >
                                {client.status === "active" ? "A" : "D"}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/accounts/settle-pl/${client.username}`); }}
                                className="w-6 h-6 bg-[#e74c3c] text-white rounded text-[11px] font-black flex items-center justify-center"
                              >S</button>
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
          
          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="mt-3 flex justify-center">
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRecords={sortedClients.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse text-[13px]" style={{ fontFamily: "Roboto, system-ui, sans-serif" }}>
            <thead>
              <tr style={{ background: "#dcdcdc", borderBottom: "1px solid #c8c8c8" }}>
                <th onClick={() => handleSort('username')} className="px-2 py-2 border-r border-[#c8c8c8] text-left font-bold text-[#2d2d2d] cursor-pointer whitespace-nowrap">
                  User Name {getSortIcon('username')}
                </th>
                <th onClick={() => handleSort('role')} className="px-2 py-2 border-r border-[#c8c8c8] text-left font-bold text-[#2d2d2d] cursor-pointer whitespace-nowrap">
                  Type {getSortIcon('role')}
                </th>
                <th onClick={() => handleSort('credit_received')} className="px-2 py-2 border-r border-[#c8c8c8] text-right font-bold text-[#2d2d2d] cursor-pointer whitespace-nowrap">
                  Credit {getSortIcon('credit_received')}
                </th>
                <th onClick={() => handleSort('cash')} className="px-2 py-2 border-r border-[#c8c8c8] text-right font-bold text-[#2d2d2d] cursor-pointer whitespace-nowrap">
                  Balance {getSortIcon('cash')}
                </th>
                <th onClick={() => handleSort('pl_downline')} className="px-2 py-2 border-r border-[#c8c8c8] text-right font-bold text-[#2d2d2d] cursor-pointer whitespace-nowrap">
                  Client (P/L) {getSortIcon('pl_downline')}
                </th>
                <th onClick={() => handleSort('downline_share')} className="px-2 py-2 border-r border-[#c8c8c8] text-right font-bold text-[#2d2d2d] cursor-pointer whitespace-nowrap">
                  Share {getSortIcon('downline_share')}
                </th>
                <th className="px-2 py-2 border-r border-[#c8c8c8] text-right font-bold text-[#2d2d2d] whitespace-nowrap">
                  Exposure
                </th>
                <th onClick={() => handleSort('credit_remaining')} className="px-2 py-2 border-r border-[#c8c8c8] text-right font-bold text-[#2d2d2d] cursor-pointer whitespace-nowrap">
                  Available Balance {getSortIcon('credit_remaining')}
                </th>
                <th className="px-2 py-2 text-center font-bold text-[#2d2d2d] whitespace-nowrap">
                  Options
                </th>
              </tr>
            </thead>
            <tbody>
              {/* GREEN TOTAL ROW — always first */}
              {!isLoading && (
                <tr style={{ background: "#00b181", color: "#fff", fontWeight: 700 }}>
                  {!balancesLoaded ? (
                    <td colSpan={9} className="px-2 py-2 border border-[#4dbd74]">
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
                      <td colSpan={2} className="px-2 py-2 border border-[#4dbd74]">Total</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">{summaryData.credit_received.toLocaleString()}</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">{summaryData.cash.toLocaleString()}</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">{summaryData.pl_downline.toLocaleString()}</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">-</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">0</td>
                      <td className="px-2 py-2 border border-[#4dbd74] text-right">{summaryData.credit_remaining.toLocaleString()}</td>
                      <td className="px-2 py-2 border border-[#4dbd74]"></td>
                    </>
                  )}
                </tr>
              )}

              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-2 py-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    Loading clients...
                  </td>
                </tr>
              ) : tableFilteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-12 text-center text-gray-500 italic">No clients found matching your search</td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  const display = getClientDisplayData(client);
                  return (
                    <tr key={client.id} className="border-b border-[#dee2e6] hover:bg-[#f8f9fa]">
                      <td className="px-2 py-2 border-r border-[#dee2e6]">
                        <span
                          style={{ fontWeight: 700, fontSize: 13, color: isAdminType(client.role) ? "#00b181" : "#212529", cursor: isAdminType(client.role) ? "pointer" : "default" }}
                          onClick={() => {
                            if (isAdminType(client.role)) {
                              navigate(`/accounts/view/${client.username}`);
                            }
                          }}
                        >
                          {client.username}
                        </span>
                      </td>
                      <td className="px-2 py-2 border-r border-[#dee2e6] text-[#212529]">
                        {getTypeLabel(client.role)}
                      </td>
                      <td className="px-2 py-2 border-r border-[#dee2e6] text-right text-[#212529]">
                        {display.isLoaded ? display.credit?.toLocaleString() : "-"}
                      </td>
                      <td className="px-2 py-2 border-r border-[#dee2e6] text-right font-bold" style={{ color: display.isLoaded ? getAmountColor(display.balance ?? 0) : "#212529" }}>
                        {display.isLoaded ? display.balance?.toLocaleString() : "-"}
                      </td>
                      <td className="px-2 py-2 border-r border-[#dee2e6] text-right font-bold" style={{ color: display.isLoaded ? getAmountColor(display.plDownline ?? 0) : "#212529" }}>
                        {display.isLoaded ? display.plDownline?.toLocaleString() : "-"}
                      </td>
                      <td className="px-2 py-2 border-r border-[#dee2e6] text-right text-[#212529]">
                        {display.isLoaded ? display.share : "-"}
                      </td>
                      <td className="px-2 py-2 border-r border-[#dee2e6] text-right text-[#212529]">
                        0
                      </td>
                      <td className="px-2 py-2 border-r border-[#dee2e6] text-right font-bold" style={{ color: display.isLoaded ? getAmountColor(display.available ?? 0) : "#212529" }}>
                        {display.isLoaded ? display.available?.toLocaleString() : "-"}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/accounts/cash-credit/${client.username}`)}
                            title="Cash/Credit"
                            className="w-6 h-6 bg-[#ffc107] text-black font-black rounded text-[11px] flex items-center justify-center hover:opacity-80 transition-opacity"
                          >C</button>
                          <button
                            onClick={() => navigate(`/accounts/edit/${client.username}`)}
                            title="Edit"
                            className="w-6 h-6 bg-[#28a745] text-white rounded flex items-center justify-center hover:opacity-80 transition-opacity"
                          ><Pencil className="w-3 h-3" /></button>
                          <button
                            onClick={() => navigate(`/accounts/ledger/${client.username}`)}
                            title="Ledger"
                            className="w-6 h-6 bg-[#17a2b8] text-white rounded text-[11px] font-black flex items-center justify-center hover:opacity-80 transition-opacity"
                          >L</button>
                          <button
                            onClick={() => toggleStatus(client)}
                            title={client.status === "active" ? "Deactivate" : "Activate"}
                            className={cn(
                              "w-6 h-6 rounded text-[11px] font-black flex items-center justify-center hover:opacity-80 transition-opacity",
                              client.status === "active" ? "bg-[#28a745] text-white" : "bg-white border border-[#dc3545] text-[#dc3545]"
                            )}
                          >
                            {client.status === "active" ? "A" : "D"}
                          </button>
                          <button
                            onClick={() => navigate(`/accounts/settle-pl/${client.username}`)}
                            title="Settle Account"
                            className="w-6 h-6 bg-[#e74c3c] text-white rounded text-[11px] font-black flex items-center justify-center hover:opacity-80 transition-opacity"
                          >S</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          {/* Desktop Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRecords={sortedClients.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
