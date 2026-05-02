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
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        padding: "8px 10px 10px 10px"
      }}>
        {tabs.map((tab, index) => {
          const isActive = location.pathname === tab.path || (tab.path === "/accounts" && location.pathname === "/accounts");
          const isLast = index === tabs.length - 1;
          
          const btnStyle: React.CSSProperties = isActive
            ? {
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid #2bbbad",
                background: "#2bbbad",
                color: "#fff",
                fontWeight: 600,
                height: "28px",
                lineHeight: "18px",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                transition: "opacity 0.15s",
              }
            : {
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid #2bbbad",
                background: "white",
                color: "#2bbbad",
                fontWeight: 500,
                height: "28px",
                lineHeight: "18px",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                transition: "opacity 0.15s",
              };

          if (isLast) {
            return (
              <div key={tab.label} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <button
                  onClick={() => navigate(tab.path)}
                  style={btnStyle}
                >
                  {tab.label}
                </button>
              </div>
            );
          }

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
