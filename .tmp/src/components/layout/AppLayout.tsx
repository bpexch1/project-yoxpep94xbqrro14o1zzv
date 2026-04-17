import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-[#f4f6f7]">
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
        <Header onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden pb-[25px]">
          {children}
        </main>
        
        {/* News Ticker Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-30 h-[25px] bg-[#2c3e50] overflow-hidden flex items-center border-t border-white/10">
          <div className="animate-marquee whitespace-nowrap flex">
            <span style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
              <b>Welcome to Exchange.</b>
            </span>
            {/* Repeat text so scroll feels continuous */}
            <span style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
              <b>Welcome to Exchange.</b>
            </span>
            <span style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
              <b>Welcome to Exchange.</b>
            </span>
            <span style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
              <b>Welcome to Exchange.</b>
            </span>
            <span style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
              <b>Welcome to Exchange.</b>
            </span>
            <span style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
              <b>Welcome to Exchange.</b>
            </span>
            <span style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
              <b>Welcome to Exchange.</b>
            </span>
            <span style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
              <b>Welcome to Exchange.</b>
            </span>
            <span style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
              <b>Welcome to Exchange.</b>
            </span>
            <span style={{ font: 'bold 10px Verdana, sans-serif', color: '#fff', padding: '0 7px' }}>
              <b>Welcome to Exchange.</b>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
