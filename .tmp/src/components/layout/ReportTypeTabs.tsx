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

  const arialFont = "Arial, Helvetica, sans-serif";

  return (
    <div style={{
      background: "#fff",
      borderRadius: "0px",
      border: "1px solid #ccc",
      marginBottom: "8px",
      overflow: "hidden",
      fontFamily: arialFont,
    }}>
      {/* Header bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        background: "#e8e8e8",
        borderBottom: "1px solid #ccc",
      }}>
        <Filter style={{ width: 14, height: 14, color: "#333", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>Report Type</span>
      </div>

      {/* Buttons row */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        padding: "10px 14px 12px",
      }}>
        {tabs.map((tab) => {
          const isActive = currentId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => go(tab)}
              style={{
                height: "32px",
                padding: "0 14px",
                border: "1px solid #12b886",
                borderRadius: "4px",
                background: isActive ? "#12b886" : "#fff",
                color: isActive ? "#fff" : "#12b886",
                fontFamily: arialFont,
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background .15s, color .15s",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
