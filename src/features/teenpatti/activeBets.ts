// Current-round matched bets are a view, not a deletion or financial settlement.
export type RoundScopedBet = { id:string; round_id:string; status:string };
export function activeRoundBets<T extends RoundScopedBet>(bets:readonly T[]|undefined,roundId:string|undefined):T[]{
 if(!roundId||!bets)return [];
 return bets.filter(b=>b.round_id===roundId&&(b.status==='pending'||b.status==='matched'));
}
