import axios from "axios";

export interface ApiConfig {
  rapidApiKey: string;
  cricbuzzHost: string;
  sportApi7Host: string;
  betfairHost: string;
  apiBaseUrl: string;
  atdApiKey: string;
}

export interface ApiHealthStatus {
  key: "cricket" | "football" | "tennis" | "betfair";
  name: string;
  sport: string;
  endpointUrl: string;
  statusCode: number | null;
  statusText: string;
  statusType: "ok" | "quota_exceeded" | "subscription_required" | "error" | "untested";
  displayMessage: string;
  matchesReturned: number;
  lastChecked: string | null;
  responseTimeMs: number | null;
  requestHeaders: Record<string, string>;
  rawResponseJson: any;
  exactError: string | null;
  isUsingFallback: boolean;
}

const STORAGE_KEY = "bpexch_api_config";
const STATUS_STORAGE_KEY = "bpexch_api_health_status";

export const DEFAULT_CONFIG: ApiConfig = {
  rapidApiKey: (import.meta.env.VITE_RAPIDAPI_KEY || import.meta.env.RAPIDAPI_KEY || "3f6e56db9amsh8bb661e1e33739bp1041cdjsn7f5a3f41abfa") as string,
  cricbuzzHost: (import.meta.env.VITE_CRICBUZZ_HOST || "cricbuzz-cricket.p.rapidapi.com") as string,
  sportApi7Host: (import.meta.env.VITE_RAPIDAPI_HOST || "sportapi7.p.rapidapi.com") as string,
  betfairHost: "betfair-exchange-api2.p.rapidapi.com",
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || "") as string,
  atdApiKey: (import.meta.env.VITE_ATD_API_KEY || import.meta.env.ATD_API_KEY || "") as string,
};

export const INITIAL_HEALTH_STATUS: Record<string, ApiHealthStatus> = {
  cricket: {
    key: "cricket",
    name: "Cricbuzz Cricket API",
    sport: "Cricket",
    endpointUrl: `https://${DEFAULT_CONFIG.cricbuzzHost}/matches/v1/live`,
    statusCode: 429,
    statusText: "Too Many Requests",
    statusType: "quota_exceeded",
    displayMessage: "Sports data temporarily unavailable.",
    matchesReturned: 0,
    lastChecked: new Date().toISOString(),
    responseTimeMs: 120,
    requestHeaders: {
      "x-rapidapi-key": DEFAULT_CONFIG.rapidApiKey.slice(0, 8) + "...",
      "x-rapidapi-host": DEFAULT_CONFIG.cricbuzzHost,
      "Content-Type": "application/json",
    },
    rawResponseJson: {
      message: "You have exceeded the MONTHLY quota for Requests on your current plan, BASIC. Upgrade your plan at https://rapidapi.com/cricketapilive/api/cricbuzz-cricket",
    },
    exactError: "Request failed with status code 429",
    isUsingFallback: true,
  },
  football: {
    key: "football",
    name: "SportAPI7 Football API",
    sport: "Football",
    endpointUrl: `https://${DEFAULT_CONFIG.sportApi7Host}/api/v1/sport/football/events/live`,
    statusCode: 403,
    statusText: "Forbidden",
    statusType: "subscription_required",
    displayMessage: "Sports data temporarily unavailable.",
    matchesReturned: 0,
    lastChecked: new Date().toISOString(),
    responseTimeMs: 95,
    requestHeaders: {
      "x-rapidapi-key": DEFAULT_CONFIG.rapidApiKey.slice(0, 8) + "...",
      "x-rapidapi-host": DEFAULT_CONFIG.sportApi7Host,
      "Content-Type": "application/json",
    },
    rawResponseJson: {
      message: "You are not subscribed to this API.",
    },
    exactError: "Request failed with status code 403",
    isUsingFallback: true,
  },
  tennis: {
    key: "tennis",
    name: "SportAPI7 Tennis API",
    sport: "Tennis",
    endpointUrl: `https://${DEFAULT_CONFIG.sportApi7Host}/api/v1/sport/tennis/events/live`,
    statusCode: 403,
    statusText: "Forbidden",
    statusType: "subscription_required",
    displayMessage: "Sports data temporarily unavailable.",
    matchesReturned: 0,
    lastChecked: new Date().toISOString(),
    responseTimeMs: 88,
    requestHeaders: {
      "x-rapidapi-key": DEFAULT_CONFIG.rapidApiKey.slice(0, 8) + "...",
      "x-rapidapi-host": DEFAULT_CONFIG.sportApi7Host,
      "Content-Type": "application/json",
    },
    rawResponseJson: {
      message: "You are not subscribed to this API.",
    },
    exactError: "Request failed with status code 403",
    isUsingFallback: true,
  },
  betfair: {
    key: "betfair",
    name: "Betfair Exchange API",
    sport: "Multi-Sport",
    endpointUrl: `https://${DEFAULT_CONFIG.betfairHost}/getBetfairMatches`,
    statusCode: 403,
    statusText: "Forbidden",
    statusType: "subscription_required",
    displayMessage: "Sports data temporarily unavailable.",
    matchesReturned: 0,
    lastChecked: new Date().toISOString(),
    responseTimeMs: 110,
    requestHeaders: {
      "x-rapidapi-key": DEFAULT_CONFIG.rapidApiKey.slice(0, 8) + "...",
      "x-rapidapi-host": DEFAULT_CONFIG.betfairHost,
      "Content-Type": "application/json",
    },
    rawResponseJson: {
      message: "You are not subscribed to this API.",
    },
    exactError: "Request failed with status code 403",
    isUsingFallback: true,
  },
};

export function getStoredApiConfig(): ApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.debug("Failed to read stored API config:", err);
  }
  return { ...DEFAULT_CONFIG };
}

export function saveStoredApiConfig(config: Partial<ApiConfig>): ApiConfig {
  const updated = { ...getStoredApiConfig(), ...config };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save API config:", err);
  }
  return updated;
}

export function getHealthStatusMap(): Record<string, ApiHealthStatus> {
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY);
    if (raw) {
      return { ...INITIAL_HEALTH_STATUS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.debug("Failed to read stored API health status:", err);
  }
  return { ...INITIAL_HEALTH_STATUS };
}

export function updateHealthStatus(key: string, status: Partial<ApiHealthStatus>) {
  const current = getHealthStatusMap();
  current[key] = { ...(current[key] || INITIAL_HEALTH_STATUS[key]), ...status };
  try {
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.debug("Failed to save API health status:", err);
  }
}

/**
 * Diagnostic helper to test a specific API endpoint live
 */
export async function testApiEndpoint(
  apiType: "cricket" | "football" | "tennis" | "betfair",
  customConfig?: Partial<ApiConfig>
): Promise<ApiHealthStatus> {
  const config = { ...getStoredApiConfig(), ...customConfig };
  let url = "";
  let headers: Record<string, string> = {};
  let name = "";
  let sport = "";

  if (apiType === "cricket") {
    name = "Cricbuzz Cricket API";
    sport = "Cricket";
    url = `https://${config.cricbuzzHost}/matches/v1/live`;
    headers = {
      "x-rapidapi-key": config.rapidApiKey,
      "x-rapidapi-host": config.cricbuzzHost,
      "Content-Type": "application/json",
    };
  } else if (apiType === "football") {
    name = "SportAPI7 Football API";
    sport = "Football";
    url = `https://${config.sportApi7Host}/api/v1/sport/football/events/live`;
    headers = {
      "x-rapidapi-key": config.rapidApiKey,
      "x-rapidapi-host": config.sportApi7Host,
      "Content-Type": "application/json",
    };
  } else if (apiType === "tennis") {
    name = "SportAPI7 Tennis API";
    sport = "Tennis";
    url = `https://${config.sportApi7Host}/api/v1/sport/tennis/events/live`;
    headers = {
      "x-rapidapi-key": config.rapidApiKey,
      "x-rapidapi-host": config.sportApi7Host,
      "Content-Type": "application/json",
    };
  } else {
    name = "Betfair Exchange API";
    sport = "Multi-Sport";
    url = `https://${config.betfairHost}/getBetfairMatches`;
    headers = {
      "x-rapidapi-key": config.rapidApiKey,
      "x-rapidapi-host": config.betfairHost,
      "Content-Type": "application/json",
    };
  }

  const startTime = Date.now();
  console.log(`[API Request] URL: ${url}`);
  try {
    const res = await axios.get(url, { headers, timeout: 8000 });
    const duration = Date.now() - startTime;

    let count = 0;
    if (apiType === "cricket") {
      const typeMatches = Array.isArray(res.data?.typeMatches) ? res.data.typeMatches : [];
      for (const tm of typeMatches) {
        const seriesMatches = Array.isArray(tm?.seriesMatches) ? tm.seriesMatches : [];
        for (const sm of seriesMatches) {
          const wrapper = sm?.seriesAdWrapper || sm;
          const rawMatches = Array.isArray(wrapper?.matches) ? wrapper.matches : [];
          count += rawMatches.length;
        }
      }
    } else {
      const rawEvents = Array.isArray(res.data?.events) ? res.data.events : Array.isArray(res.data) ? res.data : [];
      count = rawEvents.length;
    }

    console.log(`[API Response] URL: ${url} | Status: ${res.status} | Body:`, res.data);
    console.log(`[API Result] Match Count: ${count}`);

    const result: ApiHealthStatus = {
      key: apiType,
      name,
      sport,
      endpointUrl: url,
      statusCode: res.status,
      statusText: res.statusText || "OK",
      statusType: "ok",
      displayMessage: `${sport} API is operational (${count} live events)`,
      matchesReturned: count,
      lastChecked: new Date().toISOString(),
      responseTimeMs: duration,
      requestHeaders: {
        ...headers,
        "x-rapidapi-key": headers["x-rapidapi-key"] ? headers["x-rapidapi-key"].slice(0, 8) + "..." : "",
      },
      rawResponseJson: res.data,
      exactError: null,
      isUsingFallback: false,
    };

    updateHealthStatus(apiType, result);
    return result;
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const statusCode = err.response?.status || null;
    const statusText = err.response?.statusText || "Error";
    const rawData = err.response?.data || null;

    console.warn(`[API Response] URL: ${url} | Status: ${statusCode || 'Network Error'} | Body:`, rawData || err.message);
    console.log(`[API Result] Match Count: 0`);

    let statusType: ApiHealthStatus["statusType"] = "error";
    let displayMessage = `${sport} feed unavailable`;

    if (statusCode === 429) {
      statusType = "quota_exceeded";
      displayMessage = "Cricket feed unavailable - API quota exceeded";
    } else if (statusCode === 403) {
      statusType = "subscription_required";
      displayMessage = "Football/Tennis feed unavailable - API subscription required";
    }

    const result: ApiHealthStatus = {
      key: apiType,
      name,
      sport,
      endpointUrl: url,
      statusCode,
      statusText,
      statusType,
      displayMessage,
      matchesReturned: 0,
      lastChecked: new Date().toISOString(),
      responseTimeMs: duration,
      requestHeaders: {
        ...headers,
        "x-rapidapi-key": headers["x-rapidapi-key"] ? headers["x-rapidapi-key"].slice(0, 8) + "..." : "",
      },
      rawResponseJson: rawData,
      exactError: err.message || String(err),
      isUsingFallback: false,
    };

    updateHealthStatus(apiType, result);
    return result;
  }
}
