import React from "react";
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
      border: "1px solid #dee2e6",
      borderRadius: 4,
      boxShadow: "0 1px 2px rgba(0,0,0,.06)",
      marginBottom: 12,
      padding: 0,
      overflow: "hidden"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        backgroundColor: "#dcdcdc",
        borderBottom: "1px solid #c8c8c8"
      }}>
        <Filter style={{ width: 18, height: 18, color: "#2d2d2d", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: "14px", color: "#2d2d2d" }}>Report Type</span>
      </div>
      <div style={{ padding: "10px 10px", backgroundColor: "#ffffff" }}>
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "6px",
        }}>
          {tabs.map((tab, index) => {
            const isActive = location.pathname === tab.path || (tab.path === "/accounts" && location.pathname === "/accounts");
            
            const baseStyle: React.CSSProperties = {
              fontSize: "12px",
              padding: "4px 8px",
              lineHeight: "1.4",
              borderRadius: "8px",
              border: "1.5px solid #2bbbad",
              display: "block",
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              width: "100%",
              textAlign: "center",
              boxSizing: "border-box",
            };

            const activeStyle: React.CSSProperties = {
              ...baseStyle,
              background: "#00b181",
              color: "#fff",
              fontWeight: 600,
              border: "1.5px solid #00b181",
            };

            const inactiveStyle: React.CSSProperties = {
              ...baseStyle,
              background: "#ffffff",
              color: "#2bbbad",
              fontWeight: 500,
            };

            const btnStyle: React.CSSProperties = isActive ? { ...activeStyle } : { ...inactiveStyle };

            if (index === 6) {
              btnStyle.gridColumn = "1 / -1";
              btnStyle.width = "calc(66.666% - 4px)";
              btnStyle.margin = "0 auto";
              btnStyle.display = "block";
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
    </div>
  );
}
