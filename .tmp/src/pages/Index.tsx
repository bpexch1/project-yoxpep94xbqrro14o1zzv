import React from "react";
import { Layout } from "@/components/layout/Layout";
import { SearchUsers } from "@/components/dashboard/SearchUsers";
import { SportHighlights } from "@/components/dashboard/SportHighlights";

const Index = () => {
  return (
    <Layout>
      <div className="p-3 max-w-4xl mx-auto space-y-4">
        <SearchUsers />
        <SportHighlights />
      </div>
    </Layout>
  );
};

export default Index;
