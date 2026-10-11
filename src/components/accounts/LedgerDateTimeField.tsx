import { useEffect, useId, useState } from "react";
import { CalendarDays } from "lucide-react";
import { ledgerDateParts, LEDGER_MIN_DATE, parseLedgerLocalInput } from "@/lib/ledgerDateTime";

type LedgerDateTimeFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
};

// Separate date, 12-hour time, AM/PM and calendar trigger, like reference UI.
export function LedgerDateTimeField({ label, value, onChange }: LedgerDateTimeFieldProps) {
  const initial = ledgerDateParts(value);
  const [dateText, setDateText] = useState(initial.dateText);
  const [timeText, setTimeText] = useState(initial.timeText);
  const [period, setPeriod] = useState<"AM" | "PM">(initial.period);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!value) return; // Preserve invalid draft for parent submit validation.
    const normalized = ledgerDateParts(value);
    setDateText(normalized.dateText);
    setTimeText(normalized.timeText);
    setPeriod(normalized.period);
  }, [value]);

  const commit = (date: string, time: string, ampm: "AM" | "PM") =>
    onChange(parseLedgerLocalInput(date, time, ampm) || "");

  const calendarValue = parseLedgerLocalInput(dateText, timeText, period)?.slice(0, 10) || LEDGER_MIN_DATE;
  return (
    <div className="ledger-datetime-wrapper">
      <div className="ledger-datetime-field" role="group" aria-label={label}>
        <input
          aria-label={label + " date"}
          id={id + "-date"}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="MM/DD/YYYY"
          maxLength={10}
          value={dateText}
          onChange={event => {
            setDateText(event.target.value);
            commit(event.target.value, timeText, period);
          }}
        />
        <input
          aria-label={label + " time"}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="12:00"
          maxLength={5}
          value={timeText}
          onChange={event => {
            setTimeText(event.target.value);
            commit(dateText, event.target.value, period);
          }}
        />
        <select
          aria-label={label + " period"}
          value={period}
          onChange={event => {
            const next = event.target.value as "AM" | "PM";
            setPeriod(next);
            commit(dateText, timeText, next);
          }}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
        <button
          type="button"
          className="ledger-calendar-trigger"
          aria-label={"Choose " + label.toLowerCase() + " on calendar"}
          aria-expanded={calendarOpen}
          onClick={() => setCalendarOpen(current => !current)}
        >
          <CalendarDays size={19} aria-hidden="true" />
        </button>
      </div>
      {calendarOpen && (
        <div className="ledger-calendar-panel">
          <label htmlFor={id + "-picker"}>Choose {label.toLowerCase()} date</label>
          <input
            id={id + "-picker"}
            aria-label={label + " calendar date"}
            type="date"
            min={LEDGER_MIN_DATE}
            value={calendarValue}
            onChange={event => {
              if (!event.target.value) return;
              const [year, month, day] = event.target.value.split("-");
              const nextDate = month + "/" + day + "/" + year;
              setDateText(nextDate);
              commit(nextDate, timeText, period);
              setCalendarOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
