import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getClientSession, clearClientSession } from "@/hooks/useClientAuth";
import { Client } from "@/entities";
import { useQuery } from "@tanstack/react-query";

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
    if (!s) navigate("/login");
    else setSession(s);
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

  const handleDashboardClick = () => {
    if (location.pathname === "/play") {
      navigate(0);
    } else {
      navigate("/play");
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
        backgroundColor: "#254465",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 12px",
          minHeight: 56,
        }}
      >
        {/* Left: hamburger + Dashboard label */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onMenuToggle}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ display: "block", width: 22, height: 2, backgroundColor: "white" }} />
            <span style={{ display: "block", width: 22, height: 2, backgroundColor: "white" }} />
            <span style={{ display: "block", width: 22, height: 2, backgroundColor: "white" }} />
          </button>
          <span
            onClick={handleDashboardClick}
            style={{ color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer" }}
          >
            Dashboard
          </span>
        </div>

        {/* Right: Dropdown with Balance and User */}
        <div 
          ref={dropdownRef}
          style={{ 
            marginLeft: "auto", 
            textAlign: "right",
            position: "relative"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ color: "white", fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>B: Rs. {balance.toLocaleString('en-IN')}</span>
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
                gap: 4,
                marginTop: 2,
                cursor: "pointer",
                padding: 0
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
                marginTop: 8,
                backgroundColor: "white",
                minWidth: 130,
                borderRadius: 4,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "1px solid rgba(0,0,0,0.1)",
                zIndex: 100,
                overflow: "hidden"
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
                    transition: "background-color 0.2s"
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
                  color: "#212529",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "background-color 0.2s"
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
    </header>
  );
}
