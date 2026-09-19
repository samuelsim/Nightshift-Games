import type { GameContext, GameDefinition, GameActionResult } from '@nightshift/game-core';
import { shuffled } from '@nightshift/game-core';
import type { PlayerAction } from '@nightshift/protocol';
import { infiltratorMetadata } from './infiltrator.metadata';

const prompts = [
  'The office kettle has resigned. Write its farewell message.',
  'Invent a terrible excuse for being late to a meeting.',
  'Write a review of the break-room sofa.',
  'Your lunch has disappeared. Leave a note for the culprit.',
  'Give a coworker advice for surviving a very long shift.',
  'Name a ridiculous perk for employee of the month.',
  'The printer is demanding a promotion. Reply to it.',
  'Write a warning label for the last biscuit.',
  'Describe your ideal five-minute break.',
  'A pigeon joins your team. Write its first message.',
  'Write an apology from someone who finished the coffee.',
  'Invent a slogan for a vending machine that never works.'
] as const;
const codeWords = ['efficient','optimal','protocol','capacity','routine','priority','precise','system','process','standard','output','consistent'];
type Phase = 'SUBMISSION'|'DISCUSSION'|'VOTING'|'REVEAL'|'RESULTS';
interface ResponseCard { id:string; text:string; }
export interface InfiltratorResult {
  machine:string; codeWord:string; accused:string|null; voided:boolean; explanation:string;
  authors:Readonly<Record<string,string>>; votes:Readonly<Record<string,string>>; points:Readonly<Record<string,number>>;
}
export interface InfiltratorState {
  phase:Phase; round:number; deck:readonly string[]; participants:readonly string[];
  machine:string; usedMachines:readonly string[]; codeWord:string; timerEndsAt:number;
  responses:Readonly<Record<string,string>>; cards:readonly ResponseCard[]; authors:Readonly<Record<string,string>>;
  votes:Readonly<Record<string,string>>; scores:Readonly<Record<string,number>>; result:InfiltratorResult|null;
}
export interface InfiltratorPublicView {
  phase:Phase; round:number; maxRounds:number; question:string; timerEndsAt:number;
  participants:readonly string[]; submittedPlayerIds:readonly string[]; votedPlayerIds:readonly string[];
  cards:readonly ResponseCard[]; scores:InfiltratorState['scores']; result:InfiltratorResult|null;
}
export interface InfiltratorPlayerView {round:number;role:'HUMAN'|'MACHINE'|null;codeWord:string|null;response:string|null;ownCard:string|null;vote:string|null;}
const connected = (ctx:GameContext) => [...ctx.players.values()].filter(p=>p.connected).map(p=>p.id);
const word = (ctx:GameContext) => codeWords[Math.floor(ctx.random()*codeWords.length)]!;

export const infiltratorDefinition: GameDefinition<InfiltratorState,PlayerAction,InfiltratorPublicView,InfiltratorPlayerView> = {
  metadata:infiltratorMetadata,
  createInitialState(ctx) {
    const participants=connected(ctx), machine=shuffled(participants,ctx.random)[0]??'';
    return {phase:'SUBMISSION',round:1,deck:shuffled(prompts,ctx.random).slice(0,3),participants,machine,usedMachines:[machine],codeWord:word(ctx),timerEndsAt:ctx.now+30_000,responses:{},cards:[],authors:{},votes:{},scores:{},result:null};
  },
  start:(state,ctx)=>connected(ctx).length>=3?{ok:true,state}:reject(state,'need_players','Infiltrator needs at least three players.'),
  handleAction(state,id,action,ctx) {
    if (!ctx.players.get(id)?.connected) return reject(state,'unknown_player','You are not connected.');
    if (action.round!==state.round) return reject(state,'stale_round','That round has moved on.');
    if (action.type==='INFILTRATOR_NEXT') {
      if (id!==ctx.hostPlayerId) return reject(state,'host_only','Only the host can continue.');
      if (state.phase!=='REVEAL') return reject(state,'wrong_phase','Wait for the reveal.');
      const participants=connected(ctx);
      if (state.round===3 || participants.length<3) return {ok:true,state:{...state,phase:'RESULTS'}};
      let usedMachines=state.usedMachines;
      let candidates=participants.filter(p=>!usedMachines.includes(p));
      if (!candidates.length) {usedMachines=[];candidates=participants;}
      const machine=shuffled(candidates,ctx.random)[0]!;
      return {ok:true,state:{...state,phase:'SUBMISSION',round:state.round+1,participants,machine,usedMachines:[...usedMachines,machine],codeWord:word(ctx),timerEndsAt:ctx.now+30_000,responses:{},cards:[],authors:{},votes:{},result:null}};
    }
    if (!['INFILTRATOR_RESPOND','INFILTRATOR_VOTE'].includes(action.type)) return reject(state,'unknown_action','That move does not belong to Infiltrator.');
    if (state.phase==='REVEAL'||state.phase==='RESULTS') return reject(state,'round_ended','This round has ended.');
    const current=tick(state,ctx);
    if (current!==state) return {ok:true,state:current};
    if (!state.participants.includes(id)) return reject(state,'wait_next_round','You join next round.');
    if (action.type==='INFILTRATOR_RESPOND') {
      if (state.phase!=='SUBMISSION') return reject(state,'wrong_phase','The response window has closed.');
      if (state.responses[id]!==undefined) return reject(state,'locked','Your response is locked.');
      const text=typeof action.text==='string'?action.text.trim().replace(/\s+/g,' '):'';
      if (text.length<3||text.length>160) return reject(state,'invalid_response','Write 3–160 characters.');
      if (id===state.machine && !text.toLowerCase().split(/[^a-z]+/).includes(state.codeWord)) return reject(state,'code_word','Include your secret word as a whole word.');
      return {ok:true,state:tick({...state,responses:{...state.responses,[id]:text}},ctx)};
    }
    if (state.phase!=='VOTING') return reject(state,'wrong_phase','Voting is not open yet.');
    if (state.responses[id]===undefined) return reject(state,'no_response','Only players who answered can vote.');
    if (state.votes[id]!==undefined) return reject(state,'locked','Your vote is locked.');
    const target='cardId' in action && typeof action.cardId==='string'?action.cardId:'';
    if (!Object.hasOwn(state.authors,target)||state.authors[target]===id) return reject(state,'invalid_target','Choose another anonymous response.');
    return {ok:true,state:tick({...state,votes:{...state.votes,[id]:target}},ctx)};
  },
  tick:(state,ctx)=>({ok:true,state:tick(state,ctx)}),
  isFinished:state=>state.phase==='RESULTS',
  getPublicView:state=>({phase:state.phase,round:state.round,maxRounds:3,question:state.deck[state.round-1]!,timerEndsAt:state.timerEndsAt,participants:state.participants,submittedPlayerIds:Object.keys(state.responses),votedPlayerIds:Object.keys(state.votes),cards:state.cards,scores:state.scores,result:state.result}),
  getPlayerView:(state,id)=>({round:state.round,role:!state.participants.includes(id)?null:id===state.machine?'MACHINE':'HUMAN',codeWord:id===state.machine?state.codeWord:null,response:state.responses[id]??null,ownCard:Object.keys(state.authors).find(key=>state.authors[key]===id)??null,vote:state.votes[id]??null})
};

function tick(state:InfiltratorState,ctx:GameContext):InfiltratorState {
  if (state.phase==='REVEAL'||state.phase==='RESULTS') return state;
  const active=state.participants.filter(id=>ctx.players.get(id)?.connected);
  if (!ctx.players.has(state.machine)||active.length<3) return reveal(state,'Round void: the machine left or fewer than three players remain connected.');
  let next=state;
  if (next.phase==='SUBMISSION' && (ctx.now>=next.timerEndsAt||active.every(id=>next.responses[id]!==undefined))) {
    if (Object.keys(next.responses).length<3||next.responses[next.machine]===undefined) return reveal(next,'Round void: need at least three responses, including the machine.');
    const authors=Object.fromEntries(shuffled(Object.keys(next.responses),ctx.random).map((id,i)=>[String.fromCharCode(65+i),id]));
    next={...next,phase:'DISCUSSION',timerEndsAt:Math.min(ctx.now,next.timerEndsAt)+20_000,authors,cards:Object.entries(authors).map(([id,author])=>({id,text:next.responses[author]!}))};
  }
  if (next.phase==='DISCUSSION'&&ctx.now>=next.timerEndsAt) next={...next,phase:'VOTING',timerEndsAt:next.timerEndsAt+20_000};
  if (next.phase==='VOTING'&&(ctx.now>=next.timerEndsAt||active.filter(id=>next.responses[id]!==undefined).every(id=>next.votes[id]!==undefined))) return reveal(next,Object.keys(next.votes).length?undefined:'Round void: no votes were submitted.');
  return next;
}
function reveal(state:InfiltratorState,reason?:string):InfiltratorState {
  const counts:Record<string,number>={};
  for(const card of Object.values(state.votes)) counts[card]=(counts[card]??0)+1;
  const highest=Math.max(0,...Object.values(counts));
  const leaders=Object.keys(counts).filter(id=>counts[id]===highest);
  const accused=!reason&&leaders.length===1?state.authors[leaders[0]!]??null:null;
  const points:Record<string,number>={};
  if (!reason) {
    for(const id of Object.keys(state.responses)) points[id]=0;
    if (accused===state.machine) {
      for(const [id,card] of Object.entries(state.votes)) if(id!==state.machine&&state.authors[card]===state.machine) points[id]=100;
    } else points[state.machine]=200;
  }
  const scores={...state.scores};
  for(const [id,score] of Object.entries(points)) scores[id]=(scores[id]??0)+score;
  return {...state,phase:'REVEAL',timerEndsAt:0,scores,result:{machine:state.machine,codeWord:state.codeWord,accused,voided:!!reason,explanation:reason??(accused===state.machine?'Machine detected! Correct human voters earn 100 points.':'Machine undetected! The machine earns 200 points. A tied vote makes no accusation.'),authors:state.authors,votes:state.votes,points}};
}
function reject(state:InfiltratorState,code:string,message:string):GameActionResult<InfiltratorState>{return {ok:false,state,error:{code,message}};}
