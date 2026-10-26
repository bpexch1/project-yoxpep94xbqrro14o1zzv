// Independent simulated Studio V2 game engine using the existing exchange wallet. No provider feed or client-submitted outcome.
// Odds are an immutable round quote snapshot; wins are computed on the server.
export type Outcome = { winner: string|null; groups: {label:string;cards?:number[];value?:string}[];summary:string };
export type Runner = {id:string;name:string;odds:number;layOdds:number};
export type Config = {id:string;name:string;rules:string;kind:string;timing:{bettingSeconds:number;resultSeconds:number;revealSeconds?:number};runners:Runner[]};
const games: Record<string,[string,string,string[],string]> = {
 '9301':['Chicken Road 2','arcade',['Safe crossing','Risk crossing','Gold crossing'],'Choose a route before the round closes. This is an independent three-route simulation.'],
 '9022':['Aviator','crash',['Below 2x','2x to 5x','Above 5x'],'Virtual flight multiplier prediction. This is not a real-time cash-out game.'],
 '9040':['AviatorX','crash',['Below 2x','2x to 5x','Above 5x'],'Virtual flight multiplier prediction. This is not a real-time cash-out game.'],
 '9023':['BlastOff','crash',['Below 2x','2x to 5x','Above 5x'],'Virtual rocket multiplier prediction. This is not a real-time cash-out game.'],
 '9100':['CricketX','crash',['Below 2x','2x to 5x','Above 5x'],'Virtual multiplier prediction. This is not a live cricket or cash-out feed.'],
 '9035':['Dream Catcher','wheel',['1','2','5','10','20','40'],'Spin an independent weighted virtual wheel for the displayed number.'],
 '9001':['TeenPatti T20','teen',['Player A','Player B'],'Three cards each; strongest Teen Patti hand wins. Equal hands void.'],
 '9005':['TeenPatti ODI','teen3',['Player A','Player B','Player C'],'Three players, three cards each; strongest hand wins. Equal best hands void.'],
 '9030':['Auto Roulette','roulette',Array.from({length:37},(_,i)=>String(i)),'Independent single-zero virtual roulette. Straight number bets (0–36).'],
 '9006':['Muflis TeenPatti','muflis',['Player A','Player B'],'Three cards each; weakest Teen Patti hand wins. Equal hands void.'],
 '9021':['Poker','cards',['Player A','Player B'],'Simulated three-card hands compared using Teen Patti-style ranking; not a licensed poker variant.'],
 '9015':['Sic-Bo','dice',['Low (4–10)','High (11–17)','Triple'],'Virtual roll of three dice. Triple wins its own selection; non-triples are low or high.'],
 '9002':['AndarBahar','andar',['Andar','Bahar'],'Draw a joker card then alternate Andar and Bahar until the rank matches.'],
 '9003':['HiLo','hilo',['High','Snap','Low'],'The Ante card is compared with a separately dealt Joker card; equal ranks are Snap. Ace counts high.'],
 '9007':['7UpDown','seven',['7Up','7','7Down'],'Draw one card from a 52-card deck; its rank is compared with seven. Ace counts high.'],
 '9008':['Ammar Akbar Anthony','cards3',['Ammar','Akbar','Anthony'],'Virtual highest-card prediction among three sides; ties void.'],
 '9009':['Super Over OneDay','sports',['0–7 runs','8–12 runs','13+ runs'],'Predict the independently simulated score of a virtual over.'],
 '9011':['Super Over T20','sports',['0–7 runs','8–12 runs','13+ runs'],'Predict the independently simulated score of a virtual over.'],
 '9010':['32 Cards','cards4',['Player 8','Player 9','Player 10','Player 11'],'32-card deck (6 through King). Add each player’s base number (8, 9, 10, 11) to the ranks dealt to that player. If the highest totals tie, deal extra cards to those players until one wins. Tie-round market reopening is not yet supported.'],
 '9012':['Bollywood Casino','cards3',['Hero','Heroine','Villain'],'Independent virtual three-card high-card draw; ties void.'],
 '9016':['Race To 17','sports',['0–7','8–12','13–17'],'Independent virtual number-draw game.'],
 '9017':['High Card','cards',['Player A','Player B'],'Higher single card wins. Equal rank voids the round.'],
 '9018':['Casino War','cards',['Player A','Player B'],'Higher single card wins. Equal rank voids the round.'],
 '9019':['Lucky 7','lucky',['Under 7','Exactly 7','Over 7'],'Draw one virtual card; Ace 1, Jack 11, Queen 12, King 13.'],
 '9020':['Center Card','hilo',['High','Low','Same'],'Draw one card and compare against seven.'],
 '9045':['TRIO','cards3',['A','B','C'],'Independent virtual highest-card game with three sides.'],
 '9050':['TRAP','cards',['Player A','Player B'],'Independent virtual highest-card game.'],
 '9055':['One Card 20-20','cards',['Player A','Player B'],'Independent virtual single-card battle; higher rank wins.'],
 '9065':['Queen Race','cards3',['Queen A','Queen B','Queen C'],'Independent virtual queen-race result from three cards.'],
 '9070':['Dus Ka Dum','hilo',['Above 10','Below 10','Exactly 10'],'Draw a number from 1 to 13 and compare with ten.'],
 '9075':['Side Bet city','dice',['Odd','Even'],'Virtual dice sum prediction.'],
 '9080':['Lottery','lottery',['0–3','4–6','7–9'],'Virtual digit draw from zero to nine.'],
 '9085':['Heads & Tails','coin',['Heads','Tails'],'Independent virtual coin toss.'],
 '9105':['Fortune Gems','slots',['Red gem','Blue gem','Gold gem'],'Independent virtual three-symbol gem selection.']
};
// Incomplete interactive and generic-placeholder tables stay in the lobby but
// cannot open a new betting round until their actual mechanics are implemented.
const enabledDemoIds=new Set(['9001','9005','9006','9015','9002','9003','9007','9010','9017','9018','9019','9055','9085','9030','9035']);
// Independent simulated-game timing values. The videos show differing clocks but
// do not establish a complete provider schedule for every title.
const demoTimings:Record<string,Config['timing']>={
 '9001':{bettingSeconds:30,revealSeconds:5,resultSeconds:12},
 '9005':{bettingSeconds:30,revealSeconds:6,resultSeconds:12},
 '9006':{bettingSeconds:30,revealSeconds:6,resultSeconds:12},
 '9015':{bettingSeconds:30,revealSeconds:4,resultSeconds:11},
 '9002':{bettingSeconds:30,revealSeconds:6,resultSeconds:12},
 '9003':{bettingSeconds:30,revealSeconds:5,resultSeconds:11},
 '9007':{bettingSeconds:30,revealSeconds:3,resultSeconds:10},
 '9010':{bettingSeconds:30,revealSeconds:7,resultSeconds:10},
 '9017':{bettingSeconds:30,revealSeconds:3,resultSeconds:10},
 '9018':{bettingSeconds:30,revealSeconds:3,resultSeconds:10},
 '9019':{bettingSeconds:30,revealSeconds:3,resultSeconds:10},
 '9055':{bettingSeconds:30,revealSeconds:3,resultSeconds:10},
 '9085':{bettingSeconds:30,revealSeconds:2,resultSeconds:9},
 '9030':{bettingSeconds:30,revealSeconds:4,resultSeconds:12},
 '9035':{bettingSeconds:30,revealSeconds:8,resultSeconds:15}
};
const oddsFor = (id:string,count:number,i:number):number => {
 if(id==='9030')return 36;
 if(id==='9035')return [2,3,6,11,21,41][i];
 if(id==='9007')return [2.3,11.5,2.3][i];
 if(id==='9019')return [2.5,12,1.8][i];
 if(id==='9015')return [2.2,2.2,11][i];
 if(id==='9022'||id==='9040'||id==='9023'||id==='9100')return [1.9,2.8,7.5][i];
 if(id==='9003')return [2.1,12,2.1][i];
 if(id==='9020'||id==='9070')return [2.1,2.1,12][i];
 // Independent demo quotes for the four 32 Cards selections. These are
 // fixed round snapshots, not prices or liquidity from the reference site.
 if(id==='9010')return [12.2,5.95,3.2,2.08][i];
 if(count===4)return 3.85;
 if(count===3)return 2.88;
 return 1.95;
};
export function configFor(id:string):Config|null {
 const row=games[id]; if(!row||!enabledDemoIds.has(id))return null;
 const [name,kind,names,rules]=row;
 const timing=demoTimings[id];
 return {id,name,kind,timing,rules:rules+' Results are simulated independently; wagers use your existing BPEXCH1 account balance.',
 runners:names.map((name,i)=>{const odds=oddsFor(id,names.length,i);return {id:id==='9010'?String(i+8):String(i+1),name,odds,layOdds:id==='9010'?[13.7,6.45,3.45,2.18][i]:Number((odds+(odds>10?0.5:0.08)).toFixed(2))};})};
}
export function randomInt(max:number):number {
 if(!Number.isInteger(max)||max<1||max>0xffffffff)throw new Error('Invalid random range');
 const limit=Math.floor(0x100000000/max)*max;const a=new Uint32Array(1);
 do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;
}
export function shuffledDeck(rand=randomInt):number[]{
 const deck=Array.from({length:52},(_,i)=>i);
 for(let i=51;i>0;i--){const j=rand(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;
}
export function rank(c:number){return c%13+2;}
export function handScore(cards:number[]):number[]{
 const r=cards.map(rank).sort((a,b)=>b-a),flush=cards.every(c=>Math.floor(c/13)===Math.floor(cards[0]/13));
 const unique=new Set(r).size;let straight=unique===3&&r[0]-r[2]===2?r[0]:0;
 if(r.join(',')==='14,3,2')straight=13.5;
 if(unique===1)return [6,r[0]];
 if(flush&&straight)return [5,straight];
 if(straight)return [4,straight];
 if(flush)return [3,...r];
 if(unique===2){const pair=r[0]===r[1]?r[0]:r[1];return [2,pair,r.find(x=>x!==pair)!];}
 return [1,...r];
}
export function compare(a:number[],b:number[]):number{
 for(let i=0;i<Math.max(a.length,b.length);i++){const n=(a[i]||0)-(b[i]||0);if(n)return Math.sign(n);}return 0;
}
export function score32Cards(groups:number[][]):number[]{
 const cards=groups.flat();
 if(groups.length!==4||groups.some(g=>!g.length)||new Set(cards).size!==cards.length||cards.some(c=>!Number.isInteger(c)||c<0||c>=52||rank(c)<6||rank(c)>13))throw new Error('Invalid 32 Cards deal');
 return groups.map((group,i)=>i+8+group.reduce((sum,card)=>sum+rank(card),0));
}
export function resolve32Cards(deck:number[]):Outcome {
 if(deck.length!==32||new Set(deck).size!==32||deck.some(c=>!Number.isInteger(c)||c<0||c>=52||rank(c)<6||rank(c)>13))throw new Error('Invalid 32 Cards deck');
 const groups:number[][]=[[],[],[],[]];let next=0;let contenders=[0,1,2,3];
 for(const i of contenders)groups[i].push(deck[next++]);
 while(contenders.length>1){
  const totals=score32Cards(groups);
  const highest=Math.max(...contenders.map(i=>totals[i]));
  contenders=contenders.filter(i=>totals[i]===highest);
  if(contenders.length===1||next+contenders.length>deck.length)break;
  for(const i of contenders)groups[i].push(deck[next++]);
 }
 const totals=score32Cards(groups);
 const winner=contenders.length===1?String(contenders[0]+8):null;
 return {winner,groups:groups.map((cards,i)=>({label:`Player ${i+8}`,cards,value:`${i+8} + ${cards.map(rank).join(' + ')} = ${totals[i]}`})),
  summary:winner?`Player ${winner} wins with ${totals[Number(winner)-8]}`:'Unresolved tie — bets void'};
}
export function createOutcome(id:string,rand=randomInt):Outcome{
 const cfg=configFor(id);if(!cfg)throw new Error('Game unavailable');
 const {kind,runners}=cfg,deck=shuffledDeck(rand);
 const result=(index:number|null,groups:Outcome['groups'],summary:string):Outcome=>({winner:index===null?null:runners[index].id,groups,summary});
 if(kind==='cards4'){
  // The provider's Rules screen explicitly excludes Ace through Five.
  return resolve32Cards(deck.filter(c=>rank(c)>=6&&rank(c)<=13));
 }
 if(['teen','teen3','muflis','cards','cards3'].includes(kind)){
  const size=['teen','teen3','muflis'].includes(kind)||id==='9021'?3:1;
  const groups=runners.map((r,i)=>({label:r.name,cards:deck.slice(i*size,(i+1)*size)}));
  const scores=groups.map(g=>size===3?handScore(g.cards):[rank(g.cards[0])]);
  const direction=kind==='muflis'?-1:1;let best=0;
  for(let i=1;i<scores.length;i++)if(compare(scores[i],scores[best])*direction>0)best=i;
  const tie=scores.filter(x=>compare(x,scores[best])===0).length>1;
  return result(tie?null:best,groups,tie?'Tie — bets void':runners[best].name+' wins');
 }
 if(kind==='andar'){
  const joker=deck.shift()!,andar:number[]=[],bahar:number[]=[];let winner=0;
  for(let i=0;i<deck.length;i++){const cards=i%2===0?andar:bahar;cards.push(deck[i]);if(rank(deck[i])===rank(joker)){winner=i%2;break;}}
  return result(winner,[{label:'Joker',cards:[joker]},{label:'Andar',cards:andar},{label:'Bahar',cards:bahar}],runners[winner].name+' matches the Joker');
 }
 if(kind==='roulette'){const n=rand(37);return result(n,[{label:'Roulette wheel',value:String(n)}],'Winning number: '+n);}
 if(kind==='coin'){const n=rand(2);return result(n,[{label:'Coin toss',value:runners[n].name}],runners[n].name);}
 if(kind==='seven'){
  const card=deck[0],number=rank(card),choice=number>7?0:number===7?1:2;
  return result(choice,[{label:'Drawn card',cards:[card]}],runners[choice].name+' — '+number);
 }
 if(kind==='dice'){
  const dice=id==='9015'?[rand(6)+1,rand(6)+1,rand(6)+1]:[rand(6)+1,rand(6)+1];
  const sum=dice.reduce((a,b)=>a+b,0);let n=0;
  if(id==='9015')n=dice.every(x=>x===dice[0])?2:sum<=10?0:1;
  else n=sum%2===1?0:1;
  return result(n,[{label:'Dice',value:dice.join(' + ')}],'Total '+sum+' — '+runners[n].name);
 }
 if(kind==='lucky'||kind==='hilo'){
  if(id==='9003'){
   const joker=deck[0],ante=deck[1],choice=rank(ante)>rank(joker)?0:rank(ante)===rank(joker)?1:2;
   return result(choice,[{label:'Joker',cards:[joker]},{label:'Ante',cards:[ante]}],runners[choice].name+' — '+rank(joker)+' vs '+rank(ante));
  }
  const card=deck[0],num=kind==='lucky'&&rank(card)===14?1:rank(card);
  const n=id==='9070'?(num>10?0:num<10?1:2):kind==='lucky'?(num<7?0:num===7?1:2):(num>7?0:num<7?1:2);
  return result(n,[{label:'Result card',cards:[card]}],runners[n].name+' — '+num);
 }
 if(kind==='wheel'){
  const weights=[23,14,7,4,2,1];const roll=rand(weights.reduce((a,b)=>a+b,0));
  let cursor=0;let n=0;
  for(let i=0;i<weights.length;i++){cursor+=weights[i];if(roll<cursor){n=i;break;}}
  return result(n,[{label:'Wheel',value:runners[n].name}],'Wheel stopped on '+runners[n].name);
 }
 if(kind==='crash'){
  const x=1+rand(950)/100;const n=x<2?0:x<=5?1:2;
  return result(n,[{label:'Flight multiplier',value:x.toFixed(2)+'x'}],'Virtual flight '+x.toFixed(2)+'x');
 }
 if(kind==='sports'){
  const score=rand(id==='9016'?18:24);const n=score<=7?0:score<=12?1:2;
  return result(n,[{label:'Virtual score',value:String(score)}],'Score '+score);
 }
 if(kind==='arcade'){
  const n=rand(3);return result(n,[{label:'Route',value:runners[n].name}],runners[n].name+' cleared');
 }
 if(kind==='slots'){
  const n=rand(3);return result(n,[{label:'Gem',value:runners[n].name}],runners[n].name+' appeared');
 }
 const number=rand(10);const n=number<=3?0:number<=6?1:2;
 return result(n,[{label:'Lottery digit',value:String(number)}],'Digit '+number);
}
