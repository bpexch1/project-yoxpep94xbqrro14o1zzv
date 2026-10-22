import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { serviceRequest } from "@/services/client";

interface FeedHealth {
  service: string;
  version: number;
  feedConfigured: boolean;
}

interface ApiHealthDiagnosticsProps {
  embedded?: boolean;
}

export function ApiHealthDiagnostics({ embedded = false }: ApiHealthDiagnosticsProps) {
  const [health, setHealth] = useState<FeedHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await serviceRequest<FeedHealth>("health");
      setHealth(result);
    } catch (cause) {
      setHealth(null);
      setError(cause instanceof Error ? cause.message : "Backend health check failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  return (
    <section className={embedded ? "bg-white rounded border border-gray-200 p-4" : "bg-white rounded border border-gray-200 p-5"}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-5 h-5 text-[#00b181] shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-[#212529]">Server feed status</h2>
            <p className="text-sm text-gray-600 mt-1">
              Feed credentials are managed on the server. Keys cannot be entered, viewed, or stored in this browser.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading}
          className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>
      <div role="status" aria-live="polite" className="mt-4 text-sm">
        {loading && !health && "Checking backend…"}
        {error && <p className="text-red-700">Backend unavailable: {error}</p>}
        {health && <p className={health.feedConfigured ? "text-emerald-700" : "text-amber-800"}>
          {health.feedConfigured
            ? "Licensed feed credentials are configured on the server. This does not confirm the provider is currently responding."
            : "Licensed feed credentials are not configured on the server. Live market betting should remain unavailable."}
        </p>}
      </div>
    </section>
  );
}
