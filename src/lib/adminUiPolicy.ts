// UI visibility only. Server authorization must independently enforce roles.
export const ADMIN_ROLES = ["company", "superadmin", "admin", "supermaster", "master"];
export function isStaffOrAdmin(role?: string): boolean {
  return typeof role === "string" && ADMIN_ROLES.includes(role.trim().toLowerCase());
}
export function marketAmount(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value !== "string" && typeof value !== "number") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount.toLocaleString("en-IN") : "—";
}
