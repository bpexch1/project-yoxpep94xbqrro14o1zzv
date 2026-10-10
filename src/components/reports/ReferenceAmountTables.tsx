import { useState } from 'react';

export interface AmountRow { name: string; amount: number; }
export function ReferenceAmountTables({ rows, title, split = true, nameLabel = 'Name', loading = false }: { rows: AmountRow[]; title: string; split?: boolean; nameLabel?: string; loading?: boolean }) {
  const [hideZero, setHideZero] = useState(false);
  const [descending, setDescending] = useState(false);
  const sorted = rows.filter(row => !hideZero || row.amount !== 0).sort((a,b) => (descending ? -1 : 1) * a.name.localeCompare(b.name));
  const groups = split ? [sorted.filter(row => row.amount >= 0), sorted.filter(row => row.amount < 0)] : [sorted];
  return <section className="card reference-amount-report">
    <div className="card-header"><strong>{title}</strong>{split && <label className="report-hide-zero"><input type="checkbox" checked={hideZero} onChange={event => setHideZero(event.target.checked)} /> Hide Zero Amounts</label>}</div>
    <div className="card-body">
      {loading ? <p role="status">Loading report…</p> : <div className={split ? 'reference-amount-columns' : 'reference-event-amount'}>{groups.map((group,index) => <div className="reference-amount-scroll" key={index}><table className="table table-bordered table-sm table-striped"><thead><tr><th><button type="button" onClick={() => setDescending(value => !value)}>{nameLabel} <span aria-hidden="true">{descending ? '▾' : '▴'}</span></button></th><th>Amount</th></tr></thead><tbody>{group.map((row,i) => <tr key={`${row.name}-${i}`}><td>{row.name}</td><td className={row.amount < 0 ? 'amount-negative' : ''}>{row.amount.toLocaleString()}</td></tr>)}{!group.length && <tr><td colSpan={2} className="report-empty">No data available in table</td></tr>}</tbody><tfoot><tr className={index === 1 ? 'amount-total-negative' : 'amount-total-positive'}><td>Total</td><td>{group.reduce((sum,row) => sum + row.amount,0).toLocaleString()}</td></tr></tfoot></table></div>)}</div>}
    </div>
  </section>;
}
