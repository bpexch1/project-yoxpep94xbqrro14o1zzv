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
      backgroundColor: "#fff",
      borderRadius: 4,
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
        backgroundColor: "#ecf0f1",
        borderBottom: "1px solid #d0d0d0"
      }}>
        <Filter style={{ width: 16, height: 16, color: "#2c3e50", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#2c3e50" }}>Report Type</span>
      </div>
      <div style={{ padding: "10px 8px" }}>
        <div style={{ 
          display: "flex",
          flexWrap: "wrap",
          gap: 0,
          border: "1px solid #bbb",
          borderRadius: 4,
          overflow: "hidden"
        }}>
          {tabs.map((tab, index) => {
            const isActive = location.pathname === tab.path || (tab.path === "/accounts" && location.pathname === "/accounts");
            
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                style={{
                  padding: "5px 8px",
                  fontSize: "11px",
                  fontWeight: "600",
                  border: "none",
                  borderRight: index === tabs.length - 1 ? "none" : "1px solid #bbb",
                  background: isActive ? "#00b181" : "#f8f9fa",
                  color: isActive ? "#fff" : "#17a2b8",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                  minWidth: 0
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
