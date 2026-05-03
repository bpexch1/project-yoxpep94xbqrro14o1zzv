import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { getClientSession } from "@/hooks/useClientAuth";

const ADMIN_ROLES = ["company", "superadmin", "admin", "supermaster", "master"];

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

    const userRole = session.role?.toLowerCase();
    if (!ADMIN_ROLES.includes(userRole)) {
      navigate("/play", { replace: true });
    }
  }, [session, navigate]);

  // If session is missing or role is not admin, don't render anything while redirecting
  if (!session || !ADMIN_ROLES.includes(session.role?.toLowerCase())) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#ecf0f1]">
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
        sidebarCollapsed ? "lg:ml-[60px]" : "lg:ml-[200px]"
      )}>
        <Header 
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} 
          onToggleDesktopSidebar={() => setSidebarCollapsed(prev => !prev)}
        />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
