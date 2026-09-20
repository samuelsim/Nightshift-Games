import { gameRounds } from '@nightshift/protocol';
import type { GameDefinition, GameActionResult, GameContext } from '@nightshift/game-core';
import type { PlayerAction } from '@nightshift/protocol';
import { humanExeMetadata } from './metadata';
import { freshHand, shuffled } from '@nightshift/game-core';
import { extraChallenges, type HumanChallenge } from './scenarios';

type Challenge = HumanChallenge;
const challenges: readonly Challenge[] = [
  ...extraChallenges,
  { question: 'A coworker spills their coffee. Your first response?', options: ['Offer a napkin and ask if they are okay', 'Calculate the volume lost', 'Announce a liquid containment failure'], human: 0, machine: 1, explanation: 'Our human directive values care. The machine directive values measurement.' },
  { question: 'Pick a break-room welcome sign.', options: ['Occupancy limit: 8 units', 'Glad you made it. Put the kettle on.', 'Input calories here'], human: 1, machine: 0, explanation: 'A welcome offers warmth; a machine reports capacity.' },
  { question: 'Your friend says their day was a disaster.', options: ['Request a timestamped incident log', 'Tell them to restart', 'Ask whether they want advice or just company'], human: 2, machine: 0, explanation: 'Listening comes before solving. The machine starts by collecting structured data.' },
  { question: 'A plant on the desk is wilting. Leave a note.', options: ['Moisture level below operating threshold', 'I gave our leafy coworker a drink', 'Replace organic peripheral'], human: 1, machine: 0, explanation: 'Personality for the human; a measurable status report for the machine.' },
  { question: 'Choose a birthday message.', options: ['Your age counter incremented successfully', 'Wishing you a day full of your favourite things', 'Warranty status unknown'], human: 1, machine: 0, explanation: 'A personal wish beats an age counter, unless you are following machine protocol.' },
  { question: 'Someone brings homemade biscuits.', options: ['Ask for the production yield', 'Scan for manufacturing defects', 'Thank them for thinking of everyone'], human: 2, machine: 0, explanation: 'Recognise the gesture, or measure production if you received the machine directive.' },
  { question: 'Name the team group chat.', options: ['The Midnight Snack Committee', 'Personnel Messaging Endpoint 04', 'Unread: 9,999'], human: 0, machine: 1, explanation: 'Shared humour feels human. A machine prefers an unambiguous system label.' },
  { question: 'The shift is finally over. Say goodbye.', options: ['Session terminated', 'Get home safe. See you tomorrow!', 'Initiating horizontal mode'], human: 1, machine: 0, explanation: 'Care for the person, or report the session state.' }
];
type Role = 'HUMAN' | 'MACHINE';
interface HumanResult { readonly explanation: string; readonly humanAnswer: number; readonly machineAnswer: number;
  readonly choices: readonly { playerId: string; choice: number; role: Role; points: number }[]; }
export interface HumanState {
  readonly difficulty?: string;
  readonly soloPlayerId?: string | null; readonly timerEndsAt?: number;
  readonly soloResult?: {humanChoice:number|null;machineChoice:number|null;correctCount:number;bonus:number;points:number} | null;
  readonly phase: 'CHOICE' | 'REVEAL' | 'RESULTS'; readonly round: number;
  readonly deck: readonly Challenge[]; readonly roles: Readonly<Record<string, Role>>;
  readonly choices: Readonly<Record<string, number>>; readonly scores: Readonly<Record<string, number>>;
  readonly result: HumanResult | null;
}
export interface HumanPublicView { readonly difficulty?: string; readonly phase: HumanState['phase']; readonly round: number; readonly maxRounds: number;
  readonly soloPlayerId?: string | null; readonly timerEndsAt?: number; readonly soloResult?: HumanState['soloResult'];
  readonly question: string; readonly options: readonly string[]; readonly submittedPlayerIds: readonly string[];
  readonly scores: HumanState['scores']; readonly result: HumanResult | null; }
export interface HumanPlayerView { readonly round: number; readonly role: Role | null; readonly choice: number | null; }
export const humanExeDefinition: GameDefinition<HumanState, PlayerAction, HumanPublicView, HumanPlayerView> = {
  metadata: humanExeMetadata,
  replayKey: state=>state.deck[state.round-1]!.question,
  createInitialState(ctx) {
    const count=gameRounds('human-exe',ctx.gameOptions);
    const difficulty=String(ctx.gameOptions?.['difficulty'] ?? 'standard');
    const deck=freshHand(challenges,card=>card.question,ctx.previousContent ?? ctx.previousHumanQuestions ?? [],count,ctx.random);
    const selected = deck.map(card=>{
      const order=shuffled(difficulty==='easy' ? [card.human,card.machine] : card.options.map((_,index)=>index),ctx.random);
      return {...card,options:order.map(index=>card.options[index]!),human:order.indexOf(card.human),machine:order.indexOf(card.machine)};
    });
    return { difficulty, ...soloSetup(ctx),phase: 'CHOICE', round: 1, deck: selected, roles: assignRoles(ctx), choices: {}, scores: {}, result: null };
  },
  start: state => ({ ok: true, state }),
  handleAction(state, id, action, ctx) {
    if (!ctx.players.get(id)?.connected) return reject(state, 'unknown_player', 'You are not connected.');
    if (!('round' in action) || action.round !== state.round) return reject(state, 'stale_round', 'That round has moved on.');
    if (action.type === 'HUMAN_NEXT') {
      if (id !== ctx.hostPlayerId) return reject(state, 'host_only', 'Only the host can continue.');
      if (state.phase !== 'REVEAL') return reject(state, 'wrong_phase', 'Wait for the reveal.');
      return { ok: true, state: state.round === state.deck.length ? { ...state, phase: 'RESULTS' } :
        { ...state, ...soloSetup(ctx),phase: 'CHOICE', round: state.round + 1, roles: assignRoles(ctx), choices: {}, result: null } };
    }
    if (state.soloPlayerId) {
      if (state.phase !== 'CHOICE') return reject(state,'wrong_phase','This round has ended.');
      if (id !== state.soloPlayerId) return reject(state,'wait_next_round','You join next round.');
      if (ctx.now >= (state.timerEndsAt ?? 0)) return {ok:true,state:revealSolo(state,ctx,null,null)};
      if (action.type !== 'HUMAN_SOLO_SUBMIT') return reject(state,'solo_pair','Choose both the human and machine answers.');
      const human='humanChoice' in action ? action.humanChoice : undefined;
      const machine='machineChoice' in action ? action.machineChoice : undefined;
      const optionCount=state.deck[state.round-1]!.options.length;
      if (typeof human!=='number' || typeof machine!=='number' || !Number.isInteger(human) || !Number.isInteger(machine) || human<0 || machine<0 || human>=optionCount || machine>=optionCount || human===machine) return reject(state,'invalid_pair','Choose two different answers.');
      return {ok:true,state:revealSolo(state,ctx,human,machine)};
    }
    if (action.type !== 'HUMAN_CHOOSE') return reject(state, 'unknown_action', 'That move does not belong to Human.exe.');
    if (state.phase !== 'CHOICE') return reject(state, 'wrong_phase', 'This round has ended.');
    if (!state.roles[id]) return reject(state, 'wait_next_round', 'You joined mid-round. Your directive arrives next round.');
    const choice = 'choice' in action ? action.choice : undefined;
    if (typeof choice !== 'number' || !Number.isInteger(choice) || choice < 0 || choice >= state.deck[state.round - 1]!.options.length) return reject(state, 'invalid_choice', 'Choose one of the options.');
    if (state.choices[id] !== undefined) return reject(state, 'already_submitted', 'Your choice is locked.');
    return { ok: true, state: maybeReveal({ ...state, choices: { ...state.choices, [id]: choice } }, ctx) };
  },
  tick: (state, ctx) => ({ ok: true, state: maybeReveal(state, ctx) }),
  isFinished: state => state.phase === 'RESULTS',
  getPublicView(state) { const card = state.deck[state.round - 1]!;
    return { difficulty:state.difficulty ?? 'standard', soloPlayerId:state.soloPlayerId??null,timerEndsAt:state.timerEndsAt??0,soloResult:state.soloResult??null,phase: state.phase, round: state.round, maxRounds: state.deck.length, question: card.question,
      options: card.options, submittedPlayerIds: Object.keys(state.choices), scores: state.scores, result: state.result }; },
  getPlayerView: (state, id) => ({ round: state.round, role: state.roles[id] ?? null, choice: state.choices[id] ?? null })
};
function assignRoles(ctx: GameContext): Record<string, Role> {
  return Object.fromEntries([...ctx.players.values()].filter(p => p.connected).map(p => [p.id, ctx.random() < .5 ? 'HUMAN' : 'MACHINE']));
}
function maybeReveal(state: HumanState, ctx: GameContext): HumanState {
  if (state.phase !== 'CHOICE') return state;
  if (state.soloPlayerId) return ctx.now >= (state.timerEndsAt??0) || !ctx.players.get(state.soloPlayerId)?.connected ? revealSolo(state,ctx,null,null) : state;
  const connected = [...ctx.players.values()].filter(p => p.connected);
  if (!connected.length || connected.some(p => state.roles[p.id] && state.choices[p.id] === undefined)) return state;
  const card = state.deck[state.round - 1]!; const scores = { ...state.scores };
  const choices = Object.entries(state.choices).map(([playerId, choice]) => {
    const role = state.roles[playerId]!;
    const points = choice === (role === 'HUMAN' ? card.human : card.machine) ? 100 : 0;
    scores[playerId] = (scores[playerId] ?? 0) + points;
    return { playerId, choice, role, points };
  });
  return { ...state, phase: 'REVEAL', scores,
    result: { explanation: card.explanation, humanAnswer: card.human, machineAnswer: card.machine, choices } };
}
function soloSetup(ctx:GameContext) {
  const players=[...ctx.players.values()].filter(p=>p.connected);
  return {soloPlayerId:players.length===1?players[0]!.id:null,timerEndsAt:players.length===1?ctx.now+15_000:0,soloResult:null};
}
function revealSolo(state:HumanState,ctx:GameContext,humanChoice:number|null,machineChoice:number|null):HumanState {
  const card=state.deck[state.round-1]!;
  const correctCount=Number(humanChoice===card.human)+Number(machineChoice===card.machine);
  const bonus=correctCount===2?Math.max(0,Math.floor(((state.timerEndsAt??ctx.now)-ctx.now)/1000))*10:0;
  const points=correctCount*100+bonus;
  return {...state,phase:'REVEAL',timerEndsAt:0,soloResult:{humanChoice,machineChoice,correctCount,bonus,points},
    scores:{...state.scores,[state.soloPlayerId!]:(state.scores[state.soloPlayerId!]??0)+points},
    result:{explanation:card.explanation,humanAnswer:card.human,machineAnswer:card.machine,choices:[]}};
}
function reject(state: HumanState, code: string, message: string): GameActionResult<HumanState> { return { ok: false, state, error: { code, message } }; }
