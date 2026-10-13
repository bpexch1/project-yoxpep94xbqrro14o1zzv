// V2 transport ONLY: all account, auth, wallet and ledger operations go via AWS.
// Never send Supabase service-role secrets or browser-supplied actor roles.
const configuredBase = (import.meta.env.VITE_V2_API_BASE_URL || "").replace(/\/+$/, "");
let accessToken: string | null = null;

export type V2Role = "company" | "superadmin" | "admin" | "supermaster" | "master" | "bettor";
export interface V2Account {
  id: string; username: string; display_name: string; role: V2Role;
  parent_id: string | null; status: "active" | "suspended" | "closed";
}
export interface V2Wallet { cash: number; credit_available: number; }
export interface V2LedgerEntry {
  id: number; request_id: string; wallet: "cash" | "credit";
  delta: number; before_balance: number; after_balance: number; created_at: string;
}

export function v2Configured(): boolean { return /^https:\/\/[a-z0-9.-]+$/i.test(configuredBase); }
export function v2SignOut(): void { accessToken = null; }
export function v2Authenticated(): boolean { return !!accessToken; }

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!v2Configured()) throw new Error("V2 AWS backend is not configured.");
  const headers = new Headers(options.headers);
  if (options.body) headers.set("content-type", "application/json");
  if (accessToken) headers.set("authorization", "Bearer " + accessToken);
  const response = await fetch(configuredBase + path, {
    ...options, headers, cache: "no-store", credentials: "omit",
  });
  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) v2SignOut();
    throw new Error(typeof payload?.error === "string" ? payload.error : "Service temporarily unavailable");
  }
  return payload as T;
}
export async function v2Health() {
  return api<{ok: boolean; service: string; backendConfigured: boolean}>("/v2/health");
}
export async function v2SignIn(username: string, password: string): Promise<void> {
  v2SignOut();
  const reply = await api<{ accessToken: string; expiresIn: number }>("/v2/auth/login",{
    method:"POST",body:JSON.stringify({username:username.trim(),password}),
  });
  if (!reply.accessToken) throw new Error("Login service did not provide a verified session");
  accessToken = reply.accessToken;
  // JWT intentionally kept in memory only, not localStorage or URL.
  // Refresh after expiry requires signing in again until an HttpOnly cookie-based
  // refresh endpoint is deployed behind the bpexch1.com API custom domain.
}
export async function v2Me() {
  return api<{account:V2Account;wallet:V2Wallet}>("/v2/me");
}
export async function v2Children() {
  return api<{accounts:V2Account[]}>("/v2/accounts/children");
}
export async function v2CreateChild(data:{
  username:string; email:string; password:string; displayName:string;
}) {
  return api<{account:V2Account}>("/v2/accounts",{method:"POST",body:JSON.stringify(data)});
}
export async function v2Transfer(input:{
  targetId:string;wallet:"cash"|"credit";direction:"deposit"|"withdraw";
  amount:string;description:string;requestId:string;
}) {
  if (!input.requestId) throw new Error("Unique request ID is required");
  return api<{success:boolean;replayed:boolean;requestId:string}>("/v2/wallet/transfer",{
    method:"POST",body:JSON.stringify(input),
  });
}
export async function v2Ledger(accountId?:string,limit=50){
  const params=new URLSearchParams({limit:String(Math.min(100,Math.max(1,limit)))});
  if(accountId)params.set("accountId",accountId);
  return api<{entries:V2LedgerEntry[]}>("/v2/ledger?"+params.toString());
}
