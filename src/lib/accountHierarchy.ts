// Pure hierarchy rules shared with account workflows. Server must independently enforce.
export const ACCOUNT_ROLES = ["company", "superadmin", "admin", "supermaster", "master", "dealer", "client"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];
const CHILD_ROLE: Record<AccountRole, AccountRole | null> = {
  company: "superadmin",
  superadmin: "admin",
  admin: "supermaster",
  supermaster: "master",
  master: "dealer",
  dealer: "client",
  client: null,
};
export function normalizeAccountRole(input: unknown): AccountRole | null {
  const role = String(input ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const lookup: Record<string, AccountRole> = {
    company:"company", superadmin:"superadmin", admin:"admin",
    supermaster:"supermaster", master:"master", dealer:"dealer",
    client:"client", bettor:"client", user:"client"
  };
  return lookup[role] || null;
}
export function permittedChildRole(parentRole: unknown): AccountRole | null {
  const parent = normalizeAccountRole(parentRole);
  return parent ? CHILD_ROLE[parent] : null;
}
export function canCreateChild(parentRole: unknown, childRole: unknown): boolean {
  const desired = normalizeAccountRole(childRole);
  return desired !== null && permittedChildRole(parentRole) === desired;
}
export function roleLabel(role: unknown): string {
  const normalized = normalizeAccountRole(role);
  return ({company:"Company",superadmin:"SuperAdmin",admin:"Admin",
    supermaster:"SuperMaster",master:"Master",dealer:"Dealer",client:"Client"} as Record<AccountRole,string>)[normalized as AccountRole] || "Unknown";
}
