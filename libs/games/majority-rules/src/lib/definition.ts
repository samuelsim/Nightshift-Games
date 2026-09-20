import { freshHand } from '@nightshift/game-core';
import { gameRounds } from '@nightshift/protocol';
import { getConnectedPlayers, shuffled, type GameContext, type GameDefinition, type GameActionResult } from '@nightshift/game-core';
import type { PlayerAction } from '@nightshift/protocol';
import { majorityRulesMetadata } from './metadata';
import { majorityPrompts, type MajorityPrompt } from './content';

export type MajorityChoice = 'A' | 'B';
export type MajorityPrediction = MajorityChoice | 'TIE';
interface Submission { readonly choice: MajorityChoice; readonly prediction: MajorityPrediction; }
export interface MajorityResult {
  readonly counts: Readonly<Record<MajorityChoice, number>>;
  readonly entries: readonly (Submission & { playerId: string; actual: MajorityPrediction | null; points: number })[];
}
export interface MajorityState {
  readonly phase: 'SUBMISSION' | 'REVEAL' | 'RESULTS'; readonly round: number;
  readonly deck: readonly MajorityPrompt[]; readonly participants: readonly string[];
  readonly timerEndsAt: number; readonly submissions: Readonly<Record<string, Submission>>;
  readonly scores: Readonly<Record<string, number>>; readonly result: MajorityResult | null;
}
export interface MajorityPublicView {
  readonly phase: MajorityState['phase']; readonly round: number; readonly maxRounds: number;
  readonly prompt: MajorityPrompt; readonly participants: readonly string[]; readonly timerEndsAt: number;
  readonly submittedPlayerIds: readonly string[]; readonly scores: MajorityState['scores']; readonly result: MajorityResult | null;
}
export interface MajorityPlayerView { readonly round: number; readonly submission: Submission | null; }

export const majorityRulesDefinition: GameDefinition<MajorityState, PlayerAction, MajorityPublicView, MajorityPlayerView> = {
  metadata: majorityRulesMetadata,
  replayKey: state=>state.deck[state.round-1]!.question,
  createInitialState(ctx) {
    return { phase: 'SUBMISSION', round: 1, deck: freshHand(majorityPrompts,card=>card.question,ctx.previousContent ?? [],gameRounds('majority-rules',ctx.gameOptions),ctx.random),
      participants: getConnectedPlayers(ctx.players).map(p => p.id), timerEndsAt: ctx.now + 30_000,
      submissions: {}, scores: {}, result: null };
  },
  start: (state, ctx) => getConnectedPlayers(ctx.players).length >= 2
    ? { ok: true, state } : reject(state, 'need_players', 'Majority Rules needs two players.'),
  handleAction(state, id, action, ctx) {
    if (!ctx.players.get(id)?.connected) return reject(state, 'unknown_player', 'You are not connected.');
    if (!('round' in action) || action.round !== state.round) return reject(state, 'stale_round', 'That round has moved on.');
    if (action.type === 'MAJORITY_NEXT') {
      if (id !== ctx.hostPlayerId) return reject(state, 'host_only', 'Only the host can continue.');
      if (state.phase !== 'REVEAL') return reject(state, 'wrong_phase', 'Wait for the reveal.');
      const participants = getConnectedPlayers(ctx.players).map(p => p.id);
      if (state.round === state.deck.length || participants.length < 2) return { ok: true, state: { ...state, phase: 'RESULTS' } };
      return { ok: true, state: { ...state, phase: 'SUBMISSION', round: state.round + 1,
        participants, timerEndsAt: ctx.now + 30_000, submissions: {}, result: null } };
    }
    if (action.type !== 'MAJORITY_SUBMIT') return reject(state, 'unknown_action', 'That move does not belong to Majority Rules.');
    if (state.phase !== 'SUBMISSION') return reject(state, 'wrong_phase', 'This round has ended.');
    if (ctx.now >= state.timerEndsAt) return { ok: true, state: reveal(state) };
    if (!state.participants.includes(id)) return reject(state, 'wait_next_round', 'You join the next round.');
    if (state.submissions[id]) return reject(state, 'already_submitted', 'Your choices are locked.');
    const choice = 'choice' in action ? action.choice : null;
    const prediction = 'prediction' in action ? action.prediction : null;
    if ((choice !== 'A' && choice !== 'B') || (prediction !== 'A' && prediction !== 'B' && prediction !== 'TIE')) return reject(state, 'invalid_choice', 'Choose an answer and a prediction.');
    if (prediction === 'TIE' && state.participants.length === 2) return reject(state, 'no_duo_tie', 'With two players, predict A or B.');
    return { ok: true, state: tick({ ...state, submissions: { ...state.submissions, [id]: { choice, prediction } } }, ctx) };
  },
  tick: (state, ctx) => ({ ok: true, state: tick(state, ctx) }),
  isFinished: state => state.phase === 'RESULTS',
  getPublicView: state => ({ phase: state.phase, round: state.round, maxRounds: state.deck.length,
    prompt: state.deck[state.round - 1]!, participants: state.participants, timerEndsAt: state.timerEndsAt,
    submittedPlayerIds: Object.keys(state.submissions), scores: state.scores, result: state.result }),
  getPlayerView: (state, id) => ({ round: state.round, submission: state.submissions[id] ?? null })
};
function tick(state: MajorityState, ctx: GameContext): MajorityState {
  if (state.phase !== 'SUBMISSION') return state;
  const waiting = state.participants.filter(id => ctx.players.get(id)?.connected);
  return ctx.now >= state.timerEndsAt || waiting.every(id => state.submissions[id]) ? reveal(state) : state;
}
function reveal(state: MajorityState): MajorityState {
  const counts = { A: 0, B: 0 };
  for (const submission of Object.values(state.submissions)) counts[submission.choice]++;
  const scores = { ...state.scores };
  const entries = Object.entries(state.submissions).map(([playerId, submission]) => {
    const a = counts.A - (submission.choice === 'A' ? 1 : 0);
    const b = counts.B - (submission.choice === 'B' ? 1 : 0);
    const actual: MajorityPrediction | null = a + b === 0 ? null : a === b ? 'TIE' : a > b ? 'A' : 'B';
    const points = actual !== null && actual === submission.prediction ? 100 : 0;
    scores[playerId] = (scores[playerId] ?? 0) + points;
    return { playerId, ...submission, actual, points };
  });
  return { ...state, phase: 'REVEAL', timerEndsAt: 0, scores, result: { counts, entries } };
}
function reject(state: MajorityState, code: string, message: string): GameActionResult<MajorityState> { return { ok: false, state, error: { code, message } }; }
