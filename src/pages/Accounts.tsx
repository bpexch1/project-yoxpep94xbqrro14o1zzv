import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Search, X } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { ClientSummaryCard } from "@/components/accounts/ClientSummaryCard";
import { getClientSession } from "@/hooks/useClientAuth";

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("Accounts");
  const [searchQuery, setSearchQuery] = useState("");
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
    async function fixBookRole() {
      try {
        const results = await ClientEntity.filter({ username: "Book" }, "-created_at", 1);
        if (results && results.length > 0) {
          const book = results[0];
          if (book.role === "superadmin") {
            await ClientEntity.update(book.id, { role: "company" });
          }
        }
      } catch (e) {
        console.error("Book role fix error:", e);
      }
    }
    fixBookRole();
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

  const { data: clients, isLoading, refetch } = useQuery({
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

  const clientsKey = Array.isArray(clients)
    ? clients.map((c: any) => `${c.id}:${c.updated_at}`).join("|")
    : "empty";

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

  return (
    <div
      className="min-h-screen bg-[#ececed] text-[#212529]"
      style={{
        fontFamily: '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      <main className="w-full max-w-full px-2 sm:px-3 py-2 sm:py-3">
        {/* 1. Report Type Card */}
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 2. Search-Users Card */}
        <div className="bg-white rounded-[4px] border border-[#dee2e6] shadow-[0_1px_3px_rgba(0,0,0,0.05)] mb-3 overflow-visible">
          {/* Light Header matching original website */}
          <div className="bg-[#f8f9fa] border-b border-[#dee2e6] px-3 py-2 flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-black text-black shrink-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 .71 1.71L14 11.42V19a1 1 0 0 1-.55.89l-4 2A1 1 0 0 1 8 21v-9.58L3.29 5.71A1 1 0 0 1 3 4z" />
            </svg>
            <span className="font-bold text-[14px] text-[#212529] tracking-tight">
              Search-Users
            </span>
          </div>

          {/* Search-Users Body */}
          <div className="p-3.5 sm:p-4">
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
                    className="w-full h-[36px] border border-[#ced4da] rounded-l-[4px] px-3 text-[13px] text-[#374151] bg-white outline-none focus:border-[#00a676] focus:ring-1 focus:ring-[#00a676] transition-all"
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
                  className="h-[36px] px-4 bg-[#00a676] hover:bg-[#008f65] text-white font-medium text-[13px] rounded-r-[4px] flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Search</span>
                </button>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#ced4da] rounded-[4px] shadow-lg z-50 max-h-[260px] overflow-y-auto">
                    {suggestions.map((client, index) => (
                      <div
                        key={client.id}
                        onClick={() => selectSuggestion(client)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between text-[13px] border-b border-gray-100 last:border-0 ${
                          highlightedIndex === index ? "bg-[#f0fdf4] text-[#00a676]" : "text-[#212529] hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-bold">{client.username}</span>
                        <span className="text-[11px] text-gray-500">{client.role || client.full_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Breadcrumbs if user navigated */}
              {breadcrumb.length > 0 && (
                <div className="flex items-center gap-1.5 text-[13px] overflow-x-auto py-1">
                  {breadcrumb.map((item, index) => {
                    const isLast = index === breadcrumb.length - 1;
                    const path = isLast ? `/accounts/cash-credit/${item}` : `/accounts/view/${item}`;
                    return (
                      <React.Fragment key={item}>
                        <button
                          onClick={() => navigate(path)}
                          className={`font-semibold transition-colors ${
                            isLast ? "text-[#00a676] font-bold" : "text-[#212529] hover:text-[#00a676]"
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
          key={clientsKey}
          clients={clients || []}
          isLoading={isLoading}
          username={session?.username || "Admin"}
          searchFilter={searchQuery}
          onRefresh={refetch}
          adminRecord={adminRecord}
        />

        {/* Footer Text */}
        <div className="text-center py-5">
          <p className="font-bold text-[13px] text-[#212529]">
            Welcome to Exchange.
          </p>
        </div>
      </main>
    </div>
  );
}
