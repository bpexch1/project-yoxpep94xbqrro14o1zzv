import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, Menu, Search, X, ArrowLeft, RefreshCw } from 'lucide-react';
import { studioLobbyGames, type Game } from '@/features/teenpatti/catalog';
import { studioRequest, pendingKey, type StudioState, type StudioBet, type Outcome } from '@/features/teenpatti/api';
import { currentRoundMatchedBets, settledRoundBets as getSettledRoundBets } from '@/features/teenpatti/bets';
import { getClientSession } from '@/hooks/useClientAuth';
import { readAccount } from '@/services/accounting';
import '@/features/teenpatti/studio.css';

const money=(n:number)=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2});
function Card({value,delay=0}:{value?:number;delay?:number}){
 const rank=value===undefined?'':(['2','3','4','5','6','7','8','9','10','J','Q','K','A'][value%13]);
 const suit=value===undefined?'♠':['♠','♥','♣','♦'][Math.floor(value/13)];
 return <span className={`studio-card ${value===undefined?'face-down':'face-up'} ${suit==='♥'||suit==='♦'?'red':''}`} style={{animationDelay:`${delay}ms`}} aria-label={value===undefined?'Hidden card':`${rank}${suit}`}><small>{rank}</small><b>{suit}</b><small>{rank}</small></span>;
}
function Result({outcome}:{outcome:Outcome}){return <div className="studio-result"><strong>{outcome.summary}</strong><div className="studio-hands">{outcome.groups.map(g=><div className="studio-hand" key={g.label}><span>{g.label}</span><div className="studio-cards">{g.cards?.map((c,i)=><Card key={c} value={c} delay={i*90}/>)}{g.value&&<b className="studio-result-value">{g.value}</b>}</div></div>)}</div></div>;}
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
 if(kind==='wheel'||kind==='roulette')return <div className="studio-scene wheel-scene" aria-label="Virtual demo wheel animation"><div className="studio-spinning-wheel"><span>{kind==='roulette'?'ROULETTE':'DREAM CATCHER'}</span></div><small>Virtual wheel spins until the round closes</small></div>;
 if(kind==='crash')return <div className="studio-scene flight-scene" aria-label="Virtual flight demo"><span className="studio-aircraft">✈</span><strong>VIRTUAL FLIGHT</strong><small>Predict the result · No live cash-out</small></div>;
 if(kind==='dice'||kind==='seven')return <div className="studio-scene dice-scene" aria-label="Virtual dice game"><span className="studio-die">⚄</span><span className="studio-die second">⚅</span><small>Virtual dice roll</small></div>;
 if(kind==='sports')return <div className="studio-scene sports-scene" aria-label="Virtual score game"><strong>◉</strong><small>Virtual score in progress</small></div>;
 if(kind==='coin')return <div className="studio-scene coin-scene" aria-label="Virtual coin toss"><span className="studio-coin-flip">B</span><small>Virtual coin toss</small></div>;
 if(kind==='slots')return <div className="studio-scene slots-scene" aria-label="Virtual gems"><span>◆</span><span>◆</span><span>◆</span><small>Virtual gem reveal</small></div>;
 if(kind==='arcade')return <div className="studio-scene arcade-scene"><strong>♟</strong><small>Choose your virtual route</small></div>;
 const isCards=['Cards','cards','cards3','cards4','teen','teen3','muflis','andar','hilo','lucky'].includes(kind)||game.category==='Cards';
 return <div className="studio-hands waiting">{(isCards?runners.slice(0,kind==='cards4'?4:3):[{id:'visual',name:game.name,odds:1,layOdds:1}]).map(r=><div className="studio-hand" key={r.id}><span>{r.name}</span><div className="studio-cards">{isCards?Array.from({length:['teen','teen3','muflis'].includes(kind)?3:1},(_,i)=><Card key={i}/>):<span className="studio-wait-symbol">{game.symbol}</span>}</div></div>)}</div>;
}
function GameTable({game,username}:{game:Game;username:string}){
 const qc=useQueryClient();const [view,setView]=useState('Game');const [runner,setRunner]=useState<StudioState['config']['runners'][number]|null>(null);const [betSide,setBetSide]=useState<'back'|'lay'>('back');const [stake,setStake]=useState('100');const [busy,setBusy]=useState(false);const busyRef=useRef(false);const [message,setMessage]=useState('');const [pending,setPending]=useState<StudioBet|null>(()=>{try{return JSON.parse(sessionStorage.getItem(pendingKey(username))||'null');}catch{return null;}});
 const [clock,setClock]=useState(Date.now());
 const {data,error,isFetching,dataUpdatedAt,refetch}=useQuery({queryKey:['studio',username,game.id],queryFn:()=>studioRequest<StudioState>('state',{gameId:game.id}),refetchInterval:2000,retry:1,enabled:game.playable});
 useEffect(()=>{const id=setInterval(()=>setClock(Date.now()),250);return()=>clearInterval(id);},[]);
 const serverTime=data?new Date(data.serverNow).getTime()+Math.max(0,clock-dataUpdatedAt):clock;
 const seconds=data?Math.max(0,Math.ceil((new Date(data.round.closesAt).getTime()-serverTime)/1000)):0;
 const stale=clock-dataUpdatedAt>6000;
 const canBet=!!data&&!error&&!stale&&!data.round.settled&&seconds>0;
 const matchedBets=data?(data.matchedBets??currentRoundMatchedBets(data.bets,data.round.id)):[];
 const settledRoundBets=data?getSettledRoundBets(data.bets,data.round.id):[];
 useEffect(()=>{setRunner(null);},[data?.round.id]);
 useEffect(()=>{if(data){window.dispatchEvent(new Event('balance-updated'));qc.invalidateQueries({queryKey:['studio-account',username]});}},[data?.balance,data?.round.settled,qc,username]);
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
 if(!game.playable)return <section className="studio-unavailable"><Artwork game={game}/><h1>{game.name}</h1><p>This table is not available yet.</p><p>You can play the tables marked “Demo”.</p><Link to="/teenpatti-studio">Back to lobby</Link></section>;
 return <div className="studio-table-wrap">
  <div className="studio-game-heading"><Link to="/teenpatti-studio" aria-label="Back to lobby"><ArrowLeft size={18}/></Link><h1>{game.name}</h1><span>FREE-COIN DEMO</span></div>
  <div className="studio-round-bar"><span className={`studio-countdown ${seconds<5?'closing':''}`}>{seconds}</span><div><small>ROUND {data?.round.id.slice(0,8)||'—'}</small><strong>{error?'Connection unavailable':stale?'Reconnecting':canBet?'Place your bets':data?.round.settled?'Round complete':'Betting closed'}</strong></div><button onClick={()=>refetch()} aria-label="Refresh game" disabled={isFetching}><RefreshCw size={16}/></button></div>
  <nav className="studio-tabs" aria-label="Game sections">{['Game','Results','Rules','My Bets'].map(v=><button key={v} aria-current={view===v?'page':undefined} onClick={()=>setView(v)}>{v}</button>)}</nav>
  {error&&<p role="alert" className="studio-message">{error.message}</p>}
  {!data&&!error&&<div className="studio-empty" role="status">Loading table…</div>}
  {data&&view==='Game'&&<><div className={"studio-table studio-game-"+data.config.kind} key={data.round.id}>
   <div className="studio-table-brand">BPEXCH <span>TEENPATTI STUDIO</span></div>
   {data.round.outcome?<Result outcome={data.round.outcome}/>:<WaitingScene game={game} kind={data.config.kind} runners={data.config.runners}/>}
   <p className="studio-table-note">{canBet?'Select a price below':data.round.settled?'Next round starts shortly':'Revealing result…'}</p>
  </div>
  <div className={"studio-markets studio-market-rows"+(game.id==='9030'?' roulette':'')}><div className="studio-market-header"><span>MARKET ODDS</span><b>BACK</b><b>LAY</b></div>{data.config.runners.map(r=><div className={"studio-market-row"+(data.round.outcome?.winner===r.id?' winner':'')} key={r.id}><span className="studio-runner-name">{r.name}</span><button type="button" className="studio-price back" disabled={!canBet||!!pending||busy} onClick={()=>{setRunner(r);setBetSide('back');setMessage('');}}><strong>{r.odds.toFixed(2)}</strong><small>DEMO</small></button><button type="button" className="studio-price lay" disabled={!canBet||!!pending||busy} onClick={()=>{setRunner(r);setBetSide('lay');setMessage('');}}><strong>{r.layOdds?.toFixed(2)||'—'}</strong><small>DEMO</small></button></div>)}</div>
  <div className="studio-history-strip" aria-label="Recent round results">{data.history.slice(0,12).map(h=><span title={h.outcome.summary} key={h.id}>{h.outcome.winner===null?'T':data.config.runners.find(r=>r.id===h.outcome.winner)?.name.replace('Player ','')||h.outcome.winner}</span>)}</div></>}
  {data&&view==='Results'&&<div className="studio-results">{data.history.length?data.history.map(h=><article key={h.id}><small>{new Date(h.settled_at).toLocaleString()} · {h.id.slice(0,8)}</small><Result outcome={h.outcome}/></article>):<p className="studio-empty">No completed rounds yet.</p>}</div>}
  {data&&view==='Rules'&&<div className="studio-rules"><h2>Demo game rules</h2><p>{data.config.rules}</p><p>Betting lasts {data.config.timing?.bettingSeconds??20} seconds. Results display for {data.config.timing?.resultSeconds??10} seconds. Your stake is reserved immediately. Winning returns and any configured commission are recorded in your account statement. A void returns your stake.</p><p>These are free test coins with no cash value. This simulation does not use the original provider’s game feed.</p></div>}
  {data&&data.round.settled&&data.round.outcome&&view==='Game'&&<section className="studio-round-result" role="status"><h2>Round Result</h2><Result outcome={data.round.outcome}/>{settledRoundBets.length>0&&<ul>{settledRoundBets.map(b=><li key={b.id}><strong>{b.status.toUpperCase()}</strong> · {b.selection} · {money(b.stake)} coins · P/L {b.profit===null?'—':money(b.profit)}</li>)}</ul>}</section>}
  {data&&(view==='My Bets'||view==='Game')&&<section className="studio-bets"><h2>{view==='Game'?`Matched Bets (${matchedBets.length})`:'My Bets'}</h2><div className="studio-scroll"><table><thead><tr><th>Selection</th><th>Side</th><th>Odds</th><th>Stake</th><th>Status</th><th>P/L</th></tr></thead><tbody>{(view==='Game'?matchedBets:data.bets.slice(0,50)).map(b=><tr key={b.id}><td>{b.selection}<small>Order {b.id.slice(0,8)} · Round {b.round_id.slice(0,8)}</small></td><td>{b.bet_type?.toUpperCase()}</td><td>{b.odds}</td><td>{money(b.stake)}</td><td>{b.status}</td><td className={(b.profit||0)<0?'loss':'profit'}>{b.profit===null?'—':money(b.profit)}</td></tr>)}</tbody></table>{view==='Game'&&!matchedBets.length&&<p className="studio-empty">No matched bets in this round.</p>}{view==='My Bets'&&!data.bets.length&&<p className="studio-empty">No bets placed.</p>}</div></section>}
  {message&&<p className="studio-message" role="status">{message}</p>}
  {pending&&<div className="studio-pending" role="status"><p>Confirm the response to your pending {money(pending.stake)}-coin bet before placing another.</p><button disabled={busy} onClick={()=>submit(true)}>{busy?'Checking…':'Check / retry pending bet'}</button></div>}
  {runner&&!pending&&<div className="studio-modal-overlay" onClick={()=>!busy&&setRunner(null)}><section className="studio-slip" role="dialog" aria-modal="true" aria-label="Confirm demo bet" onClick={e=>e.stopPropagation()}><header><strong>{betSide.toUpperCase()} · {runner.name}</strong><button onClick={()=>setRunner(null)} aria-label="Close bet slip"><X size={19}/></button></header><div className="studio-slip-body"><p>Odds <b>{(betSide==='back'?runner.odds:runner.layOdds).toFixed(2)}</b> · Available <b>{money(data?.balance||0)}</b></p><label>Stake (free coins)<input autoFocus inputMode="decimal" type="number" min="0.01" max="1000000" step="0.01" value={stake} onChange={e=>setStake(e.target.value)}/></label><div className="studio-chips">{[100,500,1000,5000].map(n=><button key={n} onClick={()=>setStake(String(n))}>{money(n)}</button>)}</div><p>{betSide==='lay'?'Reserved liability':'Potential profit before commission'}: <b>{money(betSide==='lay'?Math.ceil((Number(stake)||0)*(runner.layOdds-1)*100)/100:Math.max(0,Number(stake)||0)*(runner.odds-1))}</b></p><button className="studio-place" disabled={!canBet||busy} onClick={()=>submit()}>{canBet?'Place demo bet':'Betting closed'}</button></div></section></div>}
 </div>;
}
export default function TeenPattiStudio(){
 const session=getClientSession();const [params,setParams]=useSearchParams();const [menu,setMenu]=useState(false);const [search,setSearch]=useState('');
 const id=params.get('GameId')||params.get('game');const game=studioLobbyGames.find(g=>g.id===id);
 const {data:account}=useQuery({queryKey:['studio-account',session?.username],queryFn:()=>readAccount(),enabled:!!session,refetchInterval:5000});
 if(!session)return <Navigate to="/login" replace/>;
 if(!['client','bettor','user'].includes(session.role.toLowerCase()))return <Navigate to="/dashboard" replace/>;
 function open(g?:Game){setParams(g?{GameId:g.id}:{});setMenu(false);window.scrollTo({top:0});}
 return <main className="teenpatti-studio"><div className="studio-sitebar"><Link to="/play">BPEXCH</Link><span>{session.username}</span></div><header className="studio-header"><div className="studio-header-left"><button aria-label={menu?'Close game menu':'Open game menu'} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button><button className="studio-lobby-button" onClick={()=>open()}><Home size={22}/><small>Lobby</small></button></div><StudioLogo onClick={()=>open()}/><div className="studio-wallet"><b>B: {account?money(account.availableBalance):'—'}</b><span>L: {account?money(account.exposure):'—'}</span></div></header>
 {menu&&<><button className="studio-menu-backdrop" aria-label="Close game menu" onClick={()=>setMenu(false)}/><nav className="studio-menu" aria-label="Studio games"><Link to="/play">← Dashboard</Link>{studioLobbyGames.map(g=><button key={g.id} className={id===g.id?'selected':''} onClick={()=>open(g)}>{g.name}<small>{g.playable?'Demo':'Unavailable'}</small></button>)}</nav></>}
 {id&&!game?<div className="studio-empty">Game not found. <button onClick={()=>open()}>Return to lobby</button></div>:game?<GameTable key={game.id} game={game} username={session.username}/>:<><div className="studio-lobby-tools"><p>FREE-COIN DEMO <span>{studioLobbyGames.length} games · {studioLobbyGames.filter(g=>g.playable).length} playable</span></p><label><Search size={15}/><input aria-label="Search games" placeholder="Search games" value={search} onChange={e=>setSearch(e.target.value)}/></label></div><section className="studio-grid studio-image-lobby" aria-label="TeenPatti Studio lobby">{studioLobbyGames.filter(g=>g.name.toLowerCase().includes(search.toLowerCase())).map(g=><button className="studio-tile" key={g.id} onClick={()=>open(g)} aria-label={`${g.name} — ${g.playable?'play demo':'unavailable'}`}><GameThumb game={g}/><div><span>{g.name}</span><small className={g.playable?'playable':''}>{g.playable?'DEMO':'UNAVAILABLE'}</small></div></button>)}</section>{!studioLobbyGames.some(g=>g.name.toLowerCase().includes(search.toLowerCase()))&&<p className="studio-empty">No games match your search.</p>}</>}
 <footer className="studio-footer">Free test coins only · No cash value</footer></main>;
}
