export function csvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const safe =
    /^[\s]*[=+@-]/.test(raw) && typeof value !== "number" ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
