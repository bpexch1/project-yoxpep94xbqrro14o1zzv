import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Search, X } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { ClientSummaryCard } from "@/components/accounts/ClientSummaryCard";
import { getClientSession } from "@/hooks/useClientAuth";
import { roleLabel } from "@/lib/accountHierarchy";

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("Accounts");
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  useEffect(() => { setSearchQuery(searchParams.get("search") || ""); }, [searchParams]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const session = getClientSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) navigate("/login");
  }, [session, navigate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: clients, isLoading, isError, refetch } = useQuery({
    queryKey: ["clients", session?.username],
    queryFn: async () => {
      if (!session) return [];
      const role = session.role?.toLowerCase();
      // Only Company role can list all clients
      if (role === "company") {
        return ClientEntity.list("-created_at");
      }
      return ClientEntity.filter({ parent_username: session.username }, "-created_at");
    },
    enabled: !!session,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    select: (data: any) => (Array.isArray(data) ? data.map((c: any) => ({ ...c })) : []),
  });

  // Admin's own record to show in summary table
  const { data: adminOwnData } = useQuery({
    queryKey: ["admin-own-record", session?.username],
    queryFn: () => ClientEntity.filter({ username: session?.username }),
    enabled: !!session?.username,
    refetchInterval: 15000,
  });
  const adminRecord = adminOwnData?.[0];

  const suggestions = (Array.isArray(clients) ? clients : [])
    .filter(
      (c) =>
        searchQuery.length >= 2 &&
        (c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .slice(0, 8);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        selectSuggestion(suggestions[highlightedIndex]);
      } else {
        setShowSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (client: any) => {
    setSearchQuery(client.username);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setSelectedClient(client);

    const chain: string[] = [];
    let current = client;
    const visited = new Set<string>();
    while (current && !visited.has(current.username)) {
      visited.add(current.username);
      chain.unshift(current.username);
      if (current.parent_username) {
        const parent = (clients || []).find((c: any) => c.username === current.parent_username);
        if (parent) {
          current = parent;
        } else {
          chain.unshift(current.parent_username);
          break;
        }
      } else {
        break;
      }
    }
    setBreadcrumb(chain);
  };

  const handleSearchClick = () => {
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      const match = (clients || []).find(
        (c: any) => c.username?.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (match) {
        selectSuggestion(match);
      }
    }
  };

  if (isError) return <div role="alert" className="card card-body">Unable to load users. <button className="btn btn-primary" onClick={() => void refetch()}>Retry</button></div>;

  return (
    <div
      className="reference-users min-h-screen bg-[rgb(228,229,230)] text-[rgb(35,40,44)]"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <main className="w-full max-w-full px-2 sm:px-3 py-2 sm:py-3">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 2. Search-Users Card */}
        <div className="card" id="Usersearchcustom">
          {/* Inspected Card Header */}
          <div className="card-header">
            <i className="fa fa-filter text-[13px]"></i>
            <strong>Search-Users</strong>
          </div>

          {/* Search-Users Body */}
          <div className="card-body">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div ref={dropdownRef} className="relative flex-1 max-w-md flex">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="search"
                    autoComplete="off"
                    placeholder="Username"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-[35px] border border-[#c8ced3] border-r-0 rounded-l-[0.25rem] px-3 text-[0.875rem] text-[#495057] bg-white outline-none focus:border-[#009678] transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSuggestions(false);
                        setSelectedClient(null);
                        setBreadcrumb([]);
                        inputRef.current?.focus();
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleSearchClick}
                  className="h-[35px] px-3.5 bg-[#009678] hover:bg-[#007a62] text-white font-medium text-[0.875rem] rounded-r-[0.25rem] flex items-center gap-1.5 transition-colors shrink-0 shadow-sm border border-[#009678]"
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Search</span>
                </button>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] shadow-lg z-50 max-h-[260px] overflow-y-auto">
                    {suggestions.map((client, index) => (
                      <div
                        key={client.id}
                        onClick={() => selectSuggestion(client)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between text-[0.875rem] border-b border-gray-100 last:border-0 ${
                          highlightedIndex === index ? "bg-[#e6f5f1] text-[#009678]" : "text-[rgb(35,40,44)] hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-bold text-[#00B496]">{client.username}</span>
                        <span className="text-[11px] text-gray-500">{roleLabel(client.role)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Breadcrumbs if user navigated */}
              {breadcrumb.length > 0 && (
                <div className="flex items-center gap-1.5 text-[0.875rem] overflow-x-auto py-1">
                  {breadcrumb.map((item, index) => {
                    const isLast = index === breadcrumb.length - 1;
                    const path = isLast ? `/accounts/cash-credit/${item}` : `/accounts/view/${item}`;
                    return (
                      <React.Fragment key={item}>
                        <button
                          onClick={() => navigate(path)}
                          className={`font-semibold transition-colors ${
                            isLast ? "text-[#00B496] font-bold" : "text-[rgb(35,40,44)] hover:text-[#00B496]"
                          }`}
                        >
                          {item}
                        </button>
                        {!isLast && <span className="text-gray-400 text-xs">&gt;</span>}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Clients table/list */}
        <ClientSummaryCard
          clients={clients || []}
          isLoading={isLoading}
          username={session?.username || "Admin"}
          searchFilter={searchQuery}
          onRefresh={async () => { await refetch({ throwOnError: true }); }}
          adminRecord={adminRecord}
        />

      </main>
    </div>
  );
}
