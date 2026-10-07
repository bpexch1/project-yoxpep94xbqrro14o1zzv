import React, { useState, useMemo, useEffect } from "react";
import { Pencil, User, FileText, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/entities";

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
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 992px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 992px)");
    const update = () => setIsDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const columnCount = isDesktop ? 9 : 3;
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
    try {
      await onRefresh?.();
      setBalancesLoaded(true);
      setExpandedIds(new Set(clients.map(client => client.id)));
    } catch {
      toast({ title: "Unable to load balances", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoadingBalances(false);
    }
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
        return "Bettor";
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
        { credit_received: 0, credit_remaining: 0, cash: 0, pl_downline: 0, balance_upline: 0 }
      ),
    [filteredClients]
  );

  const summaryData = adminRecord
    ? {
        credit_received: adminRecord.credit_received ?? 0,
        credit_remaining: adminRecord.credit_remaining ?? 0,
        cash: adminRecord.cash ?? 0,
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
    return filteredClients.reduce((sum, c) => sum + (Number(c.credit_remaining) || 0), 0);
  }, [filteredClients]);

  const renderOptions = (client: any) => (
    <div className="flex items-center gap-1.5 pt-1">


      {/* Yellow (C) Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/accounts/cash-credit/${client.username}`);
        }}
        title="Cash / Credit"
        className="btn-action btn-copy text-black font-bold"
      >
        C
      </button>

      {/* Medium Green (Edit) Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/accounts/edit/${client.username}`);
        }}
        title="Edit"
        className="btn-action btn-edit text-white"
      >
        <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      {/* Light Blue (L) Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/accounts/ledger/${client.username}`);
        }}
        title="Ledger"
        className="btn-action btn-ledger text-white font-bold"
      >
        L
      </button>

      {/* Medium Green (A) or InActive (D) Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleStatus(client);
        }}
        title={client.status === "active" ? "Active" : "InActive"}
        className={cn(
          "btn-action",
          client.status === "active"
            ? "btn-account text-white"
            : "btn-inactive-status font-bold"
        )}
      >
        {client.status === "active" ? "A" : "D"}
      </button>
    </div>
  );

  return (
    <div className="card reference-accounts">
      {/* 1. Header Bar (Inspected card-header) */}
      {!hideHeader && (
        <div className="card-header">
          <span><strong>{username}</strong> - Clients List{!balancesLoaded ? " | Default" : ""}</span>
        </div>
      )}

      <div className="card-body">
        {/* 2. Top Summary Stats Table */}
        <div className="mb-3.5 overflow-x-auto">
          {!balancesLoaded ? (
            <table className="table table-bordered table-sm border-collapse border border-[rgb(200,206,211)] bg-white">
              <thead>
                <tr className="bg-white">
                  <th className="border border-[rgb(200,206,211)] px-3 py-1.5 text-left font-bold text-[rgb(35,40,44)] whitespace-nowrap leading-tight">
                    Credit <br />Remaining
                  </th>
                  <th className="border border-[rgb(200,206,211)] px-3 py-1.5 text-left font-bold text-[rgb(35,40,44)] whitespace-nowrap leading-tight">
                    Cash
                  </th>
                  <th className="border border-[rgb(200,206,211)] px-3 py-1.5 text-left font-bold text-[rgb(35,40,44)] whitespace-nowrap leading-tight">
                    P/L <br />Downline
                  </th>
                  <th className="border border-[rgb(200,206,211)] px-3 py-1.5 text-left font-bold text-[rgb(35,40,44)] whitespace-nowrap leading-tight">
                    Users
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white font-bold">
                  <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[#00a65a]">
                    0
                  </td>
                  <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[#00a65a]">
                    0
                  </td>
                  <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[#00a65a]">
                    0
                  </td>
                  <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[rgb(35,40,44)]">
                    {filteredClients.length}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="table table-bordered table-sm border-collapse border border-[rgb(200,206,211)] bg-white">
              <thead>
                <tr className="bg-white">
                  <th className="border border-[rgb(200,206,211)] px-3 py-1.5 text-left font-bold text-[rgb(35,40,44)] whitespace-nowrap leading-tight">
                    Credit <br />Received
                  </th>
                  <th className="border border-[rgb(200,206,211)] px-3 py-1.5 text-left font-bold text-[rgb(35,40,44)] whitespace-nowrap leading-tight">
                    Credit <br />Remaining
                  </th>
                  <th className="border border-[rgb(200,206,211)] px-3 py-1.5 text-left font-bold text-[rgb(35,40,44)] whitespace-nowrap leading-tight">
                    Cash
                  </th>
                  <th className="border border-[rgb(200,206,211)] px-3 py-1.5 text-left font-bold text-[rgb(35,40,44)] whitespace-nowrap leading-tight">
                    P/L <br />Downline
                  </th>
                  <th className="border border-[rgb(200,206,211)] px-3 py-1.5 text-left font-bold text-[rgb(35,40,44)] whitespace-nowrap leading-tight">
                    Balance <br />UpLine
                  </th>
                  <th className="border border-[rgb(200,206,211)] px-3 py-1.5 text-left font-bold text-[rgb(35,40,44)] whitespace-nowrap leading-tight">
                    Users
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white font-bold">
                  <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[#00a65a]">
                    {(summaryData.credit_received ?? 0).toLocaleString()}
                  </td>
                  <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[#00a65a]">
                    {(summaryData.credit_remaining ?? 0).toLocaleString()}
                  </td>
                  <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[#dc3545]">
                    {(summaryData.cash ?? 0).toLocaleString()}
                  </td>
                  <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[#00a65a]">
                    0
                  </td>
                  <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[#00a65a]">
                    0
                  </td>
                  <td className="border border-[rgb(200,206,211)] px-3 py-1.5 text-[rgb(35,40,44)]">
                    {filteredClients.length}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* 3. Action Buttons & Badges Legend */}
        <div className="accounts-actions flex flex-col gap-2.5 mb-3">
          {/* Top buttons */}
          <div className="accounts-action-buttons flex items-center gap-1.5">
            {!hideCreateButton && (
              <button
                onClick={() => navigate("/accounts/create")}
                className="btn btn-sm btn-primary inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <span>New User</span>
              </button>
            )}
            <button
              onClick={() => navigate("/accounts/ledger")}
              className="btn btn-sm btn-primary inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Account Ledger</span>
            </button>
          </div>

          {/* Legend Badges Row */}
          <div className="accounts-legend flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[16px] text-[rgb(35,40,44)]">
            <div className="flex items-center gap-1.5">
              <span className="btn btn-sm btn-warning">
                C
              </span>
              <span className="font-medium">Cash / Credit</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="btn btn-sm btn-primary">
                <Pencil className="w-2.5 h-2.5 stroke-[2.5]" />
              </span>
              <span className="font-medium">Edit</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="btn btn-sm btn-info">
                L
              </span>
              <span className="font-medium">Ledger</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="btn btn-sm btn-success">
                A
              </span>
              <span className="font-medium">Active</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="btn btn-sm btn-outline-danger">
                D
              </span>
              <span className="font-medium">InActive</span>
            </div>
          </div>
        </div>

        {/* Reference DataTables entry selector and search */}
        <div className="admin-datatable-controls flex flex-wrap justify-between items-center gap-3 mb-3">
          <label className="flex items-center gap-2">Show
            <select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setCurrentPage(1); }} aria-label="Entries per page" className="px-2 py-1 border bg-white">
              {[25, 50, 100, 250].map(size => <option key={size} value={size}>{size}</option>)}
            </select> entries
          </label>
          <label className="flex items-center gap-2">Search:
            <input type="search" value={tableSearch} onChange={event => { setTableSearch(event.target.value); setCurrentPage(1); }} className="px-2 py-1 border bg-white" />
          </label>
        </div>

        {/* 5. Main Users Table */}
        <div className="overflow-x-auto border border-[#DCDCDC] rounded-[0.2rem]">
          <table className="accounts-table tbl-datatable1 table table-bordered table-sm mb-0 text-[0.875rem]">
            <tbody>
              {/* Reference Load Balance header */}
              <tr className="table-header-row bg-[#009678] text-black font-bold h-[45px] sm:h-[50px]">
                {!balancesLoaded ? (
                  <td colSpan={columnCount} className="px-3.5 py-2.5 border-b border-[#007a62]">
                    <button
                      onClick={handleLoadBalance}
                      className="btn btn-warning"
                    >
                      {isLoadingBalances ? "Loading..." : "Load Balance"}
                    </button>
                  </td>
                ) : (
                  <>
                    <td className="px-3.5 py-2.5 border-r border-[#007a62] font-bold text-left text-[15px] sm:text-[16px] text-black">
                      Total
                    </td>
                    <td className="px-3.5 py-2.5 border-r border-[#007a62]"></td>
                    <td className="px-3.5 py-2.5 font-bold text-left text-[15px] sm:text-[16px] text-black">
                      {totalCreditSum.toLocaleString()}
                    </td>
                    {isDesktop && (
                      <>
                        <td>{filteredClients.reduce((sum, client) => sum + getClientDisplay(client).balance, 0).toLocaleString()}</td>
                        <td>{filteredClients.reduce((sum, client) => sum + Number(getClientDisplay(client).clientPL), 0).toLocaleString()}</td>
                        <td></td><td></td><td></td><td></td>
                      </>
                    )}
                  </>
                )}
              </tr>

              {/* TABLE HEADERS */}
              <tr className="bg-white border-b border-[#DCDCDC] font-bold text-[rgb(35,40,44)]">
                <th className="px-3.5 py-2 text-left border-r border-[#DCDCDC] font-bold">
                  Username
                </th>
                <th className="px-3.5 py-2 text-left border-r border-[#DCDCDC] font-bold">
                  Type
                </th>
                <th className="px-3.5 py-2 text-left font-bold">
                  Credit
                </th>
                {isDesktop && ["Balance", "Client (P/L)", "Share", "Exposure", "Available Balance", "Options"].map(label => (
                  <th key={label} className="text-left font-bold">{label}</th>
                ))}
              </tr>

              {/* USER ROWS */}
              {isLoading ? (
                <tr>
                  <td colSpan={columnCount} className="px-3 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#009678]" />
                    <span>Loading clients...</span>
                  </td>
                </tr>
              ) : paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-3 py-8 text-center text-gray-500 italic">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  const display = getClientDisplay(client);
                  const isExpanded = expandedIds.has(client.id);
                  const isBettor = ["client", "user", "bettor"].includes(client.role?.toLowerCase());

                  return (
                    <React.Fragment key={client.id}>
                      {/* Main user row */}
                      <tr
                        onClick={() => { if (!isDesktop) toggleExpand(client.id); }}
                        className="data-row border-b border-[#DCDCDC] hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                      >
                        <td className="px-3.5 py-2.5 border-r border-[#DCDCDC]">
                          <div className="flex items-center gap-1.5">
                            {isBettor ? <span className="username-text username-bettor">{client.username}</span> : <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); navigate(`/accounts/view/${client.username}`); }}
                              className="username-text username-staff hover:underline"
                            >{client.username}</button>}
                            {!balancesLoaded && !isDesktop && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(client.id);
                                }}
                                className="client-info-button"
                                title="View details"
                              >
                                <span aria-hidden="true" className="client-info-glyph">i</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-3.5 py-2.5 border-r border-[#DCDCDC] text-[rgb(35,40,44)] font-medium">
                          {getTypeLabel(client.role)}
                        </td>

                        <td className="px-3.5 py-2.5 text-[rgb(35,40,44)] font-medium">
                          {balancesLoaded ? display.credit.toLocaleString() : "-"}
                        </td>
                        {isDesktop && (
                          <>
                            <td>{balancesLoaded ? display.balance.toLocaleString() : "-"}</td>
                            <td style={{ color: display.clientPL < 0 ? "#f86c6b" : undefined }}>{balancesLoaded ? Number(display.clientPL).toLocaleString() : "-"}</td>
                            <td>{display.share}</td>
                            <td>{display.exposure}</td>
                            <td>{balancesLoaded ? display.available.toLocaleString() : "-"}</td>
                            <td>{renderOptions(client)}</td>
                          </>
                        )}
                      </tr>

                      {/* Expanded Sub-Details Row */}
                      {isExpanded && !isDesktop && (
                        <tr className="detail-row bg-[#FAFAFA] border-b border-[#DCDCDC]">
                          <td colSpan={columnCount} className="px-4 py-3">
                            <ul className="reference-client-details space-y-1 text-[0.875rem] text-[rgb(35,40,44)] mb-3">
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
                                        : "rgb(35,40,44)",
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

                            <div className="flex items-center gap-2">
                              <span>• Options</span>
                              {renderOptions(client)}
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

        <div className="admin-datatable-footer flex flex-wrap justify-between items-center gap-3 mt-3">
          <span>Showing {tableFilteredClients.length ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, tableFilteredClients.length)} of {tableFilteredClients.length} entries</span>
          {totalPages > 1 && <div className="inline-flex" aria-label="User table pagination">
            <button type="button" className="admin-page-button" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage <= 1}>Previous</button>
            <span className="admin-page-button admin-page-current" aria-current="page">{currentPage}</span>
            <button type="button" className="admin-page-button" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage >= totalPages}>Next</button>
          </div>}
        </div>
      </div>
    </div>
  );
}
