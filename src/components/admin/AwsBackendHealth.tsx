import { useState } from "react";
import { Activity, Server, ShieldAlert } from "lucide-react";

const healthPath = "/aws-health"; // Same-origin Vercel proxy: avoids cross-origin CORS failures.
type CheckState = "idle" | "checking" | "ready" | "error";

export function AwsBackendHealth() {
  const [state, setState] = useState<CheckState>("idle");
  const [message, setMessage] = useState("Click Check Connection to query the deployed AWS staging service.");
  const verify = async () => {
    setState("checking");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(healthPath, { method: "GET", cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const body = await response.json();
      if (body?.ok !== true || body?.status !== "read-only" || body?.service !== "bpexch-api") {
        throw new Error("Unexpected AWS health response");
      }
      setState("ready");
      setMessage("AWS API is connected in " + String(body.region || "configured region") + ". Read-only staging mode; financial operations are not enabled.");
    } catch (error) {
      setState("error");
      setMessage("AWS health check failed: " + (error instanceof Error ? error.message : "Unknown error") + ". Check the Vercel staging rewrite and Lambda status.");
    } finally {
      window.clearTimeout(timer);
    }
  };
  return (
    <section className="rounded border border-[#c8ced3] bg-white shadow-sm" aria-label="AWS backend diagnostic">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#c8ced3] bg-[#f0f3f5]">
        <div className="flex items-center gap-2 text-[#252b31]">
          <Server size={18} aria-hidden="true" />
          <h2 className="text-[15px] font-extrabold">AWS Backend Connection</h2>
        </div>
        <span className="rounded-sm border border-amber-400 bg-amber-50 px-2 py-1 text-[11px] font-extrabold text-amber-800">
          STAGING • READ-ONLY
        </span>
      </header>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2 text-[13px] text-slate-600">
          <ShieldAlert size={17} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>Health checks are safe. Live market feeds, bet matching and settlement still require a verified backend/database integration.</span>
        </div>
        <div role="status" aria-live="polite" className="flex items-start gap-2 text-[13px] text-[#252b31]">
          <Activity size={17} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{message}</span>
        </div>
        <button type="button" disabled={state === "checking"} onClick={verify}
          className="rounded bg-[#00a88a] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#008a70] focus-visible:outline-2 focus-visible:outline-[#19a9d1] disabled:opacity-60">
          {state === "checking" ? "Checking..." : "Check AWS Connection"}
        </button>
      </div>
    </section>
  );
}
