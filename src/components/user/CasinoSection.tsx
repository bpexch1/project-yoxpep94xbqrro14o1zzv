import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { studioLobbyGames } from "@/features/teenpatti/catalog";
import "./casino-lobby.css";

interface CasinoSectionProps { title?: string; }

// Only the owner's existing 34 game thumbnails, already stored in public/reference.
const art: Record<string, string> = {
 "9301":"chicken-road-2","9022":"aviator","9040":"aviator-x","9023":"blast-off",
 "9100":"cricket-x","9035":"dream-catcher","9001":"teenpatti-t20","9005":"teenpatti-odi",
 "9030":"auto-roulette","9006":"muflis-teenpatti","9021":"poker","9015":"sic-bo",
 "9002":"andar-bahar","9003":"hilo","9007":"7updown","9008":"ammar-akbar-anthony",
 "9009":"super-over-oneday","9011":"super-over-t20","9010":"32-cards",
 "9012":"bollywood-casino","9016":"race-to-17","9017":"high-card",
 "9018":"casino-war","9019":"lucky-7","9020":"center-card","9045":"trio",
 "9050":"trap","9055":"one-card-20-20","9065":"queen-race","9070":"dus-ka-dum",
 "9075":"side-bet-city","9080":"lottery","9085":"heads-tails","9105":"fortune-gems"
};

export function CasinoSection({ title = "Premium Casino" }: CasinoSectionProps) {
 const navigate = useNavigate();
 const [search, setSearch] = useState("");
 const [broken, setBroken] = useState<string[]>([]);
 const games = useMemo(() => studioLobbyGames.filter(game =>
   game.name.toLowerCase().includes(search.trim().toLowerCase())), [search]);
 if (title !== "Premium Casino") {
   return <section className="bpexch-casino-lobby bpexch-casino-empty" aria-label={title}>
     <header className="bpexch-casino-header"><h2>{title}</h2></header>
     <p>No demo race feed is available here yet.</p>
   </section>;
 }
 return <section className="bpexch-casino-lobby" aria-label="Casino demo games">
   <header className="bpexch-casino-header"><h2>CASINO GAMES</h2><span>FREE-COIN DEMO</span></header>
   <div className="bpexch-casino-toolbar">
     <p>TeenPatti Studio games · {studioLobbyGames.length} titles</p>
     <label className="bpexch-casino-search"><Search size={16} aria-hidden="true" />
       <span className="sr-only">Search games</span>
       <input type="search" aria-label="Search casino demo games" placeholder="Search games"
         value={search} onChange={event => setSearch(event.target.value)} />
     </label>
   </div>
   {games.length > 0 ? <div className="bpexch-casino-grid">
     {games.map((game, index) => <button type="button" key={game.id}
       className="bpexch-casino-game"
       style={{ animationDelay: String(Math.min(index, 12) * 25) + "ms" }}
       onClick={() => navigate("/teenpatti-studio?GameId=" + encodeURIComponent(game.id))}
       aria-label={"Open " + game.name + " demo"}>
       {art[game.id] && !broken.includes(game.id) ?
         <img src={"/reference/teenpatti-games/" + art[game.id] + ".webp"}
           alt="" loading="lazy"
           onError={() => setBroken(old => old.includes(game.id) ? old : [...old, game.id])} /> :
         <span className="bpexch-casino-fallback" aria-hidden="true">{game.symbol}</span>}
       <span className="bpexch-casino-name">{game.name}</span>
       <span className="bpexch-casino-mode">DEMO</span>
     </button>)}
   </div> : <p className="bpexch-casino-no-results" role="status">No games match your search.</p>}
   <footer className="bpexch-casino-footer">
     <button type="button" onClick={() => navigate("/teenpatti-studio")}>
       Open TeenPatti Studio Lobby
     </button>
     <p>Virtual demo games use free test coins. No real-money transfers.</p>
   </footer>
 </section>;
}
