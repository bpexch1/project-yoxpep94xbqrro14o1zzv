import { useState } from 'react';
import { Filter } from 'lucide-react';

interface Props {
  fromDate: string;
  toDate: string;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;
  onSubmit: () => void;
  username?: string;
  setUsername?: (value: string) => void;
}

export function ReferenceReportFilter({ fromDate, toDate, setFromDate, setToDate, onSubmit, username, setUsername }: Props) {
  const [error, setError] = useState('');
  return <section className="card reference-report-filter">
    <div className="card-header"><Filter size={16} /><strong>Report Filter</strong></div>
    <form className="card-body" onSubmit={event => {
      event.preventDefault();
      if (!fromDate || !toDate || fromDate > toDate) { setError('Choose a valid date range.'); return; }
      setError(''); onSubmit();
    }}>
      <input aria-label="From date" type="date" required value={fromDate} onChange={event => setFromDate(event.target.value)} />
      <div className="report-date-separator">-</div>
      <input aria-label="To date" type="date" required value={toDate} onChange={event => setToDate(event.target.value)} />
      {setUsername && <details className="report-user-filter"><summary>Filter by user</summary><input aria-label="Client username" placeholder="Username" value={username} onChange={event => setUsername(event.target.value)} /></details>}
      {error && <p role="alert">{error}</p>}
      <div className="report-submit"><button className="btn btn-primary" type="submit">Submit</button></div>
    </form>
  </section>;
}
