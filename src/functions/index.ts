import { getMarkets,getLiveMarketOdds,isFreshMarket } from '@/services/marketFeed';
import { requestSettlement,lockMarket } from '@/services/settlement';
import { Match } from '@/entities';
// Legacy callers now use real backend services. No production mock success or prices.
export const fetchCricbuzzMatches=async()=>[];
export const fetchCricbuzzHscard=async(_id:string|number)=>null;
export const fetchSportApi7Matches=async(_sport='football')=>[];
export const fetchBetfairEvents=async(_params?:any)=>{await getMarkets();return Match.list();};
export const fetchAtdCricketHome=async(_params?:any)=>({matches:[]});
export const handleTransaction=async(_data:any)=>{throw new Error('Use the authenticated wallet service');};
export const settleBets=async(data:any)=>{
 const markets=await getMarkets({matchId:data.matchId});
 const market=markets.filter(m=>/match.odds/i.test(m.name));
 if(market.length!==1) throw new Error('A unique provider market is required for settlement');
 const runner=market[0].runners.find(r=>r.name.toLowerCase()===data.winningSide.toLowerCase());
 if(!runner) throw new Error('Winning selection is not in the provider market');
 const key=`settlement:${market[0].id}:${runner.id}`;
 const ids=JSON.parse(sessionStorage.getItem(key)||'null')||{lock:crypto.randomUUID(),settle:crypto.randomUUID()};
 sessionStorage.setItem(key,JSON.stringify(ids));
 await lockMarket({requestId:ids.lock,marketId:market[0].id,locked:true});
 const result=await requestSettlement({requestId:ids.settle,marketId:market[0].id,winnerId:runner.id,reason:'Result confirmed from administrator settlement page'});
 // Keep receipt IDs so repeated confirmation is an idempotent replay, including across reloads.
 return result;
};
export const getLiveOdds=async(params:any):Promise<any>=>getLiveMarketOdds(String(params?.eventId||params?.matchId));
export const getCricketScore=async(_params:any):Promise<any>=>null;
export const oddsEngine=async(data:any):Promise<any>=>{
 const markets=await getMarkets(data.betfairEventId?{eventId:data.betfairEventId}:{matchId:data.matchId});
 const m=markets.find(m=>/match.odds/i.test(m.name));
 const get=(i:number,side:string)=>m&&isFreshMarket(m)?Number(m.quotes.find(q=>q.runner_id===m.runners[i]?.id&&q.side===side)?.odds)||null:null;
 if(data.action==='validateOdds') throw new Error('Odds are validated atomically during bet placement');
 return {success:true,odds:{teamA_back:get(0,'back'),teamA_lay:get(0,'lay'),teamB_back:get(1,'back'),teamB_lay:get(1,'lay'),isSuspended:!m||!isFreshMarket(m)}};
};
export const fetchFootballShotmap=async(_eventId:string|number,_teamId?:string|number):Promise<any>=>null;
export const fetchRapidApiBetfairMatchDetails=async(_eventId:string|number)=>null;
export const fetchRapidApiTvAccess=async(_eventId:string|number)=>null;
export const fetchEventShotmap=fetchFootballShotmap;
