import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, Search, X } from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { ClientSummaryCard } from "@/components/accounts/ClientSummaryCard";
import { getClientSession } from "@/hooks/useClientAuth";

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("Accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
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
      if (role === 'company') {
        return ClientEntity.list("-created_at");
      }
      return ClientEntity.filter({ parent_username: session.username }, "-created_at");
    },
    enabled: !!session,
  });

  const suggestions = (clients || [])
    .filter(c => 
      searchQuery.length >= 3 && 
      (c.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .slice(0, 8);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
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

    // Build parent chain using the loaded clients array
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
          // Parent not in loaded list (could be session user or higher)
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
  };

  const isAdminRole = ['superadmin', 'admin', 'company', 'supermaster'].includes(session?.role?.toLowerCase() || '');

  return (
    <div style={{ minHeight: "100vh", background: "#e9ecef", fontFamily: "Roboto, system-ui, sans-serif" }}>
      <main style={{ width: "100%", padding: "16px 16px 80px" }}>

        {/* 1. Report Type Card */}
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 2. Search-Users Card */}
        <div style={{
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #d0d0d0",
          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
          marginBottom: 16,
          overflow: "visible", // Changed to visible for dropdown
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "#ecf0f1",
            borderBottom: "1px solid #d0d0d0",
          }}>
            <Filter style={{ width: 16, height: 16, fill: "#000", color: "#000", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#212529", fontFamily: "Roboto, system-ui, sans-serif" }}>Search-Users</span>
          </div>
          <div style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 60%", minWidth: "300px", display: "flex", gap: 8 }}>
                <div ref={dropdownRef} style={{ position: "relative", flex: 1 }}>
                  <div style={{ position: "relative" }}>
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
                      style={{
                        width: "100%",
                        height: "40px",
                        minHeight: "40px",
                        maxHeight: "40px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        padding: "0 32px 0 12px",
                        fontSize: "14px",
                        color: "#374151",
                        fontFamily: "Roboto, system-ui, sans-serif",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                    />
                    {searchQuery.length > 0 && searchQuery.length < 3 && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        fontSize: "10px",
                        color: "#6c757d",
                        marginTop: "2px",
                        fontWeight: "bold"
                      }}>
                        Type at least 3 characters to search
                      </div>
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setShowSuggestions(false);
                          setSelectedClient(null);
                          setBreadcrumb([]);
                          inputRef.current?.focus();
                        }}
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          padding: "4px",
                          cursor: "pointer",
                          color: "#6c757d",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "#fff",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      marginTop: "4px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                      zIndex: 50,
                      maxHeight: "300px",
                      overflowY: "auto"
                    }}>
                      {suggestions.map((client, index) => (
                        <div
                          key={client.id}
                          onClick={() => selectSuggestion(client)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            backgroundColor: highlightedIndex === index ? "#f0fff4" : "#fff",
                            color: highlightedIndex === index ? "#00a65a" : "inherit",
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: "13px", color: "#212529" }}>
                            {client.username}
                          </span>
                          <span style={{ fontSize: "11px", color: "#6c757d", marginLeft: "6px" }}>
                            {client.full_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSearchClick}
                  onMouseEnter={() => setIsSearchHovered(true)}
                  onMouseLeave={() => setIsSearchHovered(false)}
                  style={{
                    height: "40px",
                    minHeight: "40px",
                    maxHeight: "40px",
                    padding: "0 18px",
                    background: isSearchHovered ? "#008d4c" : "#00a65a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "Roboto, system-ui, sans-serif",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxSizing: "border-box",
                    flexShrink: 0,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    transition: "background 0.15s",
                  }}
                >
                  <Search style={{ width: 15, height: 15 }} />
                  Search
                </button>
              </div>

              <div style={{ flex: 1, overflowX: "auto" }}>
                {breadcrumb.length > 0 && (
                  <nav aria-label="Breadcrumb" style={{ height: "40px", display: "flex", alignItems: "center" }}>
                    <ol style={{ display: "flex", listStyle: "none", margin: 0, padding: 0, alignItems: "center", whiteSpace: "nowrap" }}>
                      {breadcrumb.map((item, index) => {
                        const isLast = index === breadcrumb.length - 1;
                        const clientInfo = (clients || []).find((c: any) => c.username === item);
                        const isLeaf = isLast;
                        
                        // Rule: navigates to /accounts/view/${item} if it's an admin/agent, 
                        // or /accounts/cash-credit/${item} if it's the leaf (selected client)
                        const path = isLeaf ? `/accounts/cash-credit/${item}` : `/accounts/view/${item}`;

                        return (
                          <li key={item} style={{ display: "flex", alignItems: "center" }}>
                            <a
                              href={path}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(path);
                              }}
                              style={{
                                fontSize: "12px",
                                fontWeight: isLast ? 700 : 600,
                                color: isLast ? "#00a65a" : "#212529",
                                textDecoration: "none",
                              }}
                            >
                              {item}
                            </a>
                            {!isLast && (
                              <span style={{ margin: "0 4px", color: "#6c757d", fontSize: "12px" }}>&gt;</span>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </nav>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Clients table/list — header shown inside ClientSummaryCard */}
        <ClientSummaryCard
          clients={clients || []}
          isLoading={isLoading}
          username={session?.username || 'Admin'}
          searchFilter={searchQuery}
          onRefresh={refetch}
          autoLoadBalance={true}
        />

        {/* News Ticker — only on Accounts page */}
        <div className="mt-4 bg-[#1f3044] overflow-hidden flex items-center border-t border-white/10 h-[25px]">
          <div className="animate-marquee whitespace-nowrap flex">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
                <b>Welcome to Exchange.</b>
              </span>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
