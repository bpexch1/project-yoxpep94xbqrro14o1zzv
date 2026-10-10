import React from "react";
import { Filter } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface ReportTypeTabsProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const reportButtons = [
  { id: "book-detail", label: "Book Detail", path: "/reports/book-detail" },
  { id: "book-detail-2", label: "Book Detail 2", path: "/reports/book-detail-2" },
  { id: "daily-pl", label: "Daily PL", path: "/reports/daily-pl" },
  { id: "daily-report", label: "Daily Report", path: "/reports/daily" },
  { id: "final-sheet", label: "Final Sheet", path: "/reports/final-sheet" },
  { id: "accounts", label: "Accounts", path: "/accounts" },
  { id: "commission-report", label: "Commission Report", path: "/reports/commission" },
];

export function ReportTypeTabs({ activeTab, onTabChange }: ReportTypeTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isCurrentActive = (path: string) => {
    if (path === "/accounts") {
      return location.pathname === "/accounts" || location.pathname.startsWith("/accounts/");
    }
    return location.pathname === path;
  };

  return (
    <div className="card">
      {/* Inspected Card Header */}
      <div className="card-header">
        <Filter size={16} fill="currentColor" aria-hidden="true" />
        <strong>Report Type</strong>
      </div>

      {/* Inspected Card Body (.card-body.reportmenubuttons) */}
      <div className="card-body reportmenubuttons">
        <div className="report-buttons-wrapper">
          {reportButtons.map((tab) => {
            const active = isCurrentActive(tab.path);

            if (active) {
              return (
                <button
                  key={tab.id}
                  id={tab.id}
                  type="button"
                  onClick={() => {
                    onTabChange?.(tab.label);
                    navigate(tab.path);
                  }}
                  className="btn btn-primary btn-report-active"
                >
                  {tab.label}
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                id={tab.id}
                type="button"
                onClick={() => {
                  onTabChange?.(tab.label);
                  navigate(tab.path);
                }}
                className="btn btn-outline-primary"
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



