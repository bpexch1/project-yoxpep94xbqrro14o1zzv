import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    const s = getClientSession();
    if (!s) navigate("/login");
    else setSession(s);
  }, [navigate]);

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
          <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Dashboard</span>
        </div>

        {/* Right: Welcome + Balance + Username */}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Welcome to Exchange</span>
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
              B: Rs. {balance.toLocaleString('en-IN')} | L: 0
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 4,
              marginTop: 2,
              cursor: "pointer",
            }}
            onClick={handleLogout}
          >
            <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>
              {session.username}
            </span>
            <ChevronDown size={14} color="white" />
          </div>
        </div>
      </div>
    </header>
  );
}
