import { ApiHealthDiagnostics } from "@/components/admin/ApiHealthDiagnostics";

export default function ApiSettings() {
  return (
    <div className="min-h-screen bg-[#e8e8e8] font-sans">
      <main className="w-full px-3 sm:px-4 py-4 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-300">
          <div>
            <h1 className="text-xl font-bold text-[#212529]">API Diagnostics & Configuration</h1>
            <p className="text-xs text-gray-600">
              Monitor live external data feeds, view response codes, and configure API access keys.
            </p>
          </div>
        </div>

        <ApiHealthDiagnostics />
      </main>
    </div>
  );
}
