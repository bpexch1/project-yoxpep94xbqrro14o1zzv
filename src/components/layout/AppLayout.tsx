import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const session = getClientSession();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    <div className="app app-dashboard app-root min-h-screen bg-[rgb(228,229,230)] text-[rgb(35,40,44)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Sidebar handles both desktop and mobile modes */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />
      
      {/* Right side: header + content, offset by sidebar width on desktop */}
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-200",
        sidebarCollapsed ? "lg:ml-[60px]" : "lg:ml-[230px]"
      )}>
        <Header 
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} 
          onToggleDesktopSidebar={() => setSidebarCollapsed(prev => !prev)}
        />
        <main className="flex-1 overflow-x-hidden p-2 sm:p-3">
          {children}
        </main>
      </div>
    </div>
  );
}
