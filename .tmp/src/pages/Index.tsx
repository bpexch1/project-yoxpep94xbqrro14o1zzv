import { Layout } from "@/components/layout/Layout";
import { SearchUsers } from "@/components/dashboard/SearchUsers";
import { SportHighlights } from "@/components/dashboard/SportHighlights";

export default function Index() {
  return (
    <Layout>
      <main className="p-3 max-w-4xl mx-auto space-y-3">
        <SearchUsers />
        <SportHighlights />
      </main>
    </Layout>
  );
}
