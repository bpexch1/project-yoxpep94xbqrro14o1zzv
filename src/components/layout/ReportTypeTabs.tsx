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
      background: "#f3f3f3",
      borderRadius: 6,
      border: "1px solid #d4d4d4",
      marginBottom: 14,
      overflow: "hidden",
      fontFamily: arialFont,
    }}>
      {/* Header bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: "#ececec",
        borderBottom: "1px solid #d4d4d4",
      }}>
        <Filter style={{ width: 14, height: 14, color: "#333", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>Report Type</span>
      </div>

      {/* Button grid — 3 columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "6px",
        padding: "10px 10px",
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
                border: `1.5px solid #12b886`,
                borderRadius: "4px",
                background: isActive ? "#12b886" : "#fff",
                color: isActive ? "#fff" : "#12b886",
                fontFamily: arialFont,
                fontSize: isCommission ? "11px" : "13px",
                fontWeight: 600,
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
