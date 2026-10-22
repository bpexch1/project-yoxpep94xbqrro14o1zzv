import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./admin-reference.css";
import "./admin-video-reference.css";
import "./client-reference.css";
import "./admin-desktop-video-325861.css";
import { initClarity } from "./lib/clarity";

// Retire persistent account snapshots and the old browser-side provider key.
// A previously exposed provider key must also be rotated in its provider account.
try {
  localStorage.removeItem("clientSession");
  localStorage.removeItem("bpexch_api_config");
  localStorage.removeItem("bpexch_api_health_status");
} catch {
  // Storage can be disabled by the browser; the app should still render.
}

// Initialize Microsoft Clarity Analytics if Project ID is configured
initClarity();

createRoot(document.getElementById("root")!).render(<App />);
