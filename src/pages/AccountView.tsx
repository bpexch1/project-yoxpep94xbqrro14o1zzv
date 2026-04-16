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
  });

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  return (
    <div className="bg-[#d8d8d8] min-h-screen pb-16" style={arialFont}>
      <main className="px-0 pt-2 pb-8 max-w-[980px] mx-auto">
        
        {/* Breadcrumb / Back Bar */}
        <div className="mx-2 mb-2 flex items-center gap-2 bg-white border border-[#ccc] rounded-none p-[10px] shadow-none">
          <button 
            onClick={() => navigate("/accounts")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#333]" />
          </button>
          <div className="flex items-center text-sm font-bold text-[#333]">
            <span className="text-[#12b886]">Book</span>
            <span className="mx-2 text-gray-400 font-normal">/</span>
            <span>{username}</span>
          </div>
        </div>

        {/* Report Type card */}
        <div className="mx-2">
          <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Client List card */}
        <div className="mx-2">
          <ClientSummaryCard 
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
