import { gameRounds } from '@nightshift/protocol';
import { estimateMetadata } from './metadata';
import type { GameActionResult, GameContext, GameDefinition } from '@nightshift/game-core';
import type { PlayerAction } from '@nightshift/protocol';
import { createPrompts } from './estimate.prompts';
import { createFactPrompts } from './estimate.facts';
import { dailyIdentity, dailyRandom } from './estimate.daily';
import type { EstimatePlayerView, EstimatePublicView, EstimateState } from './estimate.types';

export const estimateDefinition: GameDefinition<EstimateState, PlayerAction, EstimatePublicView, EstimatePlayerView> = {
  metadata: estimateMetadata,
  createInitialState(context) {
    const deck = context.estimateOptions?.deck ?? 'generated';
    const difficulty = context.estimateOptions?.difficulty ?? 'standard';
    const dailyId = context.estimateOptions?.daily ? dailyIdentity(context.now) : '';
    const random = dailyId ? dailyRandom(dailyId, deck, difficulty) : context.random;
    const count = dailyId ? 5 : gameRounds('estimate',context.gameOptions);
    const previous = dailyId ? [] : context.previousEstimateQuestions ?? [];
    return { deck, difficulty, dailyId, phase: 'SUBMISSION', round: 1, timerEndsAt: context.now + 30_000,
      prompts: deck === 'generated' ? createPrompts(random, difficulty, previous, count) : createFactPrompts(random, difficulty, deck, previous, count),
      submissions: {}, scores: dailyId ? Object.fromEntries([...context.players.values()].filter(p=>p.connected).map(p=>[p.id,0])) : {}, streaks: {}, history: [] };
  },
  start: (state) => ({ ok: true, state }),
  handleAction(state, playerId, action, context) {
    if (!context.players.get(playerId)?.connected) return reject(state, 'unknown_player', 'You are not connected to this room.');
    // Round identity prevents a delayed/replayed action from entering a subsequent round.
    if (!('round' in action) || action.round !== state.round) return reject(state, 'stale_round', 'That round has already moved on.');
    if (action.type === 'ESTIMATE_NEXT_ROUND') {
      if (playerId !== context.hostPlayerId) return reject(state, 'host_only', 'Only the host can advance the round.');
      if (state.phase !== 'REVEAL') return reject(state, 'not_revealed', 'Wait for the reveal first.');
      return { ok: true, state: { ...state, submissions: {},
        timerEndsAt: state.round === state.prompts.length ? 0 : context.now + 30_000,
        phase: state.round === state.prompts.length ? 'RESULTS' : 'SUBMISSION',
        round: Math.min(state.round + 1, state.prompts.length) } };
    }
    if (action.type !== 'ESTIMATE_SUBMIT') return reject(state, 'unknown_action', 'That move does not belong to Estimate.');
    if (state.phase !== 'SUBMISSION') return reject(state, 'not_accepting', 'This round is not taking estimates.');
    if (context.now >= state.timerEndsAt) return { ok: true, state: maybeReveal(state, context) };
    const value = 'value' in action ? action.value : undefined;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1_000_000_000) {
      return reject(state, 'invalid_estimate', 'Enter a number from 0 to 1,000,000,000.');
    }
    if (state.submissions[playerId] !== undefined) return reject(state, 'already_submitted', 'Your estimate is already locked in.');
    return { ok: true, state: maybeReveal({ ...state, submissions: { ...state.submissions, [playerId]: value } }, context) };
  },
  tick: (state, context) => ({ ok: true, state: maybeReveal(state, context) }),
  isFinished: (state) => state.phase === 'RESULTS',
  getPublicView(state) {
    const { question, unit, convention, art, artMeasure } = state.prompts[state.round - 1]!;
    return { deck: state.deck, difficulty: state.difficulty, dailyId: state.dailyId, phase: state.phase, round: state.round, maxRounds: state.prompts.length, timerEndsAt: state.timerEndsAt,
      prompt: { question, unit, ...(convention ? { convention } : {}), ...(art ? { art } : {}), ...(artMeasure ? { artMeasure } : {}) }, submittedPlayerIds: Object.keys(state.submissions), scores: state.scores,
      latestResult: state.history.at(-1) ?? null, history: state.history };
  },
  getPlayerView: (state, playerId) => ({ round: state.round, submittedValue: state.submissions[playerId] ?? null })
};

export function scoreEstimate(value: number, answer: number) {
  const errorPercent = Math.abs(value - answer) / answer * 100;
  const basePoints = Math.max(0, Math.round(1000 * (1 - errorPercent / 100)));
  const grade = errorPercent <= 1 ? 'Bullseye' : errorPercent <= 10 ? 'Very close' : errorPercent <= 25 ? 'In the ballpark' : 'Wild guess';
  return { errorPercent, basePoints, grade };
}

function maybeReveal(state: EstimateState, context: GameContext): EstimateState {
  if (state.phase !== 'SUBMISSION') return state;
  const connected = [...context.players.values()].filter((p) => p.connected);
  if (context.now < state.timerEndsAt && (Object.keys(state.submissions).length === 0 || connected.length === 0 || connected.some((p) => state.submissions[p.id] === undefined))) return state;
  const prompt = state.prompts[state.round - 1]!;
  const scores = { ...state.scores };
  if (state.dailyId) for (const player of connected) scores[player.id] ??= 0;
  const streaks = { ...state.streaks };
  // Missing a round breaks a streak; already locked guesses still count after disconnect.
  for (const id of Object.keys(streaks)) if (state.submissions[id] === undefined) streaks[id] = 0;
  const guesses = Object.entries(state.submissions).map(([playerId, value]) => {
    const { errorPercent, basePoints, grade } = scoreEstimate(value, prompt.answer);
    const streak = errorPercent <= 10 ? (streaks[playerId] ?? 0) + 1 : 0;
    const points = basePoints + Math.min(3, Math.max(0, streak - 1)) * 100;
    scores[playerId] = (scores[playerId] ?? 0) + points;
    streaks[playerId] = streak;
    return { playerId, value, errorPercent, grade, points, streak };
  });
  const closest = Math.min(...guesses.map((g) => Math.abs(g.value - prompt.answer)));
  const winners = guesses.filter((g) => Math.abs(g.value - prompt.answer) === closest).map((g) => g.playerId);
  return { ...state, phase: 'REVEAL', timerEndsAt: 0, scores, streaks,
    history: [...state.history, { round: state.round, prompt, guesses, winners }] };
}

function reject(state: EstimateState, code: string, message: string): GameActionResult<EstimateState> {
  return { ok: false, state, error: { code, message } };
}

