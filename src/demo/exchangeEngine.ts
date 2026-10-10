/** Isolated UI-only sandbox. NO real funds or real sports data. */
export type Side = "back" | "lay";
export type Selection = "Falcons" | "Tigers";
export type Account = "client" | "liquidity" | "house" | "agent";
export type Status = "OPEN" | "SUSPENDED" | "SETTLED";
export interface Order { id: string; owner: Account; side: Side; selection: Selection; odds: number; stake: number; matched: number; cancelled: boolean; }
export interface Fill { id: string; backId: string; layId: string; stake: number; odds: number; selection: Selection; }
export interface Entry { id: string; owner: Account; kind: string; delta: number; detail: string; }
export interface Sandbox {
 version: 1; status: Status; result: Selection | null; next: number;
 cash: Record<Account,number>; permission: boolean; orders: Order[]; fills: Fill[]; ledger: Entry[];
}
const round = (n:number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const liability = (side:Side,stake:number,odds:number) => round(side==="back"?stake:stake*(odds-1));
export function reserved(s:Sandbox, owner:Account):number {
 return round(s.orders.filter(o=>o.owner===owner && s.status!=="SETTLED")
  .reduce((a,o)=>a+liability(o.side,o.cancelled?o.matched:o.stake,o.odds),0));
}
export const available=(s:Sandbox,a:Account)=>round(s.cash[a]-reserved(s,a));
const copy=(s:Sandbox):Sandbox=>JSON.parse(JSON.stringify(s));
function entry(s:Sandbox,owner:Account,kind:string,delta:number,detail:string){
 s.ledger.unshift({id:"L"+s.next++,owner,kind,delta:round(delta),detail});
}
export function orderStatus(o:Order,s:Sandbox):string{
 if(s.status==="SETTLED")return "Settled";
 if(o.cancelled)return o.matched?"Partially matched / remainder cancelled":"Cancelled";
 if(o.matched===o.stake)return "Matched";
 if(o.matched>0)return "Partially matched";
 return "Unmatched";
}
export function place(input:Sandbox,owner:Account,side:Side,selection:Selection,odds:number,stake:number):Sandbox{
 if(input.status!=="OPEN")throw new Error("Market is suspended or settled.");
 if(owner==="client"&&!input.permission)throw new Error("Account betting is disabled.");
 if(!["client","liquidity"].includes(owner))throw new Error("Account cannot bet.");
 if(!["back","lay"].includes(side)||!["Falcons","Tigers"].includes(selection))throw new Error("Invalid market selection.");
 if(!Number.isFinite(stake)||stake<10||stake>1000||round(stake)!==stake)throw new Error("Stake limit: 10 to 1,000, max 2 decimals.");
 if(!Number.isFinite(odds)||odds<1.01||odds>100||round(odds)!==odds)throw new Error("Invalid market odds.");
 if(available(input,owner)<liability(side,stake,odds))throw new Error("Insufficient available funds for the exposure.");
 if(input.orders.length>=100)throw new Error("Demo order limit reached. Reset to continue.");
 const s=copy(input); const o:Order={id:"O"+s.next++,owner,side,selection,odds,stake,matched:0,cancelled:false};
 s.orders.push(o);entry(s,owner,"reserve",0,"Order "+o.id+" reserved "+liability(side,stake,odds).toFixed(2));
 // Simulated order book: exact price only, FIFO and distinct owners.
 for(const other of s.orders){
  if(other.id===o.id||other.owner===owner||other.cancelled||other.side===side||other.selection!==selection||other.odds!==odds)continue;
  const size=round(Math.min(stake-o.matched,other.stake-other.matched));
  if(size<=0)continue;
  o.matched=round(o.matched+size);other.matched=round(other.matched+size);
  const back=side==="back"?o:other,lay=side==="lay"?o:other;
  s.fills.push({id:"F"+s.next++,backId:back.id,layId:lay.id,stake:size,odds,selection});
  entry(s,owner,"match",0,o.id+" matched "+size+" at "+odds);
  if(o.matched>=o.stake)break;
 }
 return s;
}
export function cancel(input:Sandbox,id:string):Sandbox{
 if(input.status==="SETTLED")throw new Error("Already settled.");
 const s=copy(input),o=s.orders.find(o=>o.id===id&&o.owner==="client");
 if(!o||o.cancelled||o.stake<=o.matched)throw new Error("No cancellable unmatched amount.");
 o.cancelled=true;entry(s,"client","cancel",0,o.id+" released "+round(o.stake-o.matched)+" unmatched stake");return s;
}
export function marketStatus(input:Sandbox,status:"OPEN"|"SUSPENDED"):Sandbox{
 if(input.status==="SETTLED")throw new Error("Reset the market to reopen.");
 const s=copy(input);s.status=status;return s;
}
export function permit(input:Sandbox,value:boolean):Sandbox{const s=copy(input);s.permission=value;return s;}
export function settle(input:Sandbox,result:Selection):Sandbox{
 if(input.status==="SETTLED")throw new Error("Already settled.");
 if(!["Falcons","Tigers"].includes(result))throw new Error("Invalid official result simulation.");
 const s=copy(input);const pl:Record<Account,number>={client:0,liquidity:0,house:0,agent:0};
 for(const f of s.fills){
  const back=s.orders.find(o=>o.id===f.backId),lay=s.orders.find(o=>o.id===f.layId);
  if(!back||!lay)throw new Error("Unreconciled fill");
  const backDelta=f.selection===result?round(f.stake*(f.odds-1)):-f.stake;
  pl[back.owner]=round(pl[back.owner]+backDelta);pl[lay.owner]=round(pl[lay.owner]-backDelta);
  entry(s,back.owner,"settlement",backDelta,f.id+" back result");entry(s,lay.owner,"settlement",-backDelta,f.id+" lay result");
 }
 for(const account of ["client","liquidity"] as Account[]){
  s.cash[account]=round(s.cash[account]+pl[account]);
  if(pl[account]>0){
   const fee=round(pl[account]*0.02),company=round(fee*0.85),agent=round(fee-company);
   s.cash[account]=round(s.cash[account]-fee);
   s.cash.house=round(s.cash.house+company);s.cash.agent=round(s.cash.agent+agent);
   entry(s,account,"commission",-fee,"2% demo winning-market commission");
   entry(s,"house","share",company,"85% demo commission share");
   entry(s,"agent","share",agent,"15% demo commission share");
  }
 }
 s.result=result;s.status="SETTLED";return s;
}
export function fresh():Sandbox{
 let s:Sandbox={version:1,status:"OPEN",result:null,next:1,permission:true,
 cash:{client:5000,liquidity:20000,house:0,agent:0},orders:[],fills:[],ledger:[]};
 s=place(s,"liquidity","lay","Falcons",2.16,350);
 s=place(s,"liquidity","back","Falcons",2.16,150);
 s=place(s,"liquidity","lay","Tigers",1.86,300);
 s=place(s,"liquidity","back","Tigers",1.86,120);
 return s;
}
