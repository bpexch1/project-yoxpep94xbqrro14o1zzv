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
      border: "2px solid #007bff",
      borderRadius: "0px",
      overflow: "hidden",
      marginBottom: "12px",
      boxShadow: "0 1px 3px rgba(0,123,255,0.15)"
    }}>
      {/* Header Bar - Dark Grey */}
      <div style={{
        backgroundColor: "#333333",
        padding: "5px 10px",
        display: "flex",
        alignItems: "center",
      }}>
        <span style={{
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontFamily: "inherit",
        }}>
          Report Type
        </span>
      </div>

      {/* Button Grid Container */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px",
        backgroundColor: "#007bff",   // blue bg = blue 1px gaps between buttons
        padding: "0px",
      }}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path ||
            (tab.path === "/accounts" && location.pathname.startsWith("/accounts"));

          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              style={{
                height: "30px",
                margin: "0px",
                padding: "0px",
                border: "none",
                borderRadius: "0px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                whiteSpace: "nowrap",
                overflow: "hidden",
                lineHeight: "1",
                boxSizing: "border-box",
                width: "100%",
                transition: "background-color 0.15s ease-in-out, color 0.15s ease-in-out",
                backgroundColor: isActive ? "#007bff" : "#ffffff",
                color: isActive ? "#ffffff" : "#007bff",
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#007bff";
                  (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
                  (e.currentTarget as HTMLButtonElement).style.color = "#007bff";
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
