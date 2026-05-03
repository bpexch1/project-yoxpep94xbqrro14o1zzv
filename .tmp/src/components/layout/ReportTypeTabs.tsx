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
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        backgroundColor: "#f0f0f0",
        borderBottom: "1px solid #d0d0d0"
      }}>
        <Filter style={{ width: 18, height: 18, color: "#000000", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: "14px", color: "#000000" }}>Report Type</span>
      </div>

      <div style={{ padding: "10px 10px", backgroundColor: "#ffffff" }}>
        <div style={{ 
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
        }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === "/accounts" && location.pathname === "/accounts");
            
            const baseStyle: React.CSSProperties = {
              fontSize: "13px",
              padding: "4px 10px",
              lineHeight: "1.5",
              borderRadius: "4px",
              border: "1px solid #2bbbad",
              display: "inline-block",
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              textAlign: "center",
              boxSizing: "border-box",
              fontWeight: 400,
            };

            const activeStyle: React.CSSProperties = {
              ...baseStyle,
              background: "#2bbbad",
              color: "#fff",
            };

            const inactiveStyle: React.CSSProperties = {
              ...baseStyle,
              background: "#ffffff",
              color: "#2bbbad",
            };

            const btnStyle: React.CSSProperties = isActive ? { ...activeStyle } : { ...inactiveStyle };

            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                style={btnStyle}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#2bbbad";
                    e.currentTarget.style.color = "#fff";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.color = "#2bbbad";
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
