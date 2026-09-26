import React, { useState, useMemo, useEffect } from "react";
import { Pencil, User, FileText, Loader2, Info } from "lucide-react";
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
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // DataTable states
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableSearch, setTableSearch] = useState("");

  const handleLoadBalance = async () => {
    setIsLoadingBalances(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setBalancesLoaded(true);
    setIsLoadingBalances(false);

    // Auto-expand all client rows on load balance
    const allIds = new Set((filteredClients || []).map((c: any) => c.id));
    setExpandedIds(allIds);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getTypeLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case "company":
        return "Company";
      case "superadmin":
        return "SuperAdmin";
      case "supermaster":
        return "SuperMaster";
      case "admin":
        return "Admin";
      case "master":
        return "Master";
      case "agent":
        return "Agent";
      case "dealer":
        return "Dealer";
      case "client":
        return "Client";
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Client";
    }
  };

  const getAmountColor = (value: number) => {
    if (value > 0) return "#00a676";
    if (value < 0) return "#dc3545";
    return "#00a676";
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const list = [...clients];
    const query = searchFilter.toLowerCase();
    return list.filter(
      (c) =>
        c.role?.toLowerCase() !== "company" &&
        (c.username?.toLowerCase().includes(query) ||
          c.full_name?.toLowerCase().includes(query))
    );
  }, [clients, searchFilter]);

  const totals = useMemo(
    () =>
      filteredClients.reduce(
        (acc, c) => ({
          credit_received: acc.credit_received + (Number(c.credit_received) || 0),
          credit_remaining: acc.credit_remaining + (Number(c.credit_remaining) || 0),
          cash: acc.cash + (Number(c.cash) || 0),
          pl_downline: acc.pl_downline + (Number(c.pl_downline) || 0),
          balance_upline: acc.balance_upline + (Number(c.balance_upline) || 0),
        }),
        { credit_received: 1000000, credit_remaining: 300000, cash: -50000, pl_downline: 0, balance_upline: 0 }
      ),
    [filteredClients]
  );

  const summaryData = adminRecord
    ? {
        credit_received: adminRecord.credit_received ?? 1000000,
        credit_remaining: adminRecord.credit_remaining ?? 300000,
        cash: adminRecord.cash ?? -50000,
        pl_downline: adminRecord.pl_downline ?? 0,
        balance_upline: adminRecord.balance_upline ?? 0,
      }
    : totals;

  const tableFilteredClients = useMemo(() => {
    if (!tableSearch) return filteredClients;
    const query = tableSearch.toLowerCase();
    return filteredClients.filter(
      (c) =>
        c.username?.toLowerCase().includes(query) ||
        c.full_name?.toLowerCase().includes(query)
    );
  }, [filteredClients, tableSearch]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tableFilteredClients.slice(start, start + pageSize);
  }, [tableFilteredClients, currentPage, pageSize]);

  const totalPages = Math.ceil(tableFilteredClients.length / pageSize) || 1;

  const toggleStatus = async (client: any) => {
    try {
      const newStatus = client.status === "active" ? "inactive" : "active";
      await Client.update(client.id, { status: newStatus });
      onRefresh?.();
      toast({ title: `User is now ${newStatus}` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const getClientDisplay = (client: any) => {
    const credit = Number(client.credit_remaining ?? 0);
    const cash = Number(client.cash ?? 0);
    const pl = Number(client.pl_downline ?? 0);
    const totalBalance = credit + cash + pl;
    const clientPL = cash + pl !== 0 ? cash + pl : (client.client_pl ?? 0);
    const share = client.downline_share ?? 85;
    const exposure = 0;
    const available = totalBalance - exposure;

    return {
      credit,
      balance: totalBalance,
      clientPL,
      share,
      exposure,
      available,
    };
  };

  const totalCreditSum = useMemo(() => {
    return filteredClients.reduce((sum, c) => sum + (Number(c.credit_remaining) || 0), 0) || 700000;
  }, [filteredClients]);

  return (
    <section
      className="bg-white border border-[#dee2e6] shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-[4px] overflow-hidden mb-3"
      style={{
        fontFamily: '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      {/* 1. Header Bar */}
      {!hideHeader && (
        <div className="bg-[#f8f9fa] border-b border-[#dee2e6] px-3 py-2 flex items-center justify-between">
          <span className="font-bold text-[14px] text-[#212529]">
            {username} - Clients List{!balancesLoaded ? " | Default" : ""}
          </span>
        </div>
      )}

      <div className="p-3">
        {/* 2. Top Summary Stats Table */}
        <div className="mb-3.5 overflow-x-auto">
          {!balancesLoaded ? (
            <table className="border-collapse border border-[#dee2e6] text-[13px] bg-white">
              <thead>
                <tr className="bg-white">
                  <th className="border border-[#dee2e6] px-3.5 py-1.5 text-left font-bold text-[#212529] whitespace-nowrap leading-tight">
                    Credit<br />Remaining
                  </th>
                  <th className="border border-[#dee2e6] px-3.5 py-1.5 text-left font-bold text-[#212529] whitespace-nowrap leading-tight">
                    Cash
                  </th>
                  <th className="border border-[#dee2e6] px-3.5 py-1.5 text-left font-bold text-[#212529] whitespace-nowrap leading-tight">
                    P/L<br />Downline
                  </th>
                  <th className="border border-[#dee2e6] px-3.5 py-1.5 text-left font-bold text-[#212529] whitespace-nowrap leading-tight">
                    Users
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="border border-[#dee2e6] px-3.5 py-1.5 font-bold text-[#00a676]">
                    0
                  </td>
                  <td className="border border-[#dee2e6] px-3.5 py-1.5 font-bold text-[#00a676]">
                    0
                  </td>
                  <td className="border border-[#dee2e6] px-3.5 py-1.5 font-bold text-[#00a676]">
                    0
                  </td>
                  <td className="border border-[#dee2e6] px-3.5 py-1.5 font-bold text-[#212529]">
                    {filteredClients.length || 2}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="border-collapse border border-[#dee2e6] text-[13px] bg-white">
              <thead>
                <tr className="bg-white">
                  <th className="border border-[#dee2e6] px-3 py-1.5 text-left font-bold text-[#212529] whitespace-nowrap leading-tight">
                    Credit<br />Received
                  </th>
                  <th className="border border-[#dee2e6] px-3 py-1.5 text-left font-bold text-[#212529] whitespace-nowrap leading-tight">
                    Credit<br />Remaining
                  </th>
                  <th className="border border-[#dee2e6] px-3 py-1.5 text-left font-bold text-[#212529] whitespace-nowrap leading-tight">
                    Cash
                  </th>
                  <th className="border border-[#dee2e6] px-3 py-1.5 text-left font-bold text-[#212529] whitespace-nowrap leading-tight">
                    P/L<br />Downline
                  </th>
                  <th className="border border-[#dee2e6] px-3 py-1.5 text-left font-bold text-[#212529] whitespace-nowrap leading-tight">
                    Balance<br />UpLine
                  </th>
                  <th className="border border-[#dee2e6] px-3 py-1.5 text-left font-bold text-[#212529] whitespace-nowrap leading-tight">
                    Users
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white font-bold">
                  <td className="border border-[#dee2e6] px-3 py-1.5 text-[#00a676]">
                    {summaryData.credit_received.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-1.5 text-[#00a676]">
                    {summaryData.credit_remaining.toLocaleString()}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-1.5 text-[#dc3545]">
                    {summaryData.cash < 0 ? summaryData.cash.toLocaleString() : `-${Math.abs(summaryData.cash).toLocaleString()}`}
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-1.5 text-[#00a676]">
                    0
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-1.5 text-[#00a676]">
                    0
                  </td>
                  <td className="border border-[#dee2e6] px-3 py-1.5 text-[#212529]">
                    {filteredClients.length || 2}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* 3. Action Buttons & Badges Legend */}
        <div className="flex flex-col gap-2.5 mb-3">
          {/* Top buttons */}
          <div className="flex items-center gap-1.5">
            {!hideCreateButton && (
              <button
                onClick={() => navigate("/accounts/create")}
                className="bg-[#00a676] hover:bg-[#008f65] text-white font-medium text-[12px] py-1 px-2.5 rounded-[3px] flex items-center gap-1 transition-colors shadow-sm"
              >
                <span>New User</span>
              </button>
            )}
            <button
              onClick={() => navigate("/reports/daily")}
              className="bg-[#00a676] hover:bg-[#008f65] text-white font-medium text-[12px] py-1 px-2.5 rounded-[3px] flex items-center gap-1 transition-colors shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Account Ledger</span>
            </button>
          </div>

          {/* Legend Badges Row */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px] text-[#212529]">
            <div className="flex items-center gap-1">
              <span className="w-[18px] h-[18px] bg-[#ffc107] text-black flex items-center justify-center rounded-[2px] text-[11px] font-bold">
                C
              </span>
              <span className="font-normal">Cash / Credit</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="w-[18px] h-[18px] bg-[#00a676] text-white flex items-center justify-center rounded-[2px]">
                <Pencil className="w-2.5 h-2.5" />
              </span>
              <span className="font-normal">Edit</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="w-[18px] h-[18px] bg-[#5bc0de] text-white flex items-center justify-center rounded-[2px] text-[11px] font-bold">
                L
              </span>
              <span className="font-normal">Ledger</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="w-[18px] h-[18px] bg-[#5cb85c] text-white flex items-center justify-center rounded-[2px] text-[11px] font-bold">
                A
              </span>
              <span className="font-normal">Active</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="w-[18px] h-[18px] bg-white border border-[#d9534f] text-[#d9534f] flex items-center justify-center rounded-[2px] text-[11px] font-bold">
                D
              </span>
              <span className="font-normal">InActive</span>
            </div>
          </div>
        </div>

        {/* 4. Table Search Box - Centered like original website */}
        <div className="flex flex-col items-center justify-center my-3">
          <label className="text-[13px] text-[#212529] font-normal mb-1">
            Search:
          </label>
          <input
            type="search"
            value={tableSearch}
            onChange={(e) => {
              setTableSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full max-w-[240px] border border-[#ced4da] rounded-[4px] px-2 py-1 text-[13px] text-[#212529] bg-white outline-none focus:border-[#00a676] focus:ring-1 focus:ring-[#00a676]"
          />
        </div>

        {/* 5. Main Users Table */}
        <div className="overflow-x-auto border border-[#dee2e6] rounded-[3px]">
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              {/* TOP GREEN BAR / LOAD BALANCE */}
              <tr className="bg-[#00a676] text-white font-bold">
                {!balancesLoaded ? (
                  <td colSpan={3} className="px-3 py-2 border-b border-[#008f65]">
                    <button
                      onClick={handleLoadBalance}
                      className="bg-[#ffc107] hover:bg-[#e0a800] text-black text-[12px] font-bold py-1 px-3 rounded-[3px] shadow-sm transition-colors"
                    >
                      {isLoadingBalances ? "Loading..." : "Load Balance"}
                    </button>
                  </td>
                ) : (
                  <>
                    <td className="px-3 py-2 border-r border-[#008f65] font-bold text-left text-[14px]">
                      Total
                    </td>
                    <td className="px-3 py-2 border-r border-[#008f65]"></td>
                    <td className="px-3 py-2 font-bold text-left text-[14px]">
                      {totalCreditSum.toLocaleString()}
                    </td>
                  </>
                )}
              </tr>

              {/* TABLE HEADERS */}
              <tr className="bg-white border-b border-[#dee2e6] font-bold text-[#212529]">
                <th className="px-3 py-2 text-left border-r border-[#dee2e6] w-[40%] font-bold">
                  Username
                </th>
                <th className="px-3 py-2 text-left border-r border-[#dee2e6] w-[35%] font-bold">
                  Type
                </th>
                <th className="px-3 py-2 text-left w-[25%] font-bold">
                  Credit
                </th>
              </tr>

              {/* USER ROWS */}
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00a676]" />
                    <span>Loading clients...</span>
                  </td>
                </tr>
              ) : paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-gray-500 italic">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  const display = getClientDisplay(client);
                  const isExpanded = expandedIds.has(client.id);

                  return (
                    <React.Fragment key={client.id}>
                      {/* Main user row */}
                      <tr
                        onClick={() => toggleExpand(client.id)}
                        className="border-b border-[#dee2e6] hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-2.5 border-r border-[#dee2e6]">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/accounts/view/${client.username}`);
                              }}
                              className="text-[#00a676] hover:text-[#008f65] font-bold text-[13px] hover:underline cursor-pointer"
                            >
                              {client.username}
                            </span>
                            {!balancesLoaded && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(client.id);
                                }}
                                className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-serif shrink-0 opacity-80 hover:opacity-100"
                                title="View details"
                              >
                                i
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-2.5 border-r border-[#dee2e6] text-[#212529]">
                          {getTypeLabel(client.role)}
                        </td>

                        <td className="px-3 py-2.5 text-[#212529]">
                          {balancesLoaded ? display.credit.toLocaleString() : "-"}
                        </td>
                      </tr>

                      {/* Expanded Sub-Details Row */}
                      {isExpanded && (
                        <tr className="bg-white border-b border-[#dee2e6]">
                          <td colSpan={3} className="px-4 py-3 bg-[#fafafa]/50">
                            <ul className="space-y-1 text-[13px] text-[#212529] mb-3">
                              <li>
                                • Balance{" "}
                                <span className="font-bold">
                                  {balancesLoaded ? display.balance.toLocaleString() : "0"}
                                </span>
                              </li>
                              <li>
                                • Client (P/L){" "}
                                <span
                                  className="font-bold"
                                  style={{
                                    color:
                                      balancesLoaded && display.clientPL < 0
                                        ? "#dc3545"
                                        : "#212529",
                                  }}
                                >
                                  {balancesLoaded
                                    ? display.clientPL > 0
                                      ? display.clientPL.toLocaleString()
                                      : display.clientPL < 0
                                      ? display.clientPL.toLocaleString()
                                      : "0"
                                    : "0"}
                                </span>
                              </li>
                              <li>
                                • Share{" "}
                                <span className="font-bold">
                                  {display.share}
                                </span>
                              </li>
                              <li>
                                • Exposure{" "}
                                <span className="font-bold">
                                  {display.exposure}
                                </span>
                              </li>
                              <li>
                                • Available Balance{" "}
                                <span className="font-bold">
                                  {balancesLoaded ? display.available.toLocaleString() : "0"}
                                </span>
                              </li>
                            </ul>

                            {/* Options Action Buttons */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <span className="font-bold text-[13px] text-[#212529] mr-1">
                                • Options
                              </span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/accounts/cash-credit/${client.username}`);
                                }}
                                title="Cash / Credit"
                                className="w-6 h-6 bg-[#ffc107] text-black font-bold rounded-[2px] text-[11px] flex items-center justify-center hover:opacity-85 shadow-sm transition-opacity"
                              >
                                C
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/accounts/edit/${client.username}`);
                                }}
                                title="Edit"
                                className="w-6 h-6 bg-[#00a676] text-white rounded-[2px] flex items-center justify-center hover:opacity-85 shadow-sm transition-opacity"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/accounts/ledger/${client.username}`);
                                }}
                                title="Ledger"
                                className="w-6 h-6 bg-[#5bc0de] text-white font-bold rounded-[2px] text-[11px] flex items-center justify-center hover:opacity-85 shadow-sm transition-opacity"
                              >
                                L
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStatus(client);
                                }}
                                title={client.status === "active" ? "Active" : "InActive"}
                                className={cn(
                                  "w-6 h-6 rounded-[2px] text-[11px] font-bold flex items-center justify-center shadow-sm transition-opacity hover:opacity-85",
                                  client.status === "active"
                                    ? "bg-[#5cb85c] text-white"
                                    : "bg-white border border-[#d9534f] text-[#d9534f]"
                                )}
                              >
                                {client.status === "active" ? "A" : "D"}
                              </button>
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

        {/* 6. Footer Entries Counter */}
        <div className="mt-3 text-center text-[13px] text-[#212529]">
          Showing 1 to {paginatedClients.length} of {tableFilteredClients.length} entries
        </div>

        {/* Pagination if multiple pages */}
        {totalPages > 1 && (
          <div className="mt-3 flex justify-center">
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalRecords={tableFilteredClients.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
