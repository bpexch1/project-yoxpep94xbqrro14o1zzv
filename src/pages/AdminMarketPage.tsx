import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bet, Match } from '@/entities';
import { getClientSession } from '@/hooks/useClientAuth';
import { useDownlineUsernames } from '@/hooks/useDownlineUsernames';
import { getLiveOdds } from '@/functions';
import { calculateMarketPositions } from '@/utils/bettingPositions';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AdminMarketPage() {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const session = getClientSession();
  const [media, setMedia] = useState<'tv' | 'score' | null>('score');
  const [locker, setLocker] = useState<string | null>(null);
  const [showBook, setShowBook] = useState(false);
  const [bookTab, setBookTab] = useState('ALL');
  const [fullList, setFullList] = useState(false);
  const { data: downline, isError: scopeError } = useDownlineUsernames(session?.username, session?.role);
  const { data: match, isLoading, isError } = useQuery({
    queryKey: ['admin-market', matchId],
    queryFn: async () => (await Match.list()).find((item: any) => String(item.id) === matchId || String(item.betfair_event_id) === matchId) || null,
    initialData: location.state?.match?.id === matchId ? location.state.match : undefined,
  });
  const { data: odds, isError: oddsError, refetch: refreshOdds } = useQuery({
    queryKey: ['admin-market-odds', match?.betfair_event_id],
    queryFn: () => getLiveOdds({ eventId: match.betfair_event_id }),
    enabled: !!match?.betfair_event_id,
    refetchInterval: 10000,
  });
  const { data: bets = [], isLoading: betsLoading, isError: betsError, refetch: refreshBets } = useQuery({
    queryKey: ['admin-market-bets', matchId, session?.username, downline],
    queryFn: async () => {
      let query = Bet.query().sort('-created_at');
      if (downline !== null) query = query.in('user_email', [session!.username, ...(downline || [])]);
      return (await query.exec()).filter((bet: any) => String(bet.match_id) === String(match.id) || (!!match.betfair_event_id && String(bet.match_id) === String(match.betfair_event_id)));
    },
    enabled: !!match && !!session && downline !== undefined,
    refetchInterval: 10000,
  });
  if (isLoading) return <div className="card card-body" role="status">Loading market…</div>;
  if (isError || !match) return <div className="card card-body" role="alert">Market unavailable. <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button></div>;
  const market = odds?.markets?.find((item: any) => item.marketName?.toLowerCase().includes('match odds')) || odds?.markets?.[0];
  const runners: any[] = market?.runners?.length ? market.runners : [
    { runnerName: match.team1, backPrice: match.back_odds, layPrice: match.lay_odds },
    { runnerName: match.team2, backPrice: match.back_odds2, layPrice: match.lay_odds2 },
    ...(['soccer','football'].includes(match.sport?.toLowerCase()) ? [{ runnerName: 'The Draw', backPrice: match.draw_back_odds, layPrice: match.draw_lay_odds }] : []),
  ].filter(runner => runner.runnerName);
  const runnerNames = runners.map(runner => runner.runnerName);
  const open = bets.filter((bet: any) => ['open','unmatched'].includes(bet.status));
  const matched = bets.filter((bet: any) => !['open','unmatched','cancelled','void'].includes(bet.status));
  const users = [...new Set(bets.map((bet: any) => String(bet.user_email)))];
  const title = match.title || `${match.team1} v ${match.team2}`;
  const size = (value: any) => value == null ? '' : Number(value) >= 1000 ? `${(Number(value)/1000).toFixed(1)}K` : Number(value).toLocaleString();
  const table = (rows: any[]) => <div className="admin-market-scroll"><table><thead><tr>{['Runner','Price','Size','Better','Master'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((bet: any) => <tr key={bet.id}><td>{bet.selection}</td><td>{bet.odds}</td><td>{Number(bet.stake || 0).toLocaleString()}</td><td>{bet.user_email}</td><td>{bet.master_username || bet.parent_username || '—'}</td></tr>)}</tbody></table></div>;
  if (showBook) return <section className="admin-user-book"><div>{title} Match Odds</div><button className="btn btn-info" onClick={() => void refreshBets()}>Refresh</button><button className="btn" onClick={() => setShowBook(false)}>Back</button><div className="book-tabs">{['ALL','My Users'].map(tab => <button className={tab === bookTab ? 'active' : ''} key={tab} onClick={() => setBookTab(tab)}>{tab}</button>)}</div>{betsError || scopeError ? <p role="alert">Unable to load user positions.</p> : <div className="admin-market-scroll"><table className="table table-bordered table-sm"><thead><tr><th>Username</th>{runnerNames.map(name => <th key={name}>{name}</th>)}</tr></thead><tbody>{users.filter(user => bookTab === 'ALL' || user !== session?.username).map(user => { const positions = calculateMarketPositions(runnerNames, matched.filter((bet: any) => bet.user_email === user && ['pending','matched'].includes(bet.status))); return <tr key={user}><td>{user}</td>{runnerNames.map(name => <td key={name}>{positions[name]?.toLocaleString()}</td>)}</tr>; })}</tbody></table></div>}</section>;
  return <div className="reference-admin-market">
    <section className="admin-market-card"><div className="admin-market-title">{title} - Match Odds <span>{market?.status || match.market_status || ''}</span></div><div className="admin-market-meta">{match.start_time ? new Date(match.start_time).toLocaleString() : ''}</div><table className="admin-odds-table"><tbody>{runners.map((runner,index) => <tr key={runner.selectionId || index}><th>{runner.runnerName}</th><td className="admin-back">{runner.backPrice ?? '—'}<small>{size(runner.backSize)}</small></td><td className="admin-lay">{runner.layPrice ?? '—'}<small>{size(runner.laySize)}</small></td></tr>)}</tbody></table>{oddsError && <p role="status">Live prices unavailable. <button onClick={() => void refreshOdds()}>Retry</button></p>}</section>
    <section className="admin-market-card admin-market-actions"><details><summary className="btn btn-primary">Bet Lock ▾</summary><div className="admin-market-menu"><button onClick={() => setLocker('Match Odds')}>Match Odds</button><button onClick={() => setLocker('Other Markets')}>Other Markets</button></div></details><button className="btn btn-primary" onClick={() => setShowBook(true)}>User Book</button></section>
    <section className="admin-media"><div className="admin-media-tabs"><button aria-pressed={media === 'tv'} onClick={() => setMedia(media === 'tv' ? null : 'tv')}>Tv</button><button aria-pressed={media === 'score'} onClick={() => setMedia(media === 'score' ? null : 'score')}>Score Card</button></div>{media && <div className="admin-media-body">{media === 'score' ? <div className="admin-score-panel"><strong>{match.team1}</strong><strong>{match.team2}</strong><p>{match.score || 'Score feed unavailable'}</p></div> : <p role="status">Live TV is not connected for this market.</p>}</div>}</section>
    {scopeError || betsError ? <div role="alert" className="card card-body">Unable to load market bets. <button onClick={() => void refreshBets()}>Retry</button></div> : <><section className="admin-market-card"><div className="admin-market-title">Open Bets ({open.length})</div>{betsLoading ? <p role="status">Loading bets…</p> : table(open)}</section><section className="admin-market-card"><div className="admin-market-title">Matched Bets ({matched.length}) <button className="btn btn-primary btn-sm" onClick={() => setFullList(value => !value)}>{fullList ? 'Compact List' : 'Full Bet List'}</button></div>{table(fullList ? matched : matched.slice(0,25))}</section></>}
    <Dialog open={!!locker} onOpenChange={open => { if (!open) setLocker(null); }}><DialogContent className="reference-market-locker"><DialogTitle>{locker} - Bet Locker</DialogTitle><DialogDescription>Market lock controls require a connected permissions service. Changes are currently unavailable.</DialogDescription><fieldset disabled><label><input type="radio" name="lock-scope" /> All Users</label> <label><input type="radio" name="lock-scope" defaultChecked /> Selected Users</label>{(downline || users).map(user => <label className="block" key={user}><input type="checkbox" /> {user}</label>)}</fieldset><button className="btn btn-primary" disabled>Save</button><button onClick={() => setLocker(null)}>Cancel</button></DialogContent></Dialog>
  </div>;
}
