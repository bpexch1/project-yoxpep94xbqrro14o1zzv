import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Match, Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import { getClientSession } from "@/hooks/useClientAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Info, Volume2, Clock, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keepDisplayOn, setKeepDisplayOn] = useState(true);

  const session = getClientSession();

  useEffect(() => {
    if (!session || session.role !== 'client') {
      navigate("/login", { replace: true });
    }
  }, [session, navigate]);

  // Fetch match details
  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const results = await Match.list();
      return results.find((m: any) => m.id === matchId);
    },
    enabled: !!matchId,
    refetchInterval: 4000 // Refresh odds every 4 seconds
  });

  // Fetch real-time client data
  const { data: clients, isLoading: clientLoading } = useQuery({
    queryKey: ['client-data', session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username
  });

  const { data: openBets = [] } = useQuery({
    queryKey: ['open-bets', matchId, session?.username],
    queryFn: () => Bet.filter({ 
      user_email: session?.username,
      match_id: matchId,
      status: 'pending'
    }),
    enabled: !!session?.username && !!matchId,
    refetchInterval: 5000 // refresh every 5s
  });

  const clientData = clients?.[0];
  const clientBalance = clientData?.cash ?? 0;

  // Place bet mutation
  const { mutate: placeBet, isPending: isSubmitting } = useMutation({
    mutationFn: async (stake: number) => {
      if (!activeBet || !session || !clientData) return;

      if (stake > clientBalance) {
        throw new Error("Insufficient balance");
      }

      const potentialWin = (stake * activeBet.odds) - stake;

      await Bet.create({
        user_email: session.username,
        match_id: activeBet.match.id,
        match_title: activeBet.match.title || `${activeBet.match.team1} v ${activeBet.match.team2}`,
        selection: activeBet.selection,
        bet_type: activeBet.betType,
        stake,
        odds: activeBet.odds,
        potential_win: potentialWin,
        status: 'pending'
      });

      await Client.update(clientData.id, {
        cash: clientBalance - stake
      });
    },
    onSuccess: () => {
      toast({
        title: "Bet Placed Successfully!",
        description: "Good luck with your selection.",
      });
      setActiveBet(null);
      queryClient.invalidateQueries({ queryKey: ['client-data'] });
      queryClient.invalidateQueries({ queryKey: ['open-bets'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Bet Failed",
        description: error.message || "Could not place bet. Please try again.",
      });
    }
  });

  if (!session) return null;

  if (matchLoading || clientLoading) {
    return (
      <div className="min-h-screen bg-[#d6e4f0] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1e3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#d6e4f0] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-[#1e3a5c] mb-2">Match Not Found</h2>
        <button 
          onClick={() => navigate('/play')}
          className="text-[#16a085] font-bold underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  const tabs = ["ALL", "Bookmaker", "BetFair-Fancy", "Fancy-2"];

  const fancyBets = [
    { name: "1st Innings 6 Overs Line", backOdds: 46, layOdds: 45, backSize: "5.8M", laySize: "1.5M", label: "Book" },
  ];

  const fancy2Bets = [
    { name: "6 Over Run PZ", backOdds: 46, layOdds: 45, backSize: "100", laySize: "100", label: "Book" },
    { name: "1st Wkt Lost To PZ Balls", backOdds: 22, layOdds: 22, backSize: "90", laySize: "110", label: "Book" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#d6e4f0", display: "flex", flexDirection: "column" }}>
      <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* === MATCH INFO CARD (dark navy) === */}
      <div style={{ backgroundColor: "#1e3a5c", padding: "12px 14px" }}>
        {/* Row 1: time info + INPLAY */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => navigate('/play')} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <ArrowLeft size={20} color="white" />
            </button>
            <Clock size={14} color="rgba(255,255,255,0.6)" />
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>20 minutes ago | Apr 21 7:00 pm | Winners: 1</span>
          </div>
          {match.status === 'live' && (
            <span style={{ color: "#00a65a", fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>INPLAY</span>
          )}
        </div>
        {/* Row 2: Match Title */}
        <h1 style={{ color: "white", fontWeight: 900, fontSize: 20, lineHeight: 1.3, margin: "6px 0" }}>
          {matchTitle}
        </h1>
        {/* Row 3: Elapsed */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Elapsed : 00:19:42</span>
        </div>
        {/* Row 4: Keep Display On */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <input 
            type="checkbox" 
            checked={keepDisplayOn} 
            onChange={(e) => setKeepDisplayOn(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#3b82f6" }} 
          />
          <span style={{ color: "white", fontSize: 13 }}>Keep Display On</span>
        </div>
      </div>

      {/* === FILTER TABS (pill-shaped) === */}
      <div style={{ backgroundColor: "#fff", padding: "10px 12px", display: "flex", gap: 8, overflowX: "auto" }} className="no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              borderRadius: 50,
              padding: "7px 18px",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              backgroundColor: activeTab === tab ? "#00a65a" : "#3d6b8b",
              color: "white",
              transition: "background-color 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* === SCORE BAR === */}
      {match.status === 'live' && (
        <div style={{ backgroundColor: "#fff", padding: "10px 14px", borderBottom: "1px solid #dde4ea" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontWeight: 900, fontSize: 16, color: "#1e3a5c" }}>SRH</span>
              <span style={{ fontWeight: 900, fontSize: 16, color: "#1e3a5c" }}> 48/0 (4.2)</span>
              <span style={{ fontSize: 13, color: "#555", marginLeft: 12 }}>CRR: 11.08</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#00a65a", fontWeight: 900, fontSize: 18 }}>SIX</span>
              <Volume2 size={16} color="#555" />
            </div>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>This Over : 6 6</div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>

        {(activeTab === "ALL" || activeTab === "Bookmaker") && (
          <>
            {/* MATCH ODDS */}
            <div style={{ marginTop: 8 }}>
              <CombinedSectionHeader title="MATCH ODDS (MaxBet: 5M)" />
              <TeamRow2 name={match.team1} odds={match.back_odds} layOdds={match.lay_odds} onBet={(t,o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })} />
              <TeamRow2 name={match.team2} odds={match.back_odds2 || match.back_odds} layOdds={match.lay_odds2 || match.lay_odds} onBet={(t,o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })} />
            </div>

            {/* BOOKMAKER */}
            <div style={{ marginTop: 8 }}>
              <CombinedSectionHeader title="BOOKMAKER (MaxBet: 1M)" />
              <TeamRow2 name={match.team1} odds={Math.round((match.back_odds || 1.9) * 100) / 100} layOdds={Math.round((match.lay_odds || 2.0) * 100) / 100} onBet={(t,o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })} />
              <TeamRow2 name={match.team2} odds={Math.round(((match.back_odds2 || match.back_odds || 2.1)) * 100) / 100} layOdds={Math.round(((match.lay_odds2 || match.lay_odds || 2.2)) * 100) / 100} onBet={(t,o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })} />
            </div>
          </>
        )}

        {(activeTab === "ALL" || activeTab === "BetFair-Fancy") && (
          <div style={{ marginTop: 8 }}>
            <CombinedSectionHeader title="BETFAIR FANCY (MaxBet: 200K)" />
            <FancyRow2 name="1st Innings 20 Overs Line" backOdds={214} layOdds={213} backSize="447.9K" laySize="7.6M" onBet={(t,o) => setActiveBet({ match, selection: "1st Innings 20 Overs Line", betType: t, odds: o })} />
            <FancyRow2 name="1st Innings 6 Overs Line" backOdds={70} layOdds={69} backSize="11.6M" laySize="11.3M" onBet={(t,o) => setActiveBet({ match, selection: "1st Innings 6 Overs Line", betType: t, odds: o })} />
            <FancyRow2 name="1st Innings 10 Overs Line" backOdds={98} layOdds={97} backSize="2.5M" laySize="3.1M" onBet={(t,o) => setActiveBet({ match, selection: "1st Innings 10 Overs Line", betType: t, odds: o })} />
            <FancyRow2 name="How Many 4s" backOdds={18} layOdds={17} backSize="100" laySize="100" onBet={(t,o) => setActiveBet({ match, selection: "How Many 4s", betType: t, odds: o })} />
            <FancyRow2 name="How Many 6s" backOdds={9} layOdds={8} backSize="100" laySize="100" onBet={(t,o) => setActiveBet({ match, selection: "How Many 6s", betType: t, odds: o })} />
            <FancyRow2 name="0.5 Ball Run" backOdds={0} layOdds={0} backSize="" laySize="" suspended={true} onBet={() => {}} />
            <FancyRow2 name="Fall of 1st Wkt" backOdds={35} layOdds={35} backSize="90" laySize="110" onBet={(t,o) => setActiveBet({ match, selection: "Fall of 1st Wkt", betType: t, odds: o })} />
            <FancyRow2 name="Fall of 2nd Wkt" backOdds={71} layOdds={71} backSize="90" laySize="110" onBet={(t,o) => setActiveBet({ match, selection: "Fall of 2nd Wkt", betType: t, odds: o })} />
          </div>
        )}

        {(activeTab === "ALL" || activeTab === "Fancy-2") && (
          <div style={{ marginTop: 8 }}>
            <CombinedSectionHeader title="FANCY 2 (MaxBet: 200K)" />
            <FancyRow2 name="1 Over Run SRH" backOdds={11} layOdds={10} backSize="100" laySize="100" onBet={(t,o) => setActiveBet({ match, selection: "1 Over Run SRH", betType: t, odds: o })} />
            <FancyRow2 name="4 Over Run SRH" backOdds={44} layOdds={43} backSize="100" laySize="100" onBet={(t,o) => setActiveBet({ match, selection: "4 Over Run SRH", betType: t, odds: o })} />
            <FancyRow2 name="6 Over Run SRH" backOdds={66} layOdds={65} backSize="100" laySize="100" onBet={(t,o) => setActiveBet({ match, selection: "6 Over Run SRH", betType: t, odds: o })} />
            <FancyRow2 name="0.5 Ball Run SRH" backOdds={0} layOdds={0} backSize="" laySize="" suspended={true} onBet={() => {}} />
            <FancyRow2 name="0.6 Ball Run SRH" backOdds={0} layOdds={0} backSize="" laySize="" suspended={true} onBet={() => {}} />
            <FancyRow2 name="10 Over Run SRH" backOdds={103} layOdds={101} backSize="100" laySize="100" onBet={(t,o) => setActiveBet({ match, selection: "10 Over Run SRH", betType: t, odds: o })} />
            <FancyRow2 name="20 Over Run SRH" backOdds={205} layOdds={203} backSize="100" laySize="100" onBet={(t,o) => setActiveBet({ match, selection: "20 Over Run SRH", betType: t, odds: o })} />
            {/* Grid section for Over Total Last Figure */}
            <LastFigureGrid title={`${match.team1 || 'Team'} 10 OVER TOTAL LAST FIGURE (MaxBet: 1M)`} onBet={(n) => setActiveBet({ match, selection: `10 Over Last Digit: ${n}`, betType: 'back', odds: 8.85 })} />
            <LastFigureGrid title={`${match.team1 || 'Team'} 15 OVER TOTAL LAST FIGURE (MaxBet: 1M)`} onBet={(n) => setActiveBet({ match, selection: `15 Over Last Digit: ${n}`, betType: 'back', odds: 8.85 })} />
            <LastFigureGrid title={`${match.team1 || 'Team'} 20 OVER TOTAL LAST FIGURE (MaxBet: 1M)`} onBet={(n) => setActiveBet({ match, selection: `20 Over Last Digit: ${n}`, betType: 'back', odds: 8.85 })} />
          </div>
        )}

        {/* === TV / SCORE CARD TABS === */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", borderBottom: "1px solid #dde4ea" }}>
            <button style={{ flex: 1, padding: "10px 0", backgroundColor: activeTab === 'tv' ? "#00a65a" : "#3d6b8b", color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>Tv</button>
            <button style={{ flex: 1, padding: "10px 0", backgroundColor: "#00a65a", color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>Score Card</button>
          </div>
          <div style={{ backgroundColor: "#1a1a2e", padding: "12px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13, minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            Live stream unavailable
          </div>
        </div>

        {/* === OPEN BETS === */}
        <div style={{ marginTop: 8, backgroundColor: "white" }}>
          <div style={{ backgroundColor: "#1e3a5c", padding: "10px 14px" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Open Bets ({openBets.length})</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#1e3a5c", borderBottom: "1px solid #e0e0e0" }}>Runner</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: "#1e3a5c", borderBottom: "1px solid #e0e0e0" }}>Price</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#1e3a5c", borderBottom: "1px solid #e0e0e0" }}>Size</th>
                </tr>
              </thead>
              <tbody>
                {openBets.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#999" }}>No open bets</td></tr>
                ) : (
                  openBets.map((bet: any) => (
                    <tr key={bet.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "8px 12px", color: "#1e3a5c", fontWeight: 600 }}>
                        <span style={{ backgroundColor: bet.bet_type === 'back' ? "#72bbef" : "#faa9ba", color: "#000", fontSize: 10, fontWeight: 700, borderRadius: 2, padding: "1px 5px", marginRight: 6 }}>
                          {bet.bet_type?.toUpperCase()}
                        </span>
                        {bet.selection}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>{bet.odds}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>Rs. {bet.stake?.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* === MATCHED BETS === */}
        <div style={{ marginTop: 8, backgroundColor: "white", marginBottom: 16 }}>
          <div style={{ backgroundColor: "#1e3a5c", padding: "10px 14px" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Matched Bets (0)</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#1e3a5c", borderBottom: "1px solid #e0e0e0" }}>Runner</th>
                <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: "#1e3a5c", borderBottom: "1px solid #e0e0e0" }}>Price</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#1e3a5c", borderBottom: "1px solid #e0e0e0" }}>Size</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#999" }}>No matched bets</td></tr>
            </tbody>
          </table>
        </div>

      </main>

      <BetSlip bet={activeBet} onClose={() => setActiveBet(null)} onSubmit={(stake) => placeBet(stake)} isSubmitting={isSubmitting} />
    </div>
  );
}

// CombinedSectionHeader: dark navy header with BACK/LAY column headers
function CombinedSectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#1e3a5c" }}>
      {/* Left: market name */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#00a65a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: 11, fontWeight: 900 }}>$</span>
        </div>
        <span style={{ color: "white", fontWeight: 900, fontSize: 13, textTransform: "uppercase" }}>{title}</span>
        <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#444", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4, cursor: "pointer" }}>
          <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>i</span>
        </div>
      </div>
      {/* Right: BACK | LAY headers */}
      <div style={{ display: "flex", flexShrink: 0 }}>
        <div style={{ width: 90, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e3a5c", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ color: "white", fontWeight: 900, fontSize: 12 }}>BACK</span>
        </div>
        <div style={{ width: 90, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e3a5c", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ color: "white", fontWeight: 900, fontSize: 12 }}>LAY</span>
        </div>
      </div>
    </div>
  );
}

// TeamRow2: larger odds display
function TeamRow2({ name, odds, layOdds, onBet }: { name: string; odds: number; layOdds: number; onBet: (type: 'back' | 'lay', odds: number) => void }) {
  const backOddsVal = odds || 1.5;
  const layOddsVal = layOdds || 1.52;
  // Random size for authenticity
  const backSize = `${(Math.random() * 3 + 0.5).toFixed(1)}M`;
  const laySize = `${(Math.random() * 2 + 0.2).toFixed(1)}M`;
  
  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "white", borderBottom: "1px solid #ccd9e5", minHeight: 68 }}>
      {/* Team name */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "10px 14px" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#1e3a5c" }}>{name}</span>
      </div>
      {/* Back odds */}
      <div
        onClick={() => onBet('back', backOddsVal)}
        style={{ width: 90, backgroundColor: "#72bbef", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", borderLeft: "1px solid rgba(0,0,0,0.05)" }}
      >
        <span style={{ fontWeight: 900, fontSize: 26, color: "#1e3a5c", lineHeight: 1 }}>{backOddsVal.toFixed(2)}</span>
        <span style={{ fontSize: 11, color: "#1e3a5c", opacity: 0.6, marginTop: 3 }}>{backSize}</span>
      </div>
      {/* Lay odds */}
      <div
        onClick={() => onBet('lay', layOddsVal)}
        style={{ width: 90, backgroundColor: "#faa9ba", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", borderLeft: "1px solid rgba(0,0,0,0.05)" }}
      >
        <span style={{ fontWeight: 900, fontSize: 26, color: "#1e3a5c", lineHeight: 1 }}>{layOddsVal.toFixed(2)}</span>
        <span style={{ fontSize: 11, color: "#1e3a5c", opacity: 0.6, marginTop: 3 }}>{laySize}</span>
      </div>
    </div>
  );
}

// FancyRow2: with Book link and SUSPENDED support
function FancyRow2({ name, backOdds, layOdds, backSize, laySize, suspended, onBet }: {
  name: string; backOdds: number; layOdds: number; backSize: string; laySize: string; suspended?: boolean;
  onBet: (type: 'back' | 'lay', odds: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "white", borderBottom: "1px solid #ccd9e5", minHeight: 64 }}>
      {/* Name + Book link */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "8px 14px" }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5c" }}>{name}</span>
        <span style={{ color: "#00a65a", fontSize: 12, fontWeight: 700, marginTop: 2, cursor: "pointer" }}>Book</span>
      </div>
      {/* Suspended or odds */}
      {suspended ? (
        <div style={{ width: 180, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5", borderLeft: "1px solid #e0e0e0" }}>
          <span style={{ color: "#dc3545", fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>SUSPENDED</span>
        </div>
      ) : (
        <>
          <div
            onClick={() => onBet('back', backOdds)}
            style={{ width: 90, backgroundColor: "#72bbef", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", borderLeft: "1px solid rgba(0,0,0,0.05)" }}
          >
            <span style={{ fontWeight: 900, fontSize: 22, color: "#1e3a5c", lineHeight: 1 }}>{backOdds}</span>
            <span style={{ fontSize: 11, color: "#1e3a5c", opacity: 0.6, marginTop: 3 }}>{backSize}</span>
          </div>
          <div
            onClick={() => onBet('lay', layOdds)}
            style={{ width: 90, backgroundColor: "#faa9ba", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", borderLeft: "1px solid rgba(0,0,0,0.05)" }}
          >
            <span style={{ fontWeight: 900, fontSize: 22, color: "#1e3a5c", lineHeight: 1 }}>{layOdds}</span>
            <span style={{ fontSize: 11, color: "#1e3a5c", opacity: 0.6, marginTop: 3 }}>{laySize}</span>
          </div>
        </>
      )}
    </div>
  );
}

// LastFigureGrid: 5x2 grid of number boxes (0-9) for "Over Total Last Figure" markets
function LastFigureGrid({ title, onBet }: { title: string; onBet: (n: number) => void }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ backgroundColor: "#1e3a5c", padding: "10px 12px" }}>
        <span style={{ color: "white", fontWeight: 900, fontSize: 12, textTransform: "uppercase" }}>{title}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, padding: 8, backgroundColor: "white" }}>
        {[0,1,2,3,4,5,6,7,8,9].map((n) => (
          <div
            key={n}
            onClick={() => onBet(n)}
            style={{
              backgroundColor: "#72bbef",
              borderRadius: 4,
              padding: "10px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              minHeight: 56,
              justifyContent: "center",
            }}
          >
            <span style={{ fontWeight: 900, fontSize: 22, color: "#1e3a5c", lineHeight: 1 }}>{n}</span>
            <span style={{ fontSize: 11, color: "#1e3a5c", opacity: 0.6, marginTop: 4 }}>8.85</span>
          </div>
        ))}
      </div>
    </div>
  );
}
