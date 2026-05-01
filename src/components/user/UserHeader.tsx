import React, { useState, useEffect } from "react";
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const s = getClientSession();
    if (!s) navigate("/login");
    else setSession(s);
  }, [navigate]);

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
  };

  if (!session) return null;

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
          minHeight: 64,
          position: "relative",
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

        {/* Center: Welcome Brand */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            color: "white",
            fontWeight: 700,
            fontSize: 18,
            whiteSpace: "nowrap",
          }}
        >
          Welcome to BpExch
        </div>

        {/* Right: Balance + Username */}
        <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 18 }}>
            B: {balance.toLocaleString('en-IN')} | L: 0
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 2,
              cursor: "pointer",
            }}
            onClick={handleLogout}
          >
            <span style={{ color: "white", fontSize: 14, fontWeight: 500 }}>
              {session.username}
            </span>
            <ChevronDown size={14} color="white" />
          </div>
        </div>
      </div>
    </header>
  );
}
