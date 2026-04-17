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
      searchQuery.length > 0 && 
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
  };

  const handleSearchClick = () => {
    setShowSuggestions(false);
  };

  const isAdminRole = ['superadmin', 'admin', 'company', 'supermaster'].includes(session?.role?.toLowerCase() || '');

  return (
    <div style={{ minHeight: "100vh", background: "#f0f0f0", fontFamily: "Roboto, system-ui, sans-serif" }}>
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "16px 12px 80px" }}>

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
            <div style={{ display: "flex", gap: 8 }}>
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
                      padding: "0 32px 0 12px", // Added padding right for X button
                      fontSize: "14px",
                      color: "#374151",
                      fontFamily: "Roboto, system-ui, sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#fff",
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSuggestions(false);
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
                          backgroundColor: highlightedIndex === index ? "#f0fdf4" : "#fff",
                          color: highlightedIndex === index ? "#1a9e71" : "inherit",
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
                style={{
                  height: "40px",
                  minHeight: "40px",
                  maxHeight: "40px",
                  padding: "0 18px",
                  background: "#1a9e71",
                  color: "#fff",
                  border: "none",
                  borderRadius: "7px",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "Roboto, system-ui, sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}
              >
                <Search style={{ width: 15, height: 15 }} />
                Search
              </button>
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
          autoLoadBalance={false}
        />

      </main>
    </div>
  );
}
