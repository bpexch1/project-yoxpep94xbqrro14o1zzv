import { realClient } from '@/integrations/supabase';
export type Outcome={winner:string|null;groups:{label:string;cards?:number[];value?:string}[];summary:string};
export type StudioBetRow={id:string;selection:string;runner_id:string;bet_type:'back'|'lay';stake:number;odds:number;status:string;profit:number|null;round_id:string;created_at:string};
export type MatchedStudioBet=StudioBetRow&{order_id:string};
export type StudioState={round:{id:string;gameId:string;closesAt:string;endsAt:string;settled:boolean;outcome:Outcome|null};config:{name:string;kind:string;rules:string;timing?:{bettingSeconds:number;resultSeconds:number;source?:string};runners:{id:string;name:string;odds:number;layOdds:number}[]};balance:number;exposure:number;serverNow:string;history:{id:string;settled_at:string;outcome:Outcome}[];matchedBets?:MatchedStudioBet[];bets:StudioBetRow[]};
export async function studioRequest<T>(action:string,input:unknown):Promise<T>{
 const token=sessionStorage.getItem('exchangeSessionToken');
 if(!token||!realClient)throw new Error('Please sign in again to use TeenPatti Studio');
 const {data,error}=await realClient.functions.invoke('teenpatti-studio',{body:{action,input},headers:{'x-exchange-session':token}});
 if(error){const failure=error.context instanceof Response?await error.context.json().catch(()=>null):null;throw new Error(failure?.error||'Connection interrupted. Retry your pending bet with the same request.');}
 if(data?.error)throw new Error(data.error);return data;
}
export type StudioBet={roundId:string;requestId:string;runnerId:string;side:'back'|'lay';stake:number;odds:number};
export const pendingKey=(username:string)=>`studio-pending:${username}`;
