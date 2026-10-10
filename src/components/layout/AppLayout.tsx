import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useIsFetching } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getClientSession } from "@/hooks/useClientAuth";

import { isStaffOrAdmin } from "@/lib/adminUiPolicy";
export { ADMIN_ROLES, isStaffOrAdmin } from "@/lib/adminUiPolicy";

function AdminLoadingOverlay() {
  const fetching = useIsFetching({ predicate: query => query.state.data === undefined && query.state.status === "pending" });
  return fetching ? <div className="reference-loading-overlay" role="status" aria-label="Loading"><img src="/reference/loading.gif" alt="" /></div> : null;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getClientSession();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-close mobile drawer when user navigates to any route
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    if (!isStaffOrAdmin(session.role)) {
      navigate("/play", { replace: true });
    }
  }, [session, navigate]);

  // If session is missing or role is client, don't render admin panel while redirecting
  if (!session || !isStaffOrAdmin(session.role)) {
    return (
      <div className="min-h-screen bg-[#ecf0f1] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  // Original reference pages are standalone for all legacy Cash/Credit/Cr and Ledger aliases.
  const standalone = /^\/accounts\/(?:cash-credit|cashcredit|cash|credit|cr|ledger)(?:\/|$)/i.test(location.pathname);
  if (standalone) return (
    <div className="reference-admin reference-standalone reference-page-fade min-h-screen">
      <AdminLoadingOverlay />
      <main className="main"><div className="container-fluid">{children}</div></main>
    </div>
  );

  return (
    <div className="app app-dashboard app-root reference-admin min-h-screen bg-[#E4E5E6] text-[#23282C] overflow-x-hidden" data-panel-role={session.role.toLowerCase()} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <AdminLoadingOverlay />
      {/* Header: fixed at top 55px */}
      <Header 
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)} 
        onToggleDesktopSidebar={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* Sidebar handles desktop fixed navigation and mobile overlay drawer */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />
      
      {/* Main content body: width 100% on mobile without squeeze/shift, offset on desktop (>=768px) */}
      <div className={cn(
        "admin-content flex flex-col min-h-[calc(100dvh-55px)] lg:min-h-[calc(100vh-55px)] w-full max-w-full overflow-x-hidden transition-all duration-250 ease-in-out bg-[#E4E5E6]",
        sidebarCollapsed ? "lg:ml-[50px] lg:w-[calc(100%-50px)]" : "lg:ml-[200px] lg:w-[calc(100%-200px)]",
        "ml-0", sidebarCollapsed ? "admin-content-collapsed" : ""
      )}>
        <main className="main flex-1 w-full max-w-full overflow-x-hidden">
          <div className="container-fluid">
            {children}
          </div>
        </main>
        <footer className="admin-footer">Welcome to Exchange.</footer>
      </div>
    </div>
  );
}
