// Free-coin simulations. This module runs on the server, never trusting a browser result.
export type Outcome = { winner: string | null; groups: { label: string; cards?: number[]; value?: string }[]; summary: string };
export type Config = { id: string; name: string; rules: string; runners: {id:string;name:string;odds:number}[] };
const runner = (names: string[], odds=1.95) => names.map((name,i)=>({id:String(i+1),name,odds}));
export function configFor(id: string): Config | null {
 const base={id,name:'',rules:'',runners:runner(['Player A','Player B'])};
 if(['9001','9005','9006'].includes(id)) return {...base,name:id==='9001'?'TeenPatti T20':id==='9005'?'TeenPatti ODI':'Muflis TeenPatti',
  runners:runner(id==='9005'?['Player A','Player B','Player C']:['Player A','Player B'],id==='9005'?2.9:1.95),
  rules:`Free-coin demo: three cards per player. ${id==='9006'?'Lowest':'Highest'} Teen Patti hand wins. Ranking: trail, straight flush, straight, flush, pair, high card. A-2-3 is the second-highest straight after A-K-Q. Equal best hands void all bets; suits do not break ties. Fixed odds are displayed before betting. No side bets.`};
 const names:Record<string,string>={'9004':'DragonTiger','9017':'High Card','9018':'Casino War','9055':'One Card 20-20'};
 if(names[id]) return {...base,name:names[id],runners:runner(id==='9004'?['Dragon','Tiger']:['Player A','Player B']),rules:'Free-coin demo: one card per side from a shuffled deck. Higher rank wins; Ace is high. Equal ranks void all bets. No side bets.'};
 if(id==='9002') return {...base,name:'AndarBahar',runners:runner(['Andar','Bahar']),rules:'Free-coin demo: one joker card is drawn, then cards alternate Andar first, Bahar second. The first side to match the joker rank wins. No side bets.'};
 if(id==='9007') return {...base,name:'7UpDown',runners:[{id:'1',name:'Under 7',odds:2.3},{id:'2',name:'Exactly 7',odds:5.8},{id:'3',name:'Over 7',odds:2.3}],rules:'Free-coin demo: roll two six-sided dice. Bet on their sum: below 7, exactly 7, or above 7. Decimal odds include the returned stake.'};
 if(id==='9019') return {...base,name:'Lucky 7',runners:[{id:'1',name:'Under 7',odds:2.5},{id:'2',name:'Exactly 7',odds:12},{id:'3',name:'Over 7',odds:1.8}],rules:'Free-coin demo: draw one card. Ace counts as 1, Jack 11, Queen 12, King 13. Bet below 7, exactly 7 or above 7. No suit or colour side bets.'};
 if(id==='9085') return {...base,name:'Heads & Tails',runners:runner(['Heads','Tails']),rules:'Free-coin demo: one random coin toss. Select Heads or Tails before the countdown ends.'};
 if(id==='9030') return {...base,name:'Auto Roulette',runners:Array.from({length:37},(_,i)=>({id:String(i),name:String(i),odds:36})),rules:'Free-coin demo: European single-zero wheel, 0–36. Straight-up number bets only. A winning bet returns 36 times its stake. Each number is equally likely.'};
 return null;
}
export function randomInt(max: number): number {
 if(!Number.isInteger(max)||max<1||max>0xffffffff) throw new Error('Invalid random range');
 const limit=Math.floor(0x100000000/max)*max; const a=new Uint32Array(1);
 do {crypto.getRandomValues(a);} while(a[0]>=limit);
 return a[0]%max;
}
export function shuffledDeck(rand=randomInt): number[] {
 const deck=Array.from({length:52},(_,i)=>i);
 for(let i=51;i>0;i--){const j=rand(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];} return deck;
}
export function rank(card:number){return card%13+2;}
export function handScore(cards:number[]):number[] {
 const r=cards.map(rank).sort((a,b)=>b-a), flush=cards.every(c=>Math.floor(c/13)===Math.floor(cards[0]/13));
 const unique=new Set(r).size;
 let straight=unique===3&&r[0]-r[2]===2 ? r[0] : 0;
 if(r.join(',')==='14,3,2') straight=13.5;
 if(unique===1)return [6,r[0]];
 if(flush&&straight)return [5,straight];
 if(straight)return [4,straight];
 if(flush)return [3,...r];
 if(unique===2){const pair=r[0]===r[1]?r[0]:r[1];return [2,pair,r.find(x=>x!==pair)!];}
 return [1,...r];
}
export function compare(a:number[],b:number[]):number { for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return Math.sign(d);}return 0; }
export function createOutcome(id:string,rand=randomInt):Outcome {
 const cfg=configFor(id);if(!cfg)throw new Error('Game unavailable');
 const deck=shuffledDeck(rand);
 if(['9001','9005','9006','9004','9017','9018','9055'].includes(id)) {
  const teen=['9001','9005','9006'].includes(id), low=id==='9006', size=teen?3:1;
  const groups=cfg.runners.map((r,i)=>({label:r.name,cards:deck.slice(i*size,(i+1)*size)}));
  const scores=groups.map(g=>teen?handScore(g.cards):[rank(g.cards[0])]);
  let best=0;for(let i=1;i<scores.length;i++)if(compare(scores[i],scores[best])*(low?-1:1)>0)best=i;
  const tied=scores.filter(s=>compare(s,scores[best])===0).length>1;
  return {winner:tied?null:cfg.runners[best].id,groups,summary:tied?'Tie — stakes returned':`${cfg.runners[best].name} wins`};
 }
 if(id==='9002') {
  const joker=deck.shift()!, andar:number[]=[], bahar:number[]=[];let win='1';
  for(let i=0;i<deck.length;i++){const side=i%2===0?andar:bahar;side.push(deck[i]);if(rank(deck[i])===rank(joker)){win=i%2===0?'1':'2';break;}}
  return {winner:win,groups:[{label:'Joker',cards:[joker]},{label:'Andar',cards:andar},{label:'Bahar',cards:bahar}],summary:`${win==='1'?'Andar':'Bahar'} matches the joker`};
 }
 if(id==='9007'){const dice=[rand(6)+1,rand(6)+1],sum=dice[0]+dice[1];return {winner:sum<7?'1':sum===7?'2':'3',groups:[{label:'Dice',value:dice.join(' + ')}],summary:`Total ${sum}`};}
 if(id==='9019'){const c=deck[0],r=rank(c)===14?1:rank(c);return {winner:r<7?'1':r===7?'2':'3',groups:[{label:'Lucky card',cards:[c]}],summary:`Card value ${r}`};}
 if(id==='9085'){const n=rand(2);return {winner:String(n+1),groups:[{label:'Coin',value:n===0?'Heads':'Tails'}],summary:n===0?'Heads':'Tails'};}
 const n=rand(37);return {winner:String(n),groups:[{label:'Winning number',value:String(n)}],summary:`Number ${n}`};
}
