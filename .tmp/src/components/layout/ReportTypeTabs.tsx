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
  const navigate  = useNavigate();
  const location  = useLocation();
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
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <Filter style={{ width: 16, height: 16, fill: "#1a1a2e", color: "#1a1a2e", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>Report Type</span>
      </div>

      {/* Button grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
        padding: "16px",
      }}>
        {tabs.map((tab) => {
          const isActive    = currentId === tab.id;
          const isCommission = tab.id === "Commission Report";
          return (
            <button
              key={tab.id}
              onClick={() => go(tab)}
              style={{
                gridColumnStart: isCommission ? 2 : undefined,
                height: "40px",
                minHeight: "40px",
                maxHeight: "40px",
                width: "100%",
                border: `2px solid ${isActive ? "#16a34a" : "#14b8a6"}`,
                borderRadius: "8px",
                background: isActive ? "#16a34a" : "#fff",
                color: isActive ? "#fff" : "#14b8a6",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background .15s, color .15s",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                padding: "0 6px",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
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
