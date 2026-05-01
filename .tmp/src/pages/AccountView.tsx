import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Client as ClientEntity } from "@/entities";
import { getClientSession } from "@/hooks/useClientAuth";
import { ClientSummaryCard } from "@/components/accounts/ClientSummaryCard";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function AccountView() {
  const { username } = useParams();
  const navigate = useNavigate();
  const session = getClientSession();
  const [activeTab, setActiveTab] = useState("Accounts");

  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [session, navigate]);

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients", username],
    queryFn: () => {
      if (!username) return [];
      return ClientEntity.filter({ parent_username: username }, "-created_at");
    },
    enabled: !!username && !!session,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    select: (data: any) => data ? data.map((c: any) => ({ ...c })) : [],
  });

  const clientsKey = clients ? clients.map((c: any) => `${c.id}:${c.updated_at}`).join('|') : 'empty';

  return (
    <div className="bg-[#f0f0f0] min-h-screen pb-16">
      <main className="px-0 pt-0 pb-8 max-w-5xl mx-auto font-sans">
        <div className="h-3" />
        
        {/* Breadcrumb / Back Bar */}
        <div className="mx-3 mb-3 flex items-center gap-2 bg-white border border-[#d5d8dc] rounded-lg p-2 shadow-sm">
          <button 
            onClick={() => navigate("/accounts")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#2c3e50]" />
          </button>
          <div className="flex items-center text-sm font-bold text-[#2c3e50]">
            <span className="text-[#1a9e71]">Book</span>
            <span className="mx-2 text-gray-400 font-normal">/</span>
            <span>{username}</span>
          </div>
        </div>

        {/* Report Type card */}
        <div className="mx-3 mb-3">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Client List card */}
        <div className="mx-3">
          <ClientSummaryCard 
            key={clientsKey}
            clients={clients || []} 
            isLoading={isLoading} 
            username={username || 'User'}
            hideCreateButton={true}
            onRefresh={refetch}
          />
        </div>
      </main>
    </div>
  );
}
