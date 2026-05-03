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
      border: "1px solid #dee2e6",
      borderRadius: 4,
      boxShadow: "0 1px 2px rgba(0,0,0,.06)",
      marginBottom: 12,
      padding: 0,
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4.8px 20px",
        backgroundColor: "#f0f3f5",
        borderBottom: "1px solid #d0d0d0",
        borderRadius: "3px 3px 0px 0px",
        color: "#23282c",
        fontSize: "16px",
        fontWeight: 400,
        lineHeight: "24px",
        flexDirection: "row",
        flexWrap: "nowrap"
      }}>
        <i className="fa fa-filter" style={{ fontSize: "16px", color: "#23282c", flexShrink: 0 }} />
        <strong style={{ fontWeight: 700, fontSize: "16px", color: "#23282c" }}>Report Type</strong>
      </div>

      <div style={{ 
        padding: "0px", 
        backgroundColor: "#007bff",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px",
      }}>
        {tabs.map((tab, index) => {
            const isActive = location.pathname === tab.path || (tab.path === "/accounts" && location.pathname === "/accounts");
            
            const baseStyle: React.CSSProperties = {
              height: "30px",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              borderRadius: "0px",
              padding: "0px",
              margin: "0px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              width: "100%",
              border: "none",
              transition: "all 0.15s ease-in-out",
              lineHeight: "1",
              fontFamily: "inherit",
              boxSizing: "border-box",
            };

            const activeStyle: React.CSSProperties = {
              ...baseStyle,
              background: "#007bff",
              color: "#ffffff",
            };

            const inactiveStyle: React.CSSProperties = {
              ...baseStyle,
              background: "#f8f9fa",
              color: "#007bff",
            };

            const btnStyle: React.CSSProperties = isActive ? activeStyle : inactiveStyle;

            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                style={btnStyle}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#007bff";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                    e.currentTarget.style.color = "#007bff";
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
      </div>
    </div>
  );
}
