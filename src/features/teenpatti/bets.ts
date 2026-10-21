export type RoundBetStatus={round_id:string;status:string};

/** Accepted orders stay visible through this round's reveal and ROUND OVER. */
export function currentRoundMatchedBets<T extends RoundBetStatus>(bets:T[],roundId:string):T[]{
 return bets.filter(b=>b.round_id===roundId&&['pending','matched','won','lost','void'].includes(b.status.toLowerCase()));
}

/** Closed orders for the just-finished round, used for the result notice only. */
export function settledRoundBets<T extends RoundBetStatus>(bets:T[],roundId:string):T[]{
 return bets.filter(b=>b.round_id===roundId&&!['pending','matched'].includes(b.status.toLowerCase()));
}
