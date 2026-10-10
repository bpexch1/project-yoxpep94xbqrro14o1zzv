// Presentation policy only. Enforce the same rules in the privileged database RPC.
export const CHILD_ROLE_MAP: Record<string, readonly string[]> = {
  company: ["superadmin", "client"],
  superadmin: ["admin", "client"],
  admin: ["supermaster", "client"],
  supermaster: ["master", "client"],
  master: ["dealer", "client"],
  dealer: ["client"],
};
const LABELS: Record<string, string> = {
  superadmin: "SuperAdmin",
  admin: "Admin",
  supermaster: "SuperMaster",
  master: "Master",
  dealer: "Dealer",
  client: "Bettor",
};
export function getCreatableChildRoles(parentRole?: string) {
  const key = parentRole?.trim().toLowerCase() || "";
  return (CHILD_ROLE_MAP[key] || []).map(value => ({ value, label: LABELS[value] }));
}
export function canCreateChildRole(parentRole: string, childRole: string) {
  return (CHILD_ROLE_MAP[parentRole?.trim().toLowerCase()] || []).includes(childRole?.trim().toLowerCase());
}
