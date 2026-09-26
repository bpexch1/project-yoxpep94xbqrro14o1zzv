import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { getClientSession } from "@/hooks/useClientAuth";

export const ADMIN_ROLES = [
  "company",
  "superadmin",
  "admin",
  "supermaster",
  "master",
  "dealer",
  "agent",
  "superagent",
  "subdealer",
  "subagent",
  "distributor",
  "minidistributor",
];

export const isStaffOrAdmin = (role?: string) => {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return ADMIN_ROLES.includes(r) || (r !== "client" && r !== "user" && r !== "bettor");
};

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
  
  return (
    <div className="app app-dashboard app-root min-h-screen bg-[#E4E5E6] text-[#23282C] overflow-x-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
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
        "flex flex-col min-h-[calc(100dvh-55px)] md:min-h-[calc(100vh-55px)] w-full max-w-full overflow-x-hidden transition-all duration-250 ease-in-out bg-[#E4E5E6]",
        sidebarCollapsed ? "md:ml-[60px] md:w-[calc(100%-60px)]" : "md:ml-[230px] md:w-[calc(100%-230px)]",
        "ml-0"
      )}>
        <main className="main flex-1 w-full max-w-full overflow-x-hidden">
          <div className="container-fluid">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
