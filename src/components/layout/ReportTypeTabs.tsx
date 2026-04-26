import React from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

import { Filter } from "lucide-react";

interface ReportTypeTabsProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const tabs = [
  { label: "Book Detail", path: "/reports/book-detail" },
  { label: "Book Detail 2", path: "/reports/book-detail-2" },
  { label: "Daily PL", path: "/reports/daily-pl" },
  { label: "Daily Report", path: "/reports/daily" },
  { label: "Final Sheet", path: "/reports/final-sheet" },
  { label: "Accounts", path: "/accounts" },
  { label: "Commission Report", path: "/reports/commission" },
];

export function ReportTypeTabs({ activeTab, onTabChange }: ReportTypeTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      border: "1px solid #d0d0d0",
      boxShadow: "0 1px 3px rgba(0,0,0,.08)",
      marginBottom: 16,
      overflow: "hidden"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        background: "#ecf0f1",
        borderBottom: "1px solid #d0d0d0"
      }}>
        <Filter style={{ width: 16, height: 16, fill: "#000", color: "#000", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#212529" }}>Report Type</span>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 8,
          justifyContent: "flex-start"
        }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === "/accounts" && location.pathname === "/accounts");
            
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                style={{
                  flex: "0 0 calc(33.333% - 6px)",
                  maxWidth: "calc(33.333% - 6px)",
                  boxSizing: "border-box",
                  padding: "7px 4px",
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  border: `1px solid ${isActive ? "#00a65a" : "#17a2b8"}`,
                  background: isActive ? "#00a65a" : "transparent",
                  color: isActive ? "#fff" : "#17a2b8",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
