import { useState } from "react";
import { v2Configured, v2Health } from "@/v2/apiClient";

type Status = "idle" | "checking" | "ready" | "unavailable";
export default function V2StatusPage() {
  const [state, setState] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  async function check() {
    setState("checking");
    setMessage("");
    try {
      const r = await v2Health();
      setState(r.ok && r.backendConfigured ? "ready" : "unavailable");
      setMessage(r.backendConfigured
        ? "AWS API responded. Account and transfer integration still requires end-to-end testing."
        : "AWS staging API is online, but fresh Supabase credentials are not connected.");
    } catch (error) {
      setState("unavailable");
      setMessage(error instanceof Error ? error.message : "Backend health could not be checked");
    }
  }
  return (
    <main className="min-h-screen bg-[#ecf0f1] p-4 text-[#212529]">
      <section className="mx-auto max-w-lg rounded border border-[#d3d8dc] bg-white p-5"
        style={{fontFamily:"Roboto Condensed, Arial, sans-serif"}}>
        <h1 className="text-xl font-bold">BPEXCH V2 — Backend Diagnostics</h1>
        <p className="mt-2 text-sm">
          Existing Admin and User Dashboard are preserved. This test page makes no balance,
          account or settlement changes.
        </p>
        <dl className="mt-4 text-sm">
          <div className="flex justify-between border-b py-2">
            <dt>AWS API configuration</dt>
            <dd>{v2Configured() ? "Present" : "Not configured"}</dd>
          </div>
          <div className="flex justify-between border-b py-2">
            <dt>Health check</dt><dd role="status">{state}</dd>
          </div>
        </dl>
        <button type="button" onClick={() => void check()} disabled={state === "checking"}
          className="mt-4 rounded bg-[#0088cc] px-4 py-2 text-white disabled:opacity-50">
          {state === "checking" ? "Checking…" : "Check AWS V2 Connection"}
        </button>
        {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      </section>
    </main>
  );
}
