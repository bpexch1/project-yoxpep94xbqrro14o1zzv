import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Server,
  Globe,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  getStoredApiConfig,
  saveStoredApiConfig,
  getHealthStatusMap,
  testApiEndpoint,
  ApiConfig,
  ApiHealthStatus,
  DEFAULT_CONFIG,
} from "@/lib/apiManager";

interface ApiHealthDiagnosticsProps {
  embedded?: boolean;
}

export function ApiHealthDiagnostics({ embedded = false }: ApiHealthDiagnosticsProps) {
  const [config, setConfig] = useState<ApiConfig>(getStoredApiConfig());
  const [healthMap, setHealthMap] = useState<Record<string, ApiHealthStatus>>(getHealthStatusMap());
  const [isTesting, setIsTesting] = useState(false);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diagnostics" | "keys">("diagnostics");
  const [expandedJson, setExpandedJson] = useState<Record<string, boolean>>({});
  const [showKey, setShowKey] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setHealthMap(getHealthStatusMap());
  }, []);

  const handleTestAll = async () => {
    setIsTesting(true);
    try {
      const keys: Array<"cricket" | "football" | "tennis" | "betfair"> = [
        "cricket",
        "football",
        "tennis",
        "betfair",
      ];
      for (const k of keys) {
        setTestingKey(k);
        await testApiEndpoint(k, config);
        setHealthMap({ ...getHealthStatusMap() });
      }
    } finally {
      setIsTesting(false);
      setTestingKey(null);
      setHealthMap({ ...getHealthStatusMap() });
    }
  };

  const handleTestSingle = async (key: "cricket" | "football" | "tennis" | "betfair") => {
    setTestingKey(key);
    try {
      await testApiEndpoint(key, config);
      setHealthMap({ ...getHealthStatusMap() });
    } finally {
      setTestingKey(null);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredApiConfig(config);
    setSavedSuccessMsg("API Configuration saved successfully! Testing endpoints...");
    setTimeout(() => {
      setSavedSuccessMsg(null);
      handleTestAll();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset API configuration back to system default keys?")) {
      setConfig({ ...DEFAULT_CONFIG });
      saveStoredApiConfig(DEFAULT_CONFIG);
      setSavedSuccessMsg("Reset to default configuration.");
      setTimeout(() => setSavedSuccessMsg(null), 2500);
    }
  };

  const toggleJson = (key: string) => {
    setExpandedJson((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const apis: Array<"cricket" | "football" | "tennis" | "betfair"> = [
    "cricket",
    "football",
    "tennis",
    "betfair",
  ];

  const getStatusBadge = (item: ApiHealthStatus) => {
    if (item.statusType === "ok") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          200 OK • Live Feed
        </span>
      );
    }
    if (item.statusType === "quota_exceeded") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          429 Quota Exceeded (Fallback Active)
        </span>
      );
    }
    if (item.statusType === "subscription_required") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          403 Subscription Required (Fallback Active)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
        <Activity className="w-3.5 h-3.5 text-gray-500" />
        {item.statusCode ? `${item.statusCode} ${item.statusText}` : "Untested"}
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-[#d0d0d0] overflow-hidden ${embedded ? "mb-4" : "shadow-sm"}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#f8f9fa] border-b border-[#dee2e6]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#00b181]/10 flex items-center justify-center text-[#00b181]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#212529] flex items-center gap-2">
              External API Health & Diagnostics
            </h2>
            <p className="text-[11px] text-gray-500">
              Live external sport data providers status & fallback control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-[#e9ecef] rounded p-0.5 border border-[#ced4da]">
            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                activeTab === "diagnostics"
                  ? "bg-white text-[#212529] shadow-xs"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Status & Health
            </button>
            <button
              onClick={() => setActiveTab("keys")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                activeTab === "keys"
                  ? "bg-white text-[#212529] shadow-xs"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              API Keys & Settings
            </button>
          </div>

          <button
            onClick={handleTestAll}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#00b181] hover:bg-[#00966d] rounded transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
            {isTesting ? "Testing APIs..." : "Run Diagnostics"}
          </button>
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {savedSuccessMsg}
        </div>
      )}

      {/* Tab 1: Diagnostics Overview */}
      {activeTab === "diagnostics" && (
        <div className="p-4 space-y-3">
          {/* Summary Notice Banner */}
          <div className="p-3 bg-[#f8f9fa] border border-[#e2e8f0] rounded-md text-xs text-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00b181] shrink-0" />
              <span>
                <strong>Zero-Downtime Fallback Mode Active:</strong> When external APIs hit quota or subscription limits, high-fidelity mock matches (e.g. <em>Pakistan vs India</em>, <em>Real Madrid vs Barcelona</em>, <em>Alcaraz vs Sinner</em>) keep all betting views 100% interactive.
              </span>
            </div>
            <span className="text-[11px] text-gray-500 whitespace-nowrap">
              Last checked: {new Date().toLocaleTimeString()}
            </span>
          </div>

          {/* API Status Cards Table */}
          <div className="divide-y divide-[#edf2f7] border border-[#e2e8f0] rounded-lg overflow-hidden">
            {apis.map((apiKey) => {
              const status = healthMap[apiKey];
              if (!status) return null;
              const isExpanded = !!expandedJson[apiKey];
              const isItemTesting = testingKey === apiKey;

              return (
                <div key={apiKey} className="p-3.5 bg-white hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#212529]">{status.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                          {status.sport}
                        </span>
                        {getStatusBadge(status)}
                      </div>

                      <div className="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                          {status.endpointUrl}
                        </span>
                        {status.responseTimeMs !== null && (
                          <span className="text-[11px] text-gray-500">
                            Latency: <strong>{status.responseTimeMs}ms</strong>
                          </span>
                        )}
                      </div>

                      {/* Display Message */}
                      <div className="text-xs font-medium text-gray-800">
                        Status: <span className={status.statusType === "ok" ? "text-emerald-700" : "text-amber-700"}>{status.displayMessage}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <button
                        onClick={() => toggleJson(apiKey)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded ? "Hide Details" : "View Raw Response"}
                      </button>

                      <button
                        onClick={() => handleTestSingle(apiKey)}
                        disabled={isItemTesting || isTesting}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#00b181] hover:text-white hover:bg-[#00b181] rounded border border-[#00b181] transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isItemTesting ? "animate-spin" : ""}`} />
                        {isItemTesting ? "Testing..." : "Test"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded JSON / Technical Diagnostics */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-xs space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <div className="font-bold text-gray-700 mb-1">Request Headers:</div>
                          <pre className="font-mono text-gray-600 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(status.requestHeaders, null, 2)}
                          </pre>
                        </div>
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <div className="font-bold text-gray-700 mb-1">
                            HTTP Status & Error:
                          </div>
                          <div className="font-mono text-gray-600">
                            Status Code: <strong className="text-red-600">{status.statusCode || "None"}</strong> ({status.statusText})<br />
                            Exact Error: {status.exactError || "None"}<br />
                            Fallback Active: <strong>{status.isUsingFallback ? "Yes" : "No"}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 bg-[#1e293b] text-gray-200 rounded border border-gray-700 font-mono text-[11px] overflow-x-auto max-h-48">
                        <div className="text-gray-400 font-sans font-bold text-[10px] mb-1 uppercase tracking-wider">
                          Raw API Response JSON:
                        </div>
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(status.rawResponseJson, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: API Keys & Settings */}
      {activeTab === "keys" && (
        <form onSubmit={handleSaveConfig} className="p-4 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-start gap-2">
            <Key className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Instant API Key Replacement:</strong> Update RapidAPI credentials or service hostnames here. Changes are saved locally and take effect immediately across all match feeds and odds systems without server restarts.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RapidAPI Key */}
            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  RapidAPI Key (<span className="font-mono">x-rapidapi-key</span>)
                </label>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-[11px] text-[#00b181] hover:underline"
                >
                  {showKey ? "Hide Key" : "Show Key"}
                </button>
              </div>
              <input
                type={showKey ? "text" : "password"}
                value={config.rapidApiKey}
                onChange={(e) => setConfig({ ...config, rapidApiKey: e.target.value })}
                placeholder="Enter your RapidAPI Key (e.g. 3f6e56db9amsh...)"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded font-mono focus:border-[#00b181] focus:ring-1 focus:ring-[#00b181] outline-none"
              />
              <p className="text-[11px] text-gray-500">
                Used for Cricbuzz, SportAPI7 Football/Tennis, and Betfair RapidAPI endpoints.
              </p>
            </div>

            {/* Cricbuzz Host */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Cricbuzz Cricket Host (<span className="font-mono">x-rapidapi-host</span>)
              </label>
              <input
                type="text"
                value={config.cricbuzzHost}
                onChange={(e) => setConfig({ ...config, cricbuzzHost: e.target.value })}
                placeholder="cricbuzz-cricket.p.rapidapi.com"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded font-mono focus:border-[#00b181] focus:ring-1 focus:ring-[#00b181] outline-none"
              />
            </div>

            {/* SportAPI7 Host */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                SportAPI7 (Football/Tennis) Host
              </label>
              <input
                type="text"
                value={config.sportApi7Host}
                onChange={(e) => setConfig({ ...config, sportApi7Host: e.target.value })}
                placeholder="sportapi7.p.rapidapi.com"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded font-mono focus:border-[#00b181] focus:ring-1 focus:ring-[#00b181] outline-none"
              />
            </div>

            {/* Betfair Host */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Betfair RapidAPI Host
              </label>
              <input
                type="text"
                value={config.betfairHost}
                onChange={(e) => setConfig({ ...config, betfairHost: e.target.value })}
                placeholder="betfair-exchange-api2.p.rapidapi.com"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded font-mono focus:border-[#00b181] focus:ring-1 focus:ring-[#00b181] outline-none"
              />
            </div>

            {/* Custom Base URL */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Custom API Base URL (Optional)
              </label>
              <input
                type="text"
                value={config.apiBaseUrl}
                onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value })}
                placeholder="https://your-custom-backend.com"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded font-mono focus:border-[#00b181] focus:ring-1 focus:ring-[#00b181] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#00b181] hover:bg-[#00966d] rounded shadow-sm transition-colors"
              >
                Save & Apply API Keys
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
