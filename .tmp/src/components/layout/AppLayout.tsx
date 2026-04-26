import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-[#e9ecef]">
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
