
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getClientSession, clearClientSession } from "@/hooks/useClientAuth";
import { Client } from "@/entities";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UserHeaderProps {
  sidebarOpen?: boolean;
  onMenuToggle?: () => void;
  onLoadBalance?: () => void;
}

export function UserHeader({ sidebarOpen, onMenuToggle, onLoadBalance }: UserHeaderProps) {
  const [session, setSession] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const s = getClientSession();
    if (!s) {
      navigate("/login");
      return;
    }
    const r = s.role?.toLowerCase()?.trim();
    if (r && r !== "client" && r !== "user" && r !== "bettor") {
      navigate("/dashboard", { replace: true });
      return;
    }
    setSession(s);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const queryClient = useQueryClient();

  const handleDashboardClick = () => {
    if (location.pathname === "/play" || location.pathname === "/play/") {
      window.dispatchEvent(new CustomEvent("refresh-dashboard"));
      queryClient.invalidateQueries();
    } else {
      navigate("/play", { state: { refresh: true } });
    }
  };

  const { data: clientData } = useQuery({
    queryKey: ["user-header-balance", session?.username],
    queryFn: async () => {
      if (!session?.username) return null;
      const clients = await Client.filter({ username: session.username }, "-created_at", 1);
      return (clients as any)?.[0] ?? null;
    },
    enabled: !!session?.username,
    refetchInterval: 15000,
  });

  const balance = clientData?.cash ?? 0;

  const handleLogout = () => {
    clearClientSession();
    navigate("/login");
    setDropdownOpen(false);
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setDropdownOpen(false);
  };

  if (!session) return null;

  const menuItems = [
    { label: "Statement", path: "/play/statement" },
    { label: "Result", path: "/play/result" },
    { label: "Profit Loss", path: "/play/profit-loss" },
    { label: "Bet History", path: "/play/bets" },
    { label: "Profile", path: "/play/profile" },
  ];

  return (
    <header
      style={{
        backgroundColor: "#173456",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
          minHeight: 46,
        }}
      >
        {/* Left: Hamburger button in square box + Dashboard */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button
            onClick={onMenuToggle}
            style={{
              width: 34,
              height: 30,
              backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 3,
              cursor: "pointer",
              padding: "2px 4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <span style={{ display: "block", width: 18, height: 2, backgroundColor: "white" }} />
            <span style={{ display: "block", width: 18, height: 2, backgroundColor: "white" }} />
            <span style={{ display: "block", width: 18, height: 2, backgroundColor: "white" }} />
          </button>
          <button
            onClick={handleDashboardClick}
            type="button"
            className="hover:opacity-85 active:scale-95 transition-all text-left"
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              background: "transparent",
              border: "none",
              padding: "4px 2px",
              outline: "none",
            }}
            title={location.pathname === "/play" || location.pathname === "/play/" ? "Refresh Dashboard" : "Go to Dashboard"}
          >
            <span
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.2px",
              }}
            >
              Dashboard
            </span>
          </button>
        </div>

        {/* Center: Marquee Ticker */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            margin: "0 8px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              whiteSpace: "nowrap",
              animation: "marquee 14s linear infinite",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Welcome to Exchange. - null
          </div>
        </div>

        {/* Right: Balance & Username with dropdown */}
        <div
          ref={dropdownRef}
          style={{
            marginLeft: "auto",
            textAlign: "right",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ color: "white", fontSize: 13, fontWeight: 700 }}>
              <span>B: {balance.toLocaleString("en-IN")}</span>
              <span style={{ opacity: 0.9 }}> | L: 0</span>
            </div>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 2,
                cursor: "pointer",
                padding: 0,
                marginTop: 1,
              }}
            >
              {session.username}
              <ChevronDown size={14} color="white" />
            </button>
          </div>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 6,
                backgroundColor: "white",
                minWidth: 130,
                borderRadius: 4,
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                border: "1px solid rgba(0,0,0,0.1)",
                zIndex: 100,
                overflow: "hidden",
              }}
            >
              {menuItems.map((item) => (
                <div
                  key={item.label}
                  onClick={() => handleMenuItemClick(item.path)}
                  style={{
                    display: "block",
                    padding: "7px 12px",
                    fontSize: 12,
                    color: "#212529",
                    textAlign: "left",
                    cursor: "pointer",
                    borderBottom: "1px solid #f1f1f1",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {item.label}
                </div>
              ))}
              <div
                onClick={handleLogout}
                style={{
                  display: "block",
                  padding: "7px 12px",
                  fontSize: 12,
                  color: "#dc3545",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: 700,
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-bar: Credit, Balance, Liable, Active Bets */}
      <div
        style={{
          backgroundColor: "#1a395e",
          padding: "5px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 13,
          fontWeight: 700,
          color: "white",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div>Credit: 0</div>
        <div>Balance: {balance.toLocaleString("en-IN")}</div>
        <div>Liable: 0</div>
        <div>Active Bets: *</div>
      </div>
    </header>
  );
}
