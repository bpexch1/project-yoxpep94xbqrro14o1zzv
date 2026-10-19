/** YYYY-MM-DD in the exchange reporting timezone, not the viewer's UTC date. */
export function todayInExchangeTimezone(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (part: "year" | "month" | "day") =>
    parts.find(item => item.type === part)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}
