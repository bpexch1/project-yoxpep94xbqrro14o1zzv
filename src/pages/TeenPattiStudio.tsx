import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, Menu, Search, X, ArrowLeft, RefreshCw } from 'lucide-react';
import { studioLobbyGames, type Game } from '@/features/teenpatti/catalog';
import { studioRequest, pendingKey, type StudioState, type StudioBet, type Outcome, type StudioHistoryRow } from '@/features/teenpatti/api';
import { currentRoundMatchedBets, roundPositions, settledRoundBets as getSettledRoundBets } from '@/features/teenpatti/bets';
import { bettingWindowOpen } from '@/features/teenpatti/roundClock';
import { progressiveCards, publicCardCount } from '@/features/teenpatti/reveal';
import { getClientSession } from '@/hooks/useClientAuth';
import { readAccount } from '@/services/accounting';
import '@/features/teenpatti/studio.css';

const money=(n:number)=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2});
const liability=(exposure:number)=>exposure===0?'±0':`${exposure>0?'−':'+'}${money(Math.abs(exposure))}`;
function Card({value,delay=0}:{value?:number;delay?:number}){
 const rank=value===undefined?'':(['2','3','4','5','6','7','8','9','10','J','Q','K','A'][value%13]);
 const suit=value===undefined?'♠':['♠','♥','♣','♦'][Math.floor(value/13)];
 return <span className={`studio-card ${value===undefined?'face-down':'face-up'} ${suit==='♥'||suit==='♦'?'red':''}`} style={{animationDelay:`${delay}ms`}} aria-label={value===undefined?'Hidden card':`${rank}${suit}`}><small>{rank}</small><b>{suit}</b><small>{rank}</small></span>;
}
function Result({outcome,badges=false}:{outcome:Outcome;badges?:boolean}){return <div className="studio-result"><strong>{outcome.summary}</strong><div className="studio-hands">{outcome.groups.map(g=><div className="studio-hand" key={g.label}><span>{g.label}</span><div className="studio-cards">{g.cards?.map((c,i)=><Card key={c} value={c} delay={i*90}/>)}{g.value&&<b className="studio-result-value">{g.value}</b>}</div>{badges&&outcome.winner&&<b className={`studio-result-badge ${g.label.endsWith(` ${outcome.winner}`)?'win':'lose'}`}>{g.label.endsWith(` ${outcome.winner}`)?'WINNER':'LOSER'}</b>}</div>)}</div></div>;}
function Cards32Board({runners,outcome}:{runners:StudioState['config']['runners'];outcome:Outcome|null}){
 return <div className="studio-32-board" aria-label="32 Cards round">
  {runners.map((r,i)=>{const group=outcome?.groups[i];const cards=group?.cards||[];const visibleTotal=Number(r.id)+cards.reduce((sum,c)=>sum+c%13+2,0);return <div className={`studio-32-player${outcome?.winner===r.id?' winner':''}`} key={r.id}><strong>{r.name}</strong><div className="studio-32-cards">{cards.map((card,j)=><Card key={card} value={card} delay={j*160}/>)}</div><span>{group?.value||`${r.id} + ${cards.length?cards.map(c=>c%13+2).join(' + '):'?'} = ${cards.length?visibleTotal:'?'}`}</span>{outcome?.winner===r.id&&<b>WINNER</b>}</div>;})}
 </div>;
}
function WheelBetPanel({kind,runners,canBet,chip,setChip,onPick,onUndo}:{kind:string;runners:StudioState['config']['runners'];canBet:boolean;chip:number;setChip:(value:number)=>void;onPick:(runner:StudioState['config']['runners'][number])=>void;onUndo:()=>void}){
 const roulette=kind==='roulette';
 return <section className="studio-wheel-betting" aria-label={roulette?'Roulette betting board':'Dream Catcher betting board'}>
  <div className="studio-wheel-tools"><strong>CHIP · {money(chip)}</strong><button type="button" onClick={onUndo}>UNDO DRAFT</button><button type="button" onClick={()=>{onUndo();setChip(2000);}}>RESET DRAFT</button></div>
  <div className="studio-wheel-chips">{[2000,5000,10000,25000].map(amount=><button type="button" className={amount===chip?'selected':''} aria-pressed={amount===chip} key={amount} onClick={()=>setChip(amount)}>{money(amount)}</button>)}</div>
  <div className={roulette?'studio-roulette-grid':'studio-dream-grid'}>{runners.map(r=><button type="button" key={r.id} disabled={!canBet} onClick={()=>onPick(r)} className={roulette?Number(r.name)===0?'green':Number(r.name)%2?'red':'black':''}><strong>{r.name}</strong><small>{roulette?'35:1':`PAYS ${r.name}×`}</small></button>)}</div>
 </section>;
}
function Artwork({game}:{game:Game}){return <div className="studio-art" style={{'--game-color':game.color} as CSSProperties}><span className="studio-art-pattern">♠ ♦ ♣ ♥</span><span className="studio-art-symbol">{game.symbol}</span><strong>{game.name}</strong><span className="studio-art-line"/></div>;}
const artworkFiles:Record<string,string>={
 '9301':'chicken-road-2','9022':'aviator','9040':'aviator-x','9023':'blast-off','9100':'cricket-x','9035':'dream-catcher','9001':'teenpatti-t20','9005':'teenpatti-odi',
 '9030':'auto-roulette','9006':'muflis-teenpatti','9021':'poker','9015':'sic-bo','9002':'andar-bahar','9003':'hilo','9007':'7updown','9008':'ammar-akbar-anthony',
 '9009':'super-over-oneday','9011':'super-over-t20','9010':'32-cards','9012':'bollywood-casino','9016':'race-to-17','9017':'high-card','9018':'casino-war',
 '9019':'lucky-7','9020':'center-card','9045':'trio','9050':'trap','9055':'one-card-20-20','9065':'queen-race','9070':'dus-ka-dum','9075':'side-bet-city',
 '9080':'lottery','9085':'heads-tails','9105':'fortune-gems'
};
function GameThumb({game}:{game:Game}){
 const [broken,setBroken]=useState(false);
 const file=artworkFiles[game.id];
 if(!file||broken)return <Artwork game={game}/>;
 return <div className="studio-thumb-wrap"><img className="studio-thumb" src={'/reference/teenpatti-games/'+file+'.webp'} alt={game.name} loading="lazy" onError={()=>setBroken(true)}/></div>;
}
function StudioLogo({onClick}:{onClick:()=>void}){
 const [broken,setBroken]=useState(false);
 return <button className="studio-logo" onClick={onClick} aria-label="TeenPatti Studio lobby">
  {broken?<><b>B</b><span>TEENPATTI<br/>STUDIO</span></>:<img src="/reference/teenpatti-games/bps-logo.png" alt="TeenPatti Studio" onError={()=>setBroken(true)}/>}
 </button>;
}
function WaitingScene({game,kind,runners}:{game:Game;kind:string;runners:StudioState['config']['runners']}){
 if(kind==='wheel'||kind==='roulette')return <div className="studio-scene wheel-scene" aria-label="Virtual wheel animation"><div className="studio-spinning-wheel"><span>{kind==='roulette'?'ROULETTE':'DREAM CATCHER'}</span></div><small>Virtual wheel spins until the round closes</small></div>;
 if(kind==='crash')return <div className="studio-scene flight-scene" aria-label="Virtual flight"><span className="studio-aircraft">✈</span><strong>VIRTUAL FLIGHT</strong><small>Predict the result · No live cash-out</small></div>;
 if(kind==='dice')return <div className="studio-scene dice-scene" aria-label="Virtual dice game"><span className="studio-die">⚄</span><span className="studio-die second">⚅</span><small>Virtual dice roll</small></div>;
 if(kind==='sports')return <div className="studio-scene sports-scene" aria-label="Virtual score game"><strong>◉</strong><small>Virtual score in progress</small></div>;
 if(kind==='coin')return <div className="studio-scene coin-scene" aria-label="Virtual coin toss"><span className="studio-coin-flip">B</span><small>Virtual coin toss</small></div>;
 if(kind==='slots')return <div className="studio-scene slots-scene" aria-label="Virtual gems"><span>◆</span><span>◆</span><span>◆</span><small>Virtual gem reveal</small></div>;
 if(kind==='arcade')return <div className="studio-scene arcade-scene"><strong>♟</strong><small>Choose your virtual route</small></div>;
 const isCards=['Cards','cards','cards3','cards4','teen','teen3','muflis','andar','hilo','lucky'].includes(kind)||game.category==='Cards';
 return <div className="studio-hands waiting">{(isCards?runners.slice(0,kind==='cards4'?4:3):[{id:'visual',name:game.name,odds:1,layOdds:1}]).map(r=><div className="studio-hand" key={r.id}><span>{r.name}</span><div className="studio-cards">{isCards?Array.from({length:['teen','teen3','muflis'].includes(kind)?3:1},(_,i)=><Card key={i}/>):<span className="studio-wait-symbol">{game.symbol}</span>}</div></div>)}</div>;
}
function GameTable({game,username}:{game:Game;username:string}){
 const qc=useQueryClient();const [view,setView]=useState('Game');const [runner,setRunner]=useState<StudioState['config']['runners'][number]|null>(null);const [betSide,setBetSide]=useState<'back'|'lay'>('back');const [stake,setStake]=useState('100');const [busy,setBusy]=useState(false);const busyRef=useRef(false);const [message,setMessage]=useState('');const [pending,setPending]=useState<StudioBet|null>(()=>{try{return JSON.parse(sessionStorage.getItem(pendingKey(username))||'null');}catch{return null;}});
 const previousRoundId=useRef<string|null>(null);
 const [wheelChip,setWheelChip]=useState(100);
 const [clock,setClock]=useState(Date.now());
 const [deal,setDeal]=useState({roundId:'',visible:0});
 const [olderHistory,setOlderHistory]=useState<StudioHistoryRow[]>([]);
 const [historyBusy,setHistoryBusy]=useState(false);
 const [historyDone,setHistoryDone]=useState(false);
 const {data,error,isFetching,dataUpdatedAt,refetch}=useQuery({queryKey:['studio',username,game.id],queryFn:async()=>{const started=Date.now();const state=await studioRequest<StudioState>('state',{gameId:game.id});return {...state,roundTripMs:Date.now()-started};},refetchInterval:query=>{const round=query.state.data?.round;return round&&!round.settled&&Date.now()>=new Date(round.closesAt).getTime()?900:2000;},retry:1,enabled:game.playable});
 const {data:historyPage,error:historyError}=useQuery({queryKey:['studio-history',username,game.id],queryFn:()=>studioRequest<{history:StudioHistoryRow[]}>('history',{gameId:game.id,beforeAt:null,beforeId:null}),enabled:game.id==='9010'&&view==='Results'});
 const historyRows=[...new Map([...(historyPage?.history??data?.history??[]),...olderHistory].map(h=>[h.id,h])).values()];
 async function loadOlderHistory(){
  const last=historyRows[historyRows.length-1];if(!last||historyBusy)return;
  setHistoryBusy(true);
  try{const page=await studioRequest<{history:StudioHistoryRow[]}>('history',{gameId:game.id,beforeAt:last.settled_at,beforeId:last.id});setOlderHistory(rows=>[...rows,...page.history]);setHistoryDone(page.history.length<20);}
  catch(e){setMessage(e instanceof Error?e.message:'History unavailable');}
  finally{setHistoryBusy(false);}
 }
 useEffect(()=>{const id=setInterval(()=>setClock(Date.now()),250);return()=>clearInterval(id);},[]);
 // The server timestamp is created before the HTTP response arrives. Account
 // for transit time so a slow connection never shows an optimistic deadline.
 const serverTime=data?new Date(data.serverNow).getTime()+Math.max(0,clock-dataUpdatedAt)+data.roundTripMs:clock;
 const seconds=data?Math.max(0,Math.ceil((new Date(data.round.closesAt).getTime()-serverTime)/1000)):0;
 const stale=clock-dataUpdatedAt>6000;
 const canBet=!!data&&!error&&!stale&&!data.round.settled&&bettingWindowOpen(new Date(data.round.closesAt).getTime(),serverTime);
 const marketStatus=data&&(data.round.settled?'NEXT ROUND !':seconds===0||error||stale?'SUSPENDED !':null);
 const roundPhase=error?'Connection unavailable':stale?'Reconnecting':canBet?'BETTING OPEN':data?.round.settled?'ROUND OVER':'SUSPENDED · revealing';
 const matchedBets=data?(data.matchedBets??currentRoundMatchedBets(data.bets,data.round.id)):[];
 const settledRoundBets=data?getSettledRoundBets(data.bets,data.round.id):[];
 const positions=data&&game.id==='9010'?roundPositions(matchedBets,data.round.id,data.config.runners.map(r=>r.id),data.round.settled):null;
 const quoteSize=(runnerId:string,side:'back'|'lay')=>{const quote=data?.quotes?.find(q=>q.runner_id===runnerId&&q.side===side);return quote?money(Math.max(0,Number(quote.size)-Number(quote.consumed))):'—';};
 const activeRoundId=data?.round.id;
 const availableCards=game.id==='9010'?publicCardCount(data?.round.outcome??null):0;
 const visibleCards=deal.roundId===activeRoundId?deal.visible:0;
 useEffect(()=>{
  if(!activeRoundId||game.id!=='9010')return;
  if(deal.roundId!==activeRoundId){setDeal({roundId:activeRoundId,visible:0});return;}
  if(visibleCards>=availableCards)return;
  const timer=window.setTimeout(()=>setDeal(current=>current.roundId===activeRoundId?{...current,visible:current.visible+1}:current),650);
  return()=>window.clearTimeout(timer);
 },[activeRoundId,availableCards,deal.roundId,visibleCards,game.id]);
 const shownOutcome=game.id==='9010'?progressiveCards(data?.round.outcome??null,visibleCards,!!data?.round.settled):data?.round.outcome??null;
 const displayPhase=game.id==='9010'&&data?.round.settled&&!shownOutcome?.winner?'SUSPENDED · revealing':roundPhase;
 const displayMarketStatus=game.id==='9010'&&data?.round.settled&&!shownOutcome?.winner?'SUSPENDED !':marketStatus;
 useEffect(()=>{if(!activeRoundId)return;const changed=previousRoundId.current!==null&&previousRoundId.current!==activeRoundId;previousRoundId.current=activeRoundId;if(changed)setRunner(open=>{if(open&&!busyRef.current)setMessage('The round changed before submission. No bet was placed; select a market in the new round.');return null;});},[activeRoundId]);
 useEffect(()=>{if(data){window.dispatchEvent(new Event('balance-updated'));qc.invalidateQueries({queryKey:['studio-account',username]});}},[data?.balance,data?.round.settled,qc,username]);
 useEffect(()=>{if(data?.round.settled)qc.invalidateQueries({queryKey:['studio-history',username,game.id]});},[data?.round.id,data?.round.settled,qc,username,game.id]);
 async function submit(retry=false){
  if(busyRef.current)return;
  const amount=Number(stake);
  if(!retry&&(!runner||!data||!canBet||!Number.isFinite(amount)||amount<=0||amount>1000000||!/^\d+(\.\d{1,2})?$/.test(stake))){setMessage('Enter a valid stake with at most two decimal places.');return;}
  const request=retry?pending:({roundId:data!.round.id,requestId:crypto.randomUUID(),runnerId:runner!.id,side:betSide,stake:amount,odds:betSide==='back'?runner!.odds:runner!.layOdds} as StudioBet);
  if(!request)return;
  busyRef.current=true;setBusy(true);setMessage('');
  try{
   // Persist before sending. A timeout never creates a new wager on retry.
   sessionStorage.setItem(pendingKey(username),JSON.stringify(request));setPending(request);
   await studioRequest('bet',request);sessionStorage.removeItem(pendingKey(username));setPending(null);setRunner(null);setMessage('Bet accepted. Result and balance update automatically.');await refetch();window.dispatchEvent(new Event('balance-updated'));
  }catch(e){const text=e instanceof Error?e.message:'Bet could not be confirmed';setMessage(text);if(/^(Betting closed|Invalid bet parameters|Request ID conflict|Betting is disabled|Market unavailable or stale|Odds changed|Insufficient quoted liquidity|Insufficient balance|Round unavailable)/.test(text)){sessionStorage.removeItem(pendingKey(username));setPending(null);}}
  finally{busyRef.current=false;setBusy(false);}
 }
 if(!game.playable)return <section className="studio-unavailable"><Artwork game={game}/><h1>{game.name}</h1><p>This game’s reference mechanics are not implemented yet, so betting is unavailable.</p><p>Existing bets and ledger entries remain in account history.</p><Link to="/teenpatti-studio">Back to lobby</Link></section>;
 return <div className={`studio-table-wrap${game.id==='9010'?' studio-32-layout':''}`}>
  {game.id==='9010'?<div className="studio-32-titlebar"><h1>32 CARDS</h1><nav className="studio-tabs" aria-label="Game sections">{['Game','Results','Rules'].map(v=><button key={v} aria-current={view===v?'page':undefined} onClick={()=>setView(v)}>{v}</button>)}</nav></div>:<><div className="studio-game-heading"><Link to="/teenpatti-studio" aria-label="Back to lobby"><ArrowLeft size={18}/></Link><h1>{game.name}</h1></div><div className="studio-round-bar"><span className={`studio-countdown ${seconds===0?'closing':seconds<=5?'warning':''}`}>{seconds}</span><div><small>ROUND {data?.round.id.slice(0,8)||'—'}</small><strong>{roundPhase}</strong></div><button onClick={()=>refetch()} aria-label="Refresh game" disabled={isFetching}><RefreshCw size={16}/></button></div><nav className="studio-tabs" aria-label="Game sections">{['Game','Results','Rules','My Bets'].map(v=><button key={v} aria-current={view===v?'page':undefined} onClick={()=>setView(v)}>{v}</button>)}</nav></>}
  {error&&<p role="alert" className="studio-message">{error.message}</p>}
  {!data&&!error&&<div className="studio-empty" role="status">Loading table…</div>}
  {data&&view==='Game'&&<><div className={"studio-table studio-game-"+data.config.kind} key={data.round.id}>
   {game.id==='9010'&&<div className="studio-32-meta"><span className="studio-32-online" aria-label={`${data.onlinePlayers??'Unavailable'} online players`}>👥 {data.onlinePlayers??'—'}</span><span className={`studio-countdown ${seconds===0?'closing':seconds<=5?'warning':''}`} aria-label={`${seconds} seconds remaining`}>{seconds}</span>{!canBet&&<strong role="status">{displayPhase}</strong>}</div>}
   <div className="studio-table-brand">BPEXCH <span>TEENPATTI STUDIO</span></div>
   {game.id==='9010'?<Cards32Board runners={data.config.runners} outcome={shownOutcome}/>:data.round.outcome?<Result outcome={data.round.outcome}/>:<WaitingScene game={game} kind={data.config.kind} runners={data.config.runners}/>}
   {game.id!=='9010'&&<p className="studio-table-note">{canBet?'Select a price below':data.round.settled?'Next round starts shortly':'Revealing result…'}</p>}
  </div>
  {game.id==='9010'&&<div className="studio-history-strip" aria-label="Recent round results">{data.history.filter(h=>h.id!==data.round.id||!!shownOutcome?.winner).slice(0,12).map(h=><span title={h.outcome.summary} key={h.id}>{h.outcome.winner===null?'T':data.config.runners.find(r=>r.id===h.outcome.winner)?.name.replace('Player ','')||h.outcome.winner}</span>)}<small className="studio-full-round-id">ROUND {data.round.id}</small></div>}
  {['wheel','roulette'].includes(data.config.kind)?<WheelBetPanel kind={data.config.kind} runners={data.config.runners} canBet={canBet&&!pending&&!busy} chip={wheelChip} setChip={setWheelChip} onUndo={()=>setRunner(null)} onPick={r=>{setRunner(r);setBetSide('back');setStake(String(wheelChip));setMessage('');}}/>:<div className="studio-markets studio-market-rows"><div className="studio-market-header"><span>{game.id==='9010'?'MAIN':'MARKET ODDS'}</span><b>BACK</b><b>LAY</b></div>{data.config.runners.map(r=><div className={"studio-market-row"+(shownOutcome?.winner===r.id?' winner':'')} key={r.id}><span className="studio-runner-name"><strong>{r.name}</strong>{positions&&<small className={positions[r.id]<0?'loss':'profit'}>{positions[r.id]===0?'0':`${positions[r.id]>0?'+':''}${money(positions[r.id])}`}</small>}</span>{game.id==='9010'&&displayMarketStatus?<span className="studio-market-status">{displayMarketStatus}</span>:<><button type="button" className={'studio-price back'+(marketStatus?' status':'')} disabled={!canBet||!!pending||busy} onClick={()=>{setRunner(r);setBetSide('back');setMessage('');}}>{marketStatus?<strong>{marketStatus}</strong>:<><strong>{r.odds.toFixed(2)}</strong>{game.id==='9010'&&<small>{quoteSize(r.id,'back')}</small>}</>}</button><button type="button" className={'studio-price lay'+(marketStatus?' status':'')} disabled={!canBet||!!pending||busy} onClick={()=>{setRunner(r);setBetSide('lay');setMessage('');}}>{marketStatus?<strong>{marketStatus}</strong>:<><strong>{r.layOdds?.toFixed(2)||'—'}</strong>{game.id==='9010'&&<small>{quoteSize(r.id,'lay')}</small>}</>}</button></>}</div>)}</div>}
  {game.id!=='9010'&&<div className="studio-history-strip" aria-label="Recent round results">{data.history.slice(0,12).map(h=><span title={h.outcome.summary} key={h.id}>{h.outcome.winner===null?'T':data.config.runners.find(r=>r.id===h.outcome.winner)?.name.replace('Player ','')||h.outcome.winner}</span>)}</div>}</>}
  {data&&(game.id==='9010'||view==='My Bets'||view==='Game')&&<section className="studio-bets"><h2>{view==='My Bets'?'My Bets':`Matched Bets (${matchedBets.length})`}{game.id==='9010'&&<button type="button" onClick={()=>setView(view==='My Bets'?'Game':'My Bets')}>{view==='My Bets'?'Game':'My Bets'}</button>}</h2><div className="studio-scroll">{game.id==='9010'&&view!=='My Bets'?<table className="studio-32-bets-table"><thead><tr><th>Runner</th><th>Price</th><th>Size</th></tr></thead><tbody>{matchedBets.map(b=><tr key={b.id}><td>{b.selection} - (9010.{b.round_id.slice(0,8).toUpperCase()})</td><td>{Number(b.odds).toFixed(2)}</td><td>{money(b.stake)}</td></tr>)}</tbody></table>:<table><thead><tr><th>Runner</th><th>Side</th><th>Price</th><th>Size</th><th>Status</th><th>P/L</th></tr></thead><tbody>{(view==='Game'?matchedBets:data.bets.slice(0,50)).map(b=><tr key={b.id}><td>{b.selection}<small>{b.status.toUpperCase()}{b.profit===null?'':` · P/L ${money(b.profit)}`} · Order {b.id.slice(0,8)} · Round {b.round_id.slice(0,8)}</small></td><td>{b.bet_type?.toUpperCase()}</td><td>{b.odds}</td><td>{money(b.stake)}</td><td>{b.status}</td><td className={(b.profit||0)<0?'loss':'profit'}>{b.profit===null?'—':money(b.profit)}</td></tr>)}</tbody></table>}{view!=='My Bets'&&!matchedBets.length&&<p className="studio-empty">No matched bets in this round.</p>}{view==='My Bets'&&!data.bets.length&&<p className="studio-empty">No bets placed.</p>}</div></section>}
  {data&&view==='Results'&&<div className="studio-results">{historyRows.length?historyRows.map(h=><article key={h.id}><small>{new Date(h.settled_at).toLocaleString()} · {h.id}</small><Result outcome={h.outcome} badges={game.id==='9010'}/></article>):<p className="studio-empty">No completed rounds yet.</p>}{game.id==='9010'&&historyPage&&!historyDone&&historyPage.history.length===20&&<button className="studio-history-more" type="button" disabled={historyBusy} onClick={loadOlderHistory}>{historyBusy?'Loading…':'Load older rounds'}</button>}{historyError&&<p className="studio-empty">Older history unavailable. Current rounds remain visible.</p>}</div>}
  {data&&view==='Rules'&&<div className="studio-rules"><h2>Demo game rules</h2><p>{data.config.rules}</p><p>Betting lasts {data.config.timing?.bettingSeconds??20} seconds. Results display for {data.config.timing?.resultSeconds??10} seconds. These timers are independent demo settings; original provider timings are unverified. Your stake is reserved immediately. Winning returns and any configured commission are recorded in your account statement. A void returns your stake.</p><p>These are free test coins with no cash value. This simulation does not use the original provider’s game feed.</p></div>}
  {data&&data.round.settled&&shownOutcome&&(game.id!=='9010'||!!shownOutcome.winner)&&view==='Game'&&<section className="studio-round-result" role="status"><h2>Round Result</h2><Result outcome={shownOutcome}/>{settledRoundBets.length>0&&<p role="status">Round P/L: {money(settledRoundBets.reduce((sum,b)=>sum+Number(b.profit||0),0))} · Updated account balance: {money(data.balance)} · Exposure: {money(data.exposure)}</p>}{settledRoundBets.length>0&&<ul>{settledRoundBets.map(b=><li key={b.id}><strong>{b.status.toUpperCase()}</strong> · {b.selection} · {money(b.stake)} · P/L {b.profit===null?'—':money(b.profit)}{b.status.toLowerCase()==='won'&&b.profit!==null&&<span className="studio-winning-amount">WINNING AMOUNT {money(Number(b.stake)+Number(b.profit))}</span>}</li>)}</ul>}</section>}

  {message&&<p className="studio-message" role="status">{message}</p>}
  {pending&&<div className="studio-pending" role="status"><p>Confirm the response to your pending {money(pending.stake)} bet before placing another.</p><button disabled={busy} onClick={()=>submit(true)}>{busy?'Checking…':'Check / retry pending bet'}</button></div>}
  {runner&&!pending&&<div className="studio-modal-overlay" onClick={()=>!busy&&setRunner(null)}><section className={`studio-slip${game.id==='9010'?' studio-slip-32':''}`} role="dialog" aria-modal="true" aria-label="Confirm bet" onClick={e=>e.stopPropagation()}><header><strong>{game.id==='9010'?runner.name:`${betSide.toUpperCase()} · ${runner.name}`}</strong><button onClick={()=>setRunner(null)} aria-label="Close bet slip"><X size={19}/></button></header><div className="studio-slip-body"><div className="studio-slip-summary"><span>{game.name} · {runner.name}</span><span>{betSide.toUpperCase()} · {runner.name}</span><span>Available balance <b>{money(data?.balance||0)}</b></span></div><div className="studio-odds-control"><span>ODDS</span><button type="button" disabled title="Fixed demo quote" aria-label="Decrease odds unavailable for fixed quote">−</button><output>{(betSide==='back'?runner.odds:runner.layOdds).toFixed(2)}</output><button type="button" disabled title="Fixed demo quote" aria-label="Increase odds unavailable for fixed quote">+</button></div><label>Amount<input autoFocus inputMode="decimal" type="number" min="0.01" max="1000000" step="0.01" value={stake} onChange={e=>setStake(e.target.value)}/></label><div className="studio-chips">{[2000,5000,10000,25000].map(n=><button type="button" key={n} onClick={()=>setStake(String(n))}>{money(n)}</button>)}</div><div className="studio-chips">{[1000,5000,10000,25000].map(n=><button type="button" key={n} onClick={()=>setStake(String(Math.round((Number(stake)||0)*100+n*100)/100))}>+{money(n)}</button>)}</div><div className="studio-slip-pl"><span>Potential profit <b className="profit">+{money(betSide==='back'?(Number(stake)||0)*(runner.odds-1):Number(stake)||0)}</b></span><span>Potential loss <b className="loss">−{money(betSide==='lay'?Math.ceil((Number(stake)||0)*(runner.layOdds-1)*100)/100:Number(stake)||0)}</b></span></div><div className="studio-slip-actions"><button type="button" className="studio-close" disabled={busy} onClick={()=>setRunner(null)}>Close</button><button type="button" className="studio-place" disabled={!canBet||busy} onClick={()=>submit()}>{canBet?'Submit':'Betting closed'}</button></div></div></section></div>}
 </div>;
}
export default function TeenPattiStudio(){
 const session=getClientSession();const [params,setParams]=useSearchParams();const [menu,setMenu]=useState(false);const [search,setSearch]=useState('');
 const id=params.get('GameId')||params.get('game');const game=studioLobbyGames.find(g=>g.id===id);
 const lobby=!id;
 const filteredGames=studioLobbyGames.filter(g=>g.name.toLowerCase().includes(search.trim().toLowerCase()));
 const {data:account}=useQuery({queryKey:['studio-account',session?.username],queryFn:()=>readAccount(),enabled:!!session,refetchInterval:5000});
 if(!session)return <Navigate to="/login" replace/>;
 if(!['client','bettor','user'].includes(session.role.toLowerCase()))return <Navigate to="/dashboard" replace/>;
 function open(g?:Game){setParams(g?{GameId:g.id}:{});setMenu(false);setSearch('');window.scrollTo({top:0});}
 return <main className={`teenpatti-studio${lobby?' studio-lobby-page':''}${game?.id==='9010'?' studio-32-page':''}`}><div className="studio-sitebar"><Link to="/play">BPEXCH</Link>{!lobby&&<span>{session.username}</span>}</div><header className="studio-header"><div className="studio-header-left"><button aria-label={menu?'Close game menu':'Open game menu'} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button><button className="studio-lobby-button" onClick={()=>open()}><Home size={22}/><small>Lobby</small></button></div>{!lobby&&game?.id!=='9010'&&<StudioLogo onClick={()=>open()}/>}<div className="studio-wallet" aria-label="Demo coin balance and liability"><b>B: Rs. {account?money(account.availableBalance):'—'}</b><span aria-hidden="true">|</span><span className={account&&account.exposure>0?'negative':''}>L: {account?liability(account.exposure):'—'}</span><small>Demo coins</small></div></header>
 {menu&&<><button className="studio-menu-backdrop" aria-label="Close game menu" onClick={()=>setMenu(false)}/><nav className="studio-menu" aria-label="Studio games"><Link to="/play">← Dashboard</Link><label className="studio-menu-search"><Search size={15}/><input aria-label="Search games" placeholder="Search games" value={search} onChange={e=>setSearch(e.target.value)}/></label>{filteredGames.map(g=><button key={g.id} className={id===g.id?'selected':''} onClick={()=>open(g)}>{g.name}<small>{g.status}</small></button>)}</nav></>}
 {id&&!game?<div className="studio-empty">Game not found. <button onClick={()=>open()}>Return to lobby</button></div>:game?<GameTable key={game.id} game={game} username={session.username}/>:<><section className="studio-grid studio-image-lobby" aria-label="TeenPatti Studio lobby">{filteredGames.map(g=><button className="studio-tile" key={g.id} onClick={()=>open(g)} aria-label={`${g.name} — ${g.playable?'simulated game':'unavailable'}`} title={g.playable?'Simulated game':'Currently unavailable'}><GameThumb game={g}/><div className="studio-tile-caption"><span>{g.name}</span></div></button>)}</section>{!filteredGames.length&&<p className="studio-empty">No games match your search.</p>}</>}
 </main>;
}
