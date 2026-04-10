import React, { useState, useEffect } from "react";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { SearchUsers } from "@/components/dashboard/SearchUsers";
import { ClientSummaryCard } from "@/components/accounts/ClientSummaryCard";

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("Accounts");

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: () => ClientEntity.list("-created_at"),
  });

  useEffect(() => {
    async function seedData() {
      if (clients && clients.length === 0 && !isLoading) {
        await ClientEntity.bulkCreate([
          {username: "10Ikram90", full_name: "Ikram Khan", role: "agent", credit_received: 100000000, credit_remaining: 41389000, cash: 10085000, pl_downline: -73102, balance_upline: 0, status: "active", parent_username: "NomanSA8592"},
          {username: "09Sarfraz90", full_name: "Sarfraz Ahmed", role: "client", credit_received: 2000000, credit_remaining: 2000000, cash: 0, pl_downline: 0, balance_upline: 0, status: "active", parent_username: "10Ikram90"},
          {username: "Neeraj685", full_name: "Neeraj Kumar", role: "client", credit_received: 1000000, credit_remaining: 914000, cash: 86000, pl_downline: 86002, balance_upline: 0, status: "active", parent_username: "10Ikram90"},
          {username: "@Sajid86755", full_name: "Sajid Ali", role: "agent", credit_received: 50000000, credit_remaining: 20000000, cash: -20000000, pl_downline: -1020000, balance_upline: 0, status: "active", parent_username: "NomanSA8592"}
        ]);
        refetch();
      }
    }
    seedData();
  }, [clients, isLoading, refetch]);

  return (
    <Layout>
      <main className="p-3 max-w-5xl mx-auto space-y-3">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <SearchUsers />
        <ClientSummaryCard clients={clients || []} isLoading={isLoading} />
      </main>
    </Layout>
  );
}
