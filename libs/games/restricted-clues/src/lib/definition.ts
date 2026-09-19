import type { GameContext, GameDefinition, GameActionResult } from '@nightshift/game-core';
import type { PlayerAction } from '@nightshift/protocol';
import { restrictedCluesMetadata } from './metadata';

const cards = [
  ['umbrella', 'rain', 'wet'], ['popcorn', 'cinema', 'corn'], ['pillow', 'sleep', 'bed'],
  ['elevator', 'floor', 'lift'], ['penguin', 'bird', 'ice'], ['toothbrush', 'teeth', 'brush'],
  ['backpack', 'bag', 'school'], ['volcano', 'lava', 'mountain'], ['calendar', 'date', 'month'],
  ['headphones', 'music', 'ears'], ['lighthouse', 'ship', 'light'], ['snowman', 'snow', 'winter'],
  ['sandwich', 'bread', 'lunch'], ['telescope', 'stars', 'space'], ['microwave', 'food', 'heat'],
  ['suitcase', 'travel', 'luggage'], ['cactus', 'desert', 'spikes'], ['hammock', 'swing', 'sleep'],
  ['octopus', 'eight', 'tentacles'], ['waterfall', 'river', 'water']
] as const;
type Card = readonly [string, string, string];
export interface CluesState {
  readonly phase: 'CLUES' | 'REVEAL' | 'RESULTS';
  readonly round: number;
  readonly deck: readonly Card[];
  readonly order: readonly string[];
  readonly giver: string;
  readonly timerEndsAt: number;
  readonly clues: readonly string[];
  readonly guesses: readonly { playerId: string; text: string }[];
  readonly scores: Readonly<Record<string, number>>;
  readonly outcome: string;
  readonly lastGuessAt: Readonly<Record<string, number>>;
}
export interface CluesPublicView {
  readonly phase: CluesState['phase']; readonly round: number; readonly maxRounds: number;
  readonly giver: string; readonly timerEndsAt: number; readonly clues: CluesState['clues'];
  readonly guesses: CluesState['guesses']; readonly scores: CluesState['scores'];
  readonly answer: string | null; readonly outcome: string;
}
export interface CluesPlayerView { readonly round: number; readonly word: string | null; readonly forbidden: readonly string[]; }

export const restrictedCluesDefinition: GameDefinition<CluesState, PlayerAction, CluesPublicView, CluesPlayerView> = {
  metadata: restrictedCluesMetadata,
  createInitialState(ctx) {
    const deck: Card[] = [...cards];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(ctx.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j]!, deck[i]!];
    }
    const order = [...ctx.players.values()].filter(p => p.connected).map(p => p.id);
    return { phase: 'CLUES', round: 1, deck: deck.slice(0, 4), order, giver: order[0] ?? '',
      timerEndsAt: ctx.now + 60_000, clues: [], guesses: [], scores: {}, outcome: '', lastGuessAt: {} };
  },
  start(state, ctx) {
    return [...ctx.players.values()].filter(p => p.connected).length >= 2
      ? { ok: true, state } : reject(state, 'need_players', 'Restricted Clues needs at least two players.');
  },
  handleAction(state, id, action, ctx) {
    if (!ctx.players.get(id)?.connected) return reject(state, 'unknown_player', 'You are not connected.');
    if (!('round' in action) || action.round !== state.round) return reject(state, 'stale_round', 'That round has moved on.');
    if (action.type === 'CLUES_NEXT') {
      if (id !== ctx.hostPlayerId) return reject(state, 'host_only', 'Only the host can continue.');
      if (state.phase !== 'REVEAL') return reject(state, 'wrong_phase', 'Wait for the reveal.');
      if (state.round >= state.deck.length) return { ok: true, state: { ...state, phase: 'RESULTS' } };
      const connected = [...ctx.players.values()].filter(p => p.connected).map(p => p.id);
      if (connected.length < 2) return { ok: true, state: { ...state, phase: 'RESULTS', outcome: 'Not enough players to continue.' } };
      const order = [...state.order.filter(p => connected.includes(p)), ...connected.filter(p => !state.order.includes(p))];
      return { ok: true, state: { ...state, phase: 'CLUES', round: state.round + 1,
        order, giver: order[state.round % order.length]!, timerEndsAt: ctx.now + 60_000,
        clues: [], guesses: [], lastGuessAt: {}, outcome: '' } };
    }
    if (state.phase !== 'CLUES') return reject(state, 'wrong_phase', 'This round has ended.');
    if (ctx.now >= state.timerEndsAt) return { ok: true, state: reveal(state, 'Time is up!') };
    const text = 'text' in action && typeof action.text === 'string' ? action.text.trim().toLowerCase() : '';
    if (action.type === 'CLUES_GIVE') {
      if (id !== state.giver) return reject(state, 'giver_only', 'Only the clue giver can send clues.');
      if (!/^[a-z]{2,24}$/.test(text)) return reject(state, 'one_word', 'Use one word of 2–24 letters.');
      if (state.deck[state.round - 1]!.some(word => text.includes(word) || word.includes(text))) {
        return reject(state, 'forbidden_word', 'That clue contains the answer or a forbidden word. Try another.');
      }
      if (state.clues.includes(text) || state.clues.length >= 6) return reject(state, 'clue_limit', 'Use a new clue. Six clues maximum.');
      return { ok: true, state: { ...state, clues: [...state.clues, text] } };
    }
    if (action.type === 'CLUES_GUESS') {
      if (id === state.giver) return reject(state, 'guessers_only', 'The clue giver cannot guess.');
      if (!/^[a-z]{2,24}$/.test(text)) return reject(state, 'invalid_guess', 'Guess one word of 2–24 letters.');
      if (ctx.now - (state.lastGuessAt[id] ?? -Infinity) < 750) return reject(state, 'too_fast', 'Give that guess a moment.');
      const next = { ...state, guesses: [...state.guesses, { playerId: id, text }].slice(-12),
        lastGuessAt: { ...state.lastGuessAt, [id]: ctx.now } };
      if (text !== state.deck[state.round - 1]![0]) return { ok: true, state: next };
      return { ok: true, state: reveal({ ...next, scores: { ...state.scores,
        [id]: (state.scores[id] ?? 0) + 100, [state.giver]: (state.scores[state.giver] ?? 0) + 100 } }, 'Cracked it! Guesser and clue giver earn 100 points.') };
    }
    return reject(state, 'unknown_action', 'That move does not belong to Restricted Clues.');
  },
  tick(state, ctx) {
    if (state.phase !== 'CLUES') return { ok: true, state };
    if (ctx.now >= state.timerEndsAt) return { ok: true, state: reveal(state, 'Time is up!') };
    if (!ctx.players.get(state.giver)?.connected) return { ok: true, state: reveal(state, 'The clue giver disconnected. Round skipped.') };
    if ([...ctx.players.values()].filter(p => p.connected).length < 2) return { ok: true, state: reveal(state, 'Waiting for more players. Round skipped.') };
    return { ok: true, state };
  },
  isFinished: state => state.phase === 'RESULTS',
  getPublicView: state => ({ phase: state.phase, round: state.round, maxRounds: state.deck.length,
    giver: state.giver, timerEndsAt: state.timerEndsAt, clues: state.clues, guesses: state.guesses,
    scores: state.scores, answer: state.phase === 'CLUES' ? null : state.deck[state.round - 1]![0], outcome: state.outcome }),
  getPlayerView: (state, id) => ({ round: state.round,
    word: id === state.giver ? state.deck[state.round - 1]![0] : null,
    forbidden: id === state.giver ? state.deck[state.round - 1]!.slice(1) : [] })
};
function reveal(state: CluesState, outcome: string): CluesState { return { ...state, phase: 'REVEAL', timerEndsAt: 0, outcome }; }
function reject(state: CluesState, code: string, message: string): GameActionResult<CluesState> { return { ok: false, state, error: { code, message } }; }
