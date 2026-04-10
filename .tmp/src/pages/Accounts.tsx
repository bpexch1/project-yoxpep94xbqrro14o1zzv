import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { SearchUsers } from "@/components/dashboard/SearchUsers";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { ClientSummaryCard } from "@/components/accounts/ClientSummaryCard";

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("Accounts");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => ClientEntity.list("-created_at"),
  });

  return (
    <Layout>
      <main className="p-4 max-w-4xl mx-auto space-y-4">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <SearchUsers />
        <ClientSummaryCard clients={clients || []} isLoading={isLoading} />
      </main>
    </Layout>
  );
}
