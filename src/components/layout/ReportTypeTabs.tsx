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
      border: "1px solid #d0d0d0",
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
        background: "#ecf0f1",
        borderBottom: "1px solid #d0d0d0",
      }}>
        <Filter style={{ width: 16, height: 16, fill: "#000", color: "#000", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#212529" }}>Report Type</span>
      </div>

      {/* Button Row — Horizontal Flex Wrap */}
      <div className="flex flex-wrap gap-2 justify-center md:justify-start" style={{
        padding: "10px 12px 14px",
      }}>
        {tabs.map((tab) => {
          const isActive = currentId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => go(tab)}
              style={{
                background: isActive ? "#1a9e71" : "transparent",
                border: "1.5px solid #1a9e71",
                color: isActive ? "#fff" : "#1a9e71",
                borderRadius: "5px",
                padding: "5px 12px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#1a9e71";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#1a9e71";
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
