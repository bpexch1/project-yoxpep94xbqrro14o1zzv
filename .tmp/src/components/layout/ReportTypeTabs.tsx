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
      backgroundColor: "#ffffff",
      border: "1px solid #dee2e6",
      borderRadius: "4px",
      overflow: "hidden",
      marginBottom: "12px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    }}>
      {/* Header Bar */}
      <div style={{
        backgroundColor: "#f8f9fa",
        borderBottom: "1px solid #dee2e6",
        padding: "10px 15px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        <Filter style={{ width: "18px", height: "18px", color: "#212529", flexShrink: 0 }} />
        <strong style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "#212529",
          fontFamily: "inherit",
          lineHeight: "1",
        }}>
          Report Type
        </strong>
      </div>

      {/* Button Grid Area */}
      <div style={{
        backgroundColor: "#ffffff",
        padding: "15px 20px",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "6px",
      }}>
        {tabs.map((tab, index) => {
          const isActive =
            location.pathname === tab.path ||
            (tab.path === "/accounts" && location.pathname.startsWith("/accounts"));
          const isLast = index === tabs.length - 1;

          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              style={{
                padding: "6px 8px",
                border: `1px solid ${isActive ? "#17a2b8" : "#007bff"}`,
                borderRadius: "4px",
                backgroundColor: isActive ? "#17a2b8" : "#ffffff",
                color: isActive ? "#ffffff" : "#007bff",
                fontSize: "13px",
                fontWeight: 500,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                lineHeight: "1.5",
                boxSizing: "border-box",
                width: "100%",
                ...(isLast ? { 
                  gridColumn: "2", 
                  whiteSpace: "normal", 
                  textAlign: "center", 
                  fontSize: "11px", 
                  lineHeight: "1.2" 
                } : {}),
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#007bff";
                  (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#007bff";
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
                  (e.currentTarget as HTMLButtonElement).style.color = "#007bff";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#007bff";
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
