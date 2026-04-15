import { Filter } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { id: "Book Detail",       label: "Book Detail",       path: "/reports/book-detail" },
  { id: "Book Detail 2",     label: "Book Detail 2",     path: "/reports/book-detail-2" },
  { id: "Daily PL",          label: "Daily PL",          path: "/reports/daily-pl" },
  { id: "Daily Report",      label: "Daily Report",      path: "/reports/daily" },
  { id: "Final Sheet",       label: "Final Sheet",       path: "/reports/final-sheet" },
  { id: "Accounts",          label: "Accounts",          path: "/accounts" },
  { id: "Commission Report", label: "Commission Report", path: "/reports/commission" },
];

interface ReportTypeTabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function ReportTypeTabs({ activeTab, onTabChange }: ReportTypeTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentId = tabs.find(t => t.path === location.pathname)?.id ?? activeTab;
  const go = (tab: typeof tabs[0]) => { onTabChange(tab.id); navigate(tab.path); };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      border: "1px solid #e5e7eb",
      boxShadow: "0 1px 3px rgba(0,0,0,.08)",
      marginBottom: 16,
      overflow: "hidden",
      fontFamily: "Roboto, system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <Filter style={{ width: 16, height: 16, fill: "#212529", color: "#212529", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#212529" }}>Report Type</span>
      </div>

      {/* Button grid — 3 columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
        padding: "10px 12px 12px",
      }}>
        {tabs.map((tab) => {
          const isActive = currentId === tab.id;
          const isCommission = tab.id === "Commission Report";
          return (
            <button
              key={tab.id}
              onClick={() => go(tab)}
              style={{
                gridColumnStart: isCommission ? 2 : undefined,
                height: "38px",
                minHeight: "38px",
                maxHeight: "38px",
                width: "100%",
                border: `1.5px solid ${isActive ? "#28a745" : "#14b8a6"}`,
                borderRadius: "7px",
                background: isActive ? "#28a745" : "#fff",
                color: isActive ? "#fff" : "#14b8a6",
                fontFamily: "Roboto, system-ui, sans-serif",
                fontSize: isCommission ? "11px" : "12px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background .15s, color .15s",
                whiteSpace: "nowrap",
                padding: "0 4px",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                overflow: "hidden",
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
