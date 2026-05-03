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

      <div style={{ padding: "12px", backgroundColor: "#ffffff" }}>
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
        }}>
          {tabs.map((tab, index) => {
            const isActive = location.pathname === tab.path || (tab.path === "/accounts" && location.pathname === "/accounts");
            
            const isLast = index === tabs.length - 1;

            const baseStyle: React.CSSProperties = {
              fontSize: "15px",
              padding: "12px 8px",
              lineHeight: "1.5",
              borderRadius: "8px",
              border: "1.5px solid #2bbbad",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              textAlign: "center",
              boxSizing: "border-box",
              fontWeight: 400,
              width: "100%",
              transition: "all 0.2s ease",
            };

            const activeStyle: React.CSSProperties = {
              ...baseStyle,
              background: "#00b181",
              color: "#fff",
              border: "1.5px solid #00b181",
            };

            const inactiveStyle: React.CSSProperties = {
              ...baseStyle,
              background: "#ffffff",
              color: "#2bbbad",
            };

            const btnStyle: React.CSSProperties = {
              ...(isActive ? activeStyle : inactiveStyle),
              ...(isLast ? { gridColumn: "2 / 3" } : {})
            };

            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                style={btnStyle}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#00b181";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.borderColor = "#00b181";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.color = "#2bbbad";
                    e.currentTarget.style.borderColor = "#2bbbad";
                  }
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
