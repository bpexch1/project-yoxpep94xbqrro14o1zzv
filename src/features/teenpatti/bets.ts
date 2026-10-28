export type RoundBetStatus={round_id:string;status:string};

/** Accepted orders stay visible through this round's reveal and ROUND OVER. */
export function currentRoundMatchedBets<T extends RoundBetStatus>(bets:T[],roundId:string):T[]{
 return bets.filter(b=>b.round_id===roundId&&['pending','matched','won','lost','void'].includes(b.status.toLowerCase()));
}

/** Closed orders for the just-finished round, used for the result notice only. */
export function settledRoundBets<T extends RoundBetStatus>(bets:T[],roundId:string):T[]{
 return bets.filter(b=>b.round_id===roundId&&!['pending','matched'].includes(b.status.toLowerCase()));
}

type PricedRoundBet=RoundBetStatus&{runner_id:string;bet_type:'back'|'lay';stake:number;odds:number};

/** Gross outcome positions from accepted, unsettled wagers in one round. */
export function roundPositions<T extends PricedRoundBet>(bets:T[],roundId:string,runnerIds:string[],showSettled=false):Record<string,number>{
 const result=Object.fromEntries(runnerIds.map(id=>[id,0])) as Record<string,number>;
 for(const bet of bets){
  if(bet.round_id!==roundId||!['pending','matched',...(showSettled?['won','lost']:[])].includes(bet.status.toLowerCase()))continue;
  const stake=Number(bet.stake),odds=Number(bet.odds);
  if(!Number.isFinite(stake)||!Number.isFinite(odds)||stake<=0||odds<=1||!runnerIds.includes(bet.runner_id))continue;
  for(const id of runnerIds){
   const selected=id===bet.runner_id;
   result[id]+=(bet.bet_type==='back'?(selected?stake*(odds-1):-stake):(selected?-stake*(odds-1):stake));
  }
 }
 for(const id of runnerIds)result[id]=Math.round(result[id]*100)/100;
 return result;
}
