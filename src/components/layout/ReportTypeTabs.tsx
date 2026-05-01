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
      <div style={{ 
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "5px",
        padding: "10px 12px 12px 12px"
      }}>
        {tabs.map((tab, index) => {
          const isActive = location.pathname === tab.path || (tab.path === "/accounts" && location.pathname === "/accounts");
          const isLast = index === tabs.length - 1;
          
          // Active = btn-primary, Inactive = btn-outline-primary
          const btnStyle: React.CSSProperties = isActive
            ? {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "5px 8px",
                fontSize: "13px",
                fontWeight: 400,
                lineHeight: "1.5",
                borderRadius: "4px",
                border: "1px solid #00b181",
                background: "#00b181",
                color: "#fff",
                cursor: "pointer",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                boxSizing: "border-box",
                gridColumn: isLast ? "2" : "auto",
                fontFamily: "inherit",
                transition: "opacity 0.15s",
              }
            : {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "5px 8px",
                fontSize: "13px",
                fontWeight: 400,
                lineHeight: "1.5",
                borderRadius: "4px",
                border: "1px solid #17a2b8",
                background: "#ffffff",
                color: "#17a2b8",
                cursor: "pointer",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                boxSizing: "border-box",
                gridColumn: isLast ? "2" : "auto",
                fontFamily: "inherit",
                transition: "opacity 0.15s",
              };

          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              style={btnStyle}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
