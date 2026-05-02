import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
      border: "1px solid #d0d0d0",
      borderRadius: 4,
      boxShadow: "0 1px 2px rgba(0,0,0,.06)",
      marginBottom: 12,
      padding: "8px 10px 10px 10px",
      overflow: "hidden"
    }}>
      <div style={{ 
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "4px",
      }}>
        {tabs.map((tab, index) => {
          const isActive = location.pathname === tab.path || (tab.path === "/accounts" && location.pathname === "/accounts");
          
          const baseStyle: React.CSSProperties = {
            fontSize: "12px",
            padding: "0 10px",
            height: "26px",
            lineHeight: "26px",
            borderRadius: "4px",
            border: "1px solid #2bbbad",
            display: "inline-block",
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            width: "100%",
            textAlign: "center",
            boxSizing: "border-box",
          };

          const activeStyle: React.CSSProperties = {
            ...baseStyle,
            background: "#2bbbad",
            color: "#fff",
            fontWeight: 600,
          };

          const inactiveStyle: React.CSSProperties = {
            ...baseStyle,
            background: "white",
            color: "#2bbbad",
            fontWeight: 500,
          };

          const btnStyle: React.CSSProperties = isActive ? { ...activeStyle } : { ...inactiveStyle };

          // Special case for Commission Report (last button, index 6)
          if (index === 6) {
            btnStyle.gridColumn = "2";
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
