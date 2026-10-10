// Pure hierarchy rules shared with account workflows. Database must enforce independently.
// "client" is a legacy persisted role; the product now calls this role "Bettor".
export const ACCOUNT_ROLES = ["company", "superadmin", "admin", "supermaster", "master", "bettor"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];
const CHILD_ROLE: Record<AccountRole, AccountRole | null> = {
  company: "superadmin",
  superadmin: "admin",
  admin: "supermaster",
  supermaster: "master",
  master: "bettor",
  bettor: null,
};
export function normalizeAccountRole(input: unknown): AccountRole | null {
  const role = String(input ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const lookup: Record<string, AccountRole> = {
    company: "company", superadmin: "superadmin", admin: "admin",
    supermaster: "supermaster", master: "master", bettor: "bettor",
    client: "bettor", user: "bettor",
  };
  return lookup[role] || null;
}
export function permittedChildRole(parentRole: unknown): AccountRole | null {
  const parent = normalizeAccountRole(parentRole);
  return parent ? CHILD_ROLE[parent] : null;
}
export function canCreateChild(parentRole: unknown, childRole: unknown): boolean {
  const desired = normalizeAccountRole(childRole);
  // Legacy aliases work for existing sessions, but only canonical roles may be created.
  const requested = String(childRole ?? "").trim().toLowerCase().replace(/[\\s_-]+/g, "");
  return desired !== null && requested === desired && permittedChildRole(parentRole) === desired;
}
export function roleLabel(role: unknown): string {
  const normalized = normalizeAccountRole(role);
  const labels: Record<AccountRole, string> = {
    company: "Company", superadmin: "SuperAdmin", admin: "Admin",
    supermaster: "SuperMaster", master: "Master", bettor: "Bettor",
  };
  return normalized ? labels[normalized] : "Unknown";
}
