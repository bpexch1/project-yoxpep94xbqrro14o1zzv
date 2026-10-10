// Local-time report picker utilities (no jQuery or Moment dependency).
// The original app submits UTC ranges; local date/time stays in the visitor's timezone.
export const LEDGER_MIN_DATE = "2026-01-01";

const pad = (value: number) => String(value).padStart(2, "0");

export function ledgerDateParts(value: string): { dateText: string; timeText: string; period: "AM" | "PM" } {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { dateText: "", timeText: "", period: "AM" };
  const [, year, month, day, hours, minutes] = match;
  const hour = Number(hours);
  return {
    dateText: month + "/" + day + "/" + year,
    timeText: pad(hour % 12 || 12) + ":" + minutes,
    period: hour >= 12 ? "PM" : "AM",
  };
}

export function parseLedgerLocalInput(
  dateText: string,
  timeText: string,
  period: "AM" | "PM"
): string | null {
  const date = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateText.trim());
  const time = /^(\d{1,2}):(\d{2})$/.exec(timeText.trim());
  if (!date || !time) return null;
  const [, m, d, y] = date;
  const year = Number(y), month = Number(m), day = Number(d);
  const h12 = Number(time[1]), minute = Number(time[2]);
  if (year < 2026 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31
      || h12 < 1 || h12 > 12 || minute < 0 || minute > 59) return null;
  const hour = h12 % 12 + (period === "PM" ? 12 : 0);
  const result = new Date(year, month - 1, day, hour, minute);
  // Reject impossible local calendar dates and DST-skipped wall-clock times.
  if (result.getFullYear() !== year || result.getMonth() !== month - 1
    || result.getDate() !== day || result.getHours() !== hour || result.getMinutes() !== minute) return null;
  const local = y + "-" + pad(month) + "-" + pad(day) + "T" + pad(hour) + ":" + pad(minute);
  return local.slice(0, 10) < LEDGER_MIN_DATE ? null : local;
}

export function ledgerLocalToUtc(value: string): string | null {
  const parts = ledgerDateParts(value);
  const valid = parseLedgerLocalInput(parts.dateText, parts.timeText, parts.period);
  if (!valid) return null;
  const date = new Date(valid);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
