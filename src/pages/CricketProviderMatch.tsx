import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { getCricketFeed } from "@/services/cricket";

export default function CricketProviderMatch() {
  const { providerId } = useParams();
  const session = getClientSession();
  const { data, error, isLoading } = useQuery({
    queryKey: ["cricket-feed"], queryFn: getCricketFeed, enabled: !!session,
    staleTime: 60_000, refetchInterval: 120_000, retry: 1,
  });
  const match = data?.matches.find((item) => item.providerId === providerId);
  if (!session) return <p className="p-6"><Link to="/login">Sign in to view cricket scores</Link></p>;
  return <main className="mx-auto max-w-3xl p-4 text-[#142a45]">
    <Link to="/play" className="text-sm underline">← Back to matches</Link>
    {isLoading && <p className="mt-5" role="status">Loading cricket match…</p>}
    {error && <p className="mt-5 text-red-700" role="alert">{error.message}</p>}
    {!isLoading && !error && !match && <p className="mt-5">Match is not in the current provider feed.</p>}
    {match && <article className="mt-4 rounded border bg-white p-5">
      <div className="flex justify-between gap-3 text-sm"><span>{match.status.toUpperCase()}</span><span>CricketData {data?.stale ? "· delayed" : "· score feed"}</span></div>
      <h1 className="mt-3 text-xl font-bold">{match.teams.join(" vs ")}</h1>
      <p className="mt-2 text-sm">{match.statusText || match.title}</p>
      {match.startsAt && <p className="mt-2 text-sm">Start: {new Date(match.startsAt).toLocaleString()}</p>}
      <div className="mt-4 space-y-1">{match.scores.map((score, index) => <p key={`${score.inning}-${index}`}>
        {score.inning}: {score.runs}/{score.wickets} ({score.overs} ov)
      </p>)}</div>
      <section className="mt-5 rounded bg-amber-50 p-3 text-sm" aria-label="Market status">
        Market suspended. This score provider does not supply licensed Back/Lay odds; bets cannot be placed on this provider match.
      </section>
      <p className="mt-3 text-xs text-gray-500">Provider ID: {match.providerId} · Updated {data?.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : "—"}</p>
    </article>}
  </main>;
}
