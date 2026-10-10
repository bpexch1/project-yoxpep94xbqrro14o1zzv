import { useEffect, useMemo, useState } from "react";
import {
  available, cancel, fresh, liability, marketStatus, orderStatus, permit,
  place, reserved, settle, type Sandbox, type Selection, type Side
} from "@/demo/exchangeEngine";

const STORAGE_KEY = "bpexch-example-exchange-v1";
function load(): Sandbox {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (data?.version === 1 && Array.isArray(data.orders) && Array.isArray(data.fills)
        && Array.isArray(data.ledger) && data.cash && typeof data.next === "number") {
      return data;
    }
  } catch { /* Only sandbox data; reset invalid fixtures. */ }
  return fresh();
}
const money = (x:number) => x.toLocaleString("en-IN", { minimumFractionDigits:2, maximumFractionDigits:2 });
const indicator = (value:string) => <span className="text-[10px] font-bold tracking-wider uppercase">{value}</span>;

export default function DemoExchange() {
  const [model, setModel] = useState<Sandbox>(load);
  const [side, setSide] = useState<Side>("back");
  const [selection, setSelection] = useState<Selection>("Falcons");
  const [odds, setOdds] = useState("2.16");
  const [stake, setStake] = useState("100");
  const [winner, setWinner] = useState<Selection>("Falcons");
  const [message, setMessage] = useState<{type:"error"|"success";body:string}|null>(null);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(model)); } catch { /* non-critical */ }
  }, [model]);
  const myOrders = useMemo(() => [...model.orders].filter(o=>o.owner==="client").reverse(), [model.orders]);
  const myFills = useMemo(() => model.fills.filter(fill=>
    myOrders.some(o=>o.id===fill.backId||o.id===fill.layId)),[myOrders,model.fills]);
  const availableBalance = available(model,"client");
  const exposure = reserved(model,"client");
  const submit = (action:()=>Sandbox,success:string) => {
    try {const next=action();setModel(next);setMessage({type:"success",body:success});}
    catch(error:any){setMessage({type:"error",body:error?.message||"Demo action rejected"});}
  };
  const pick=(s:Side,name:Selection,n:number)=>{setSide(s);setSelection(name);setOdds(n.toFixed(2));};
  const prices=[{name:"Falcons" as Selection,price:2.16},{name:"Tigers" as Selection,price:1.86}];
  const openCount=myOrders.filter(o=>!o.cancelled&&o.matched<o.stake&&model.status!=="SETTLED").length;

  return (
    <main className="min-h-screen bg-[#e8edf3] text-[#1c293a]" style={{fontFamily:'"Roboto Condensed",Arial,sans-serif'}}>
      <header className="bg-[#173454] text-white px-3 sm:px-6 py-3 flex flex-wrap justify-between gap-3 items-center border-b-4 border-[#00a88a]">
        <div>
          <h1 className="text-xl font-extrabold tracking-wide">BPEXCH <span className="font-medium text-sm">EXCHANGE TEST LAB</span></h1>
          <p className="text-[11px] text-slate-300">Independent example order book — not a real account</p>
        </div>
        <div className="bg-[#fef3c7] text-[#92400e] border border-[#f59e0b] rounded px-3 py-2 text-xs font-extrabold tracking-wider">SIMULATION ONLY • NO REAL MONEY</div>
      </header>
      <section className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-4">
        <div className="bg-white border border-slate-300 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="font-bold">This page uses a local example market, simulated counterparties and artificial balances. No sportsbook feed, account, payment, database or official result is connected.</div>
          <button className="border border-slate-300 bg-slate-100 px-3 py-2 font-bold hover:bg-slate-200" onClick={() => {
            try{localStorage.removeItem(STORAGE_KEY)}catch{} setModel(fresh());setMessage(null);
          }}>Reset Demo</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            ["Demo Cash",money(model.cash.client)],["Available",money(availableBalance)],
            ["Reserved Exposure",money(exposure)],["Matched Fills",String(myFills.length)]
          ].map(([title,value])=>
            <div key={title} className="bg-white border border-[#cbd5e1] p-3 shadow-sm">
              <div className="text-[11px] text-slate-500 font-bold uppercase">{title}</div>
              <div className="text-xl sm:text-2xl text-[#19365a] font-black tabular-nums mt-1">{value}</div>
            </div>
          )}
        </div>
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-3">
          <div className="space-y-3">
            <div className="bg-white border border-slate-300">
              <div className="bg-[#19365a] text-white p-3 flex items-center justify-between gap-2">
                <div><div className="text-[10px] text-slate-300 tracking-wider">EXAMPLE MARKET • EVENT 001</div>
                  <h2 className="font-extrabold text-lg">Falcons v Tigers</h2></div>
                <span className={"text-xs px-2 py-1 font-bold rounded-sm "+(model.status==="OPEN"?"bg-[#00a88a]":model.status==="SUSPENDED"?"bg-orange-500":"bg-slate-600")}>{model.status}</span>
              </div>
              <div className="grid grid-cols-[1fr_75px_75px] text-[11px] font-bold bg-slate-100 border-b p-2"><span>RUNNER</span><span className="text-center">BACK</span><span className="text-center">LAY</span></div>
              {prices.map(item=>
                <div className="grid grid-cols-[1fr_75px_75px] p-2 items-stretch gap-1 border-b border-slate-200" key={item.name}>
                  <div className="flex flex-col justify-center"><b>{item.name}</b><span className="text-[10px] text-slate-500">Example market odds</span></div>
                  <button disabled={model.status!=="OPEN"} onClick={()=>pick("back",item.name,item.price)} className="bg-[#95cafa] disabled:opacity-40 hover:bg-[#65b0f4] py-3 font-extrabold text-sm">{item.price.toFixed(2)}</button>
                  <button disabled={model.status!=="OPEN"} onClick={()=>pick("lay",item.name,item.price)} className="bg-[#f8aeb6] disabled:opacity-40 hover:bg-[#ef8e99] py-3 font-extrabold text-sm">{item.price.toFixed(2)}</button>
                </div>
              )}
            </div>
            <div className="bg-white border border-slate-300">
              <div className="bg-[#19365a] text-white px-3 py-2 font-bold text-sm">Your Bet Records</div>
              {myOrders.length===0?<p className="text-sm p-5 text-slate-500">No demo bets yet. Select odds and submit a stake.</p>:
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[570px]">
                    <thead className="bg-slate-100"><tr>{["ID","Runner","Side","Stake","Matched","Price","State","Action"].map(h=><th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
                    <tbody>{myOrders.map(o=><tr key={o.id} className="border-t border-slate-200">
                      <td className="p-2 font-bold">{o.id}</td><td className="p-2">{o.selection}</td>
                      <td className="p-2 uppercase">{o.side}</td><td className="p-2">{money(o.stake)}</td>
                      <td className="p-2">{money(o.matched)}</td><td className="p-2">{o.odds.toFixed(2)}</td>
                      <td className="p-2 font-bold">{orderStatus(o,model)}</td>
                      <td className="p-2">{!o.cancelled&&o.matched<o.stake&&model.status!=="SETTLED"?
                        <button className="px-2 py-1 border border-slate-400 hover:bg-slate-100" onClick={()=>submit(()=>cancel(model,o.id),"Unmatched portion cancelled.")}>Cancel open</button>:"—"}</td>
                    </tr>)}</tbody>
                  </table>
                </div>}
              <p className="p-2 border-t text-[11px] text-slate-500">Open orders: {openCount} • Fill executions: {myFills.length}. Partial matches reserve the remaining financial exposure.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-white border border-slate-300">
              <div className="bg-[#19365a] text-white py-2 px-3 text-sm font-bold">Example Bet Slip</div>
              <div className="p-3 space-y-3">
                <div className="text-sm font-bold">{selection} • {side.toUpperCase()}</div>
                <div className="flex gap-2">
                  {(["back","lay"] as Side[]).map(s=><button key={s} onClick={()=>setSide(s)}
                    className={"flex-1 py-2 text-xs uppercase font-extrabold border "+(side===s?s==="back"?"bg-[#95cafa] border-blue-600":"bg-[#f8aeb6] border-rose-600":"bg-white border-slate-300")}>{s}</button>)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-bold">Odds<input aria-label="Odds" type="number" min="1.01" max="100" step=".01" value={odds} onChange={e=>setOdds(e.target.value)} className="mt-1 w-full border border-slate-300 p-2 text-sm"/></label>
                  <label className="text-xs font-bold">Stake<input aria-label="Stake" type="number" min="10" max="1000" step=".01" value={stake} onChange={e=>setStake(e.target.value)} className="mt-1 w-full border border-slate-300 p-2 text-sm"/></label>
                </div>
                <div className="flex justify-between border-y border-slate-200 py-2 text-xs"><span>Collateral required</span><b>{Number.isFinite(Number(stake))&&Number.isFinite(Number(odds))?money(liability(side,Number(stake),Number(odds))):"—"}</b></div>
                <button disabled={model.status!=="OPEN"} className="bg-[#00a88a] hover:bg-[#00987c] disabled:opacity-40 text-white w-full py-3 font-extrabold text-sm" onClick={()=>submit(()=>place(model,"client",side,selection,Number(odds),Number(stake)),"Demo order accepted; matching checked.")}>Submit Demo Order</button>
              </div>
            </div>
            <div className="bg-white border border-slate-300">
              <div className="bg-[#19365a] text-white py-2 px-3 text-sm font-bold">Demo Admin Controls</div>
              <div className="p-3 space-y-3 text-xs">
                <div className="flex justify-between items-center gap-2"><span>Market status</span><button className="border border-slate-300 px-2 py-2 font-bold" onClick={()=>submit(()=>marketStatus(model,model.status==="OPEN"?"SUSPENDED":"OPEN"),"Example market status updated.")}>{model.status==="OPEN"?"Suspend":"Open"} market</button></div>
                <div className="flex justify-between items-center gap-2"><span>Client permission</span><button className="border border-slate-300 px-2 py-2 font-bold" onClick={()=>submit(()=>permit(model,!model.permission),"Example account permission updated.")}>{model.permission?"Disable":"Enable"} betting</button></div>
                <label className="flex items-center gap-2">Simulated winner<select value={winner} onChange={e=>setWinner(e.target.value as Selection)} className="border border-slate-300 p-2 flex-1"><option>Falcons</option><option>Tigers</option></select></label>
                <button disabled={model.status==="SETTLED"} onClick={()=>submit(()=>settle(model,winner),"Simulated result applied and ledger settled once.")} className="w-full bg-[#19365a] text-white py-3 font-bold disabled:opacity-40">Simulate Result & Settle</button>
                <div className="text-[11px] text-slate-500">Demo commission: 2% of positive net P/L; that fee is split company 85%, agent 15%. These are illustrative rules only.</div>
              </div>
            </div>
          </div>
        </div>
        {message&&<div role="alert" className={"border p-3 text-sm font-semibold "+(message.type==="error"?"border-red-300 bg-red-50 text-red-800":"border-emerald-300 bg-emerald-50 text-emerald-800")}>{message.body}</div>}
        <div className="bg-white border border-slate-300">
          <div className="bg-[#19365a] text-white px-3 py-2 flex justify-between gap-2 text-sm font-bold"><span>Simulated Accounting & Ledger</span><span>{model.result?"Winner: "+model.result:"Unsettled"}</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 border-b">
            {(["client","liquidity","house","agent"] as const).map(a=><div key={a}><p className="text-[11px] uppercase text-slate-500 font-bold">{a}</p><p className="text-base font-extrabold">{money(model.cash[a])}</p></div>)}
          </div>
          <div className="max-h-72 overflow-auto"><table className="w-full text-xs min-w-[480px]"><thead className="bg-slate-100"><tr>{["Entry","Account","Type","Delta","Details"].map(k=><th key={k} className="p-2 text-left">{k}</th>)}</tr></thead><tbody>{model.ledger.map(l=><tr key={l.id} className="border-t border-slate-200"><td className="p-2">{l.id}</td><td className="p-2">{l.owner}</td><td className="p-2">{l.kind}</td><td className="p-2 tabular-nums">{l.delta===0?"—":money(l.delta)}</td><td className="p-2">{l.detail}</td></tr>)}</tbody></table></div>
        </div>
        <footer className="text-xs text-slate-500 pb-8">Independent sandbox • local browser storage only • no official sports scores • no real transactions • no integration with BPEXCH production users</footer>
      </section>
    </main>
  );
}
