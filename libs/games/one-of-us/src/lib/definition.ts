import { getConnectedPlayers, shuffled, type GameContext, type GameDefinition, type GameActionResult } from '@nightshift/game-core';
import type { PlayerAction } from '@nightshift/protocol';
import { oneOfUsMetadata } from './metadata';
import { wordCards, type WordCard } from './content';

type Phase = 'CLUES' | 'DISCUSSION' | 'VOTING' | 'REVEAL' | 'RESULTS';
interface DiscussionMessage { readonly playerId: string; readonly text: string; }
export interface OneOfUsResult {
  readonly word: string; readonly bluffer: string; readonly accused: string | null;
  readonly votes: Readonly<Record<string, string>>; readonly points: Readonly<Record<string, number>>;
  readonly voided: boolean; readonly explanation: string;
}
export interface OneOfUsState {
  readonly phase: Phase; readonly round: number; readonly deck: readonly WordCard[];
  readonly participants: readonly string[]; readonly bluffer: string; readonly usedBluffers: readonly string[];
  readonly timerEndsAt: number; readonly clues: Readonly<Record<string, string>>;
  readonly discussion: readonly DiscussionMessage[]; readonly messageCounts: Readonly<Record<string, number>>;
  readonly lastMessageAt: Readonly<Record<string, number>>; readonly votes: Readonly<Record<string, string>>;
  readonly scores: Readonly<Record<string, number>>; readonly result: OneOfUsResult | null;
}
export interface OneOfUsPublicView {
  readonly phase: Phase; readonly round: number; readonly maxRounds: number; readonly category: string;
  readonly participants: readonly string[]; readonly timerEndsAt: number; readonly submittedPlayerIds: readonly string[];
  readonly clues: OneOfUsState['clues']; readonly discussion: OneOfUsState['discussion'];
  readonly votedPlayerIds: readonly string[]; readonly scores: OneOfUsState['scores']; readonly result: OneOfUsResult | null;
}
export interface OneOfUsPlayerView {
  readonly round: number; readonly role: 'BLUFFER' | 'INFORMED' | null; readonly word: string | null;
  readonly clue: string | null; readonly vote: string | null; readonly messagesRemaining: number;
}
export const oneOfUsDefinition: GameDefinition<OneOfUsState, PlayerAction, OneOfUsPublicView, OneOfUsPlayerView> = {
  metadata: oneOfUsMetadata,
  createInitialState(ctx) {
    const participants = getConnectedPlayers(ctx.players).map(p => p.id);
    const bluffer = shuffled(participants, ctx.random)[0] ?? '';
    return { phase: 'CLUES', round: 1, deck: shuffled(wordCards, ctx.random).slice(0, 3), participants,
      bluffer, usedBluffers: [bluffer], timerEndsAt: ctx.now + 30_000, clues: {}, discussion: [],
      messageCounts: {}, lastMessageAt: {}, votes: {}, scores: {}, result: null };
  },
  start: (state, ctx) => getConnectedPlayers(ctx.players).length >= 3
    ? { ok: true, state } : reject(state, 'need_players', 'One of Us Is Lying needs three players.'),
  handleAction(state, id, action, ctx) {
    if (!ctx.players.get(id)?.connected) return reject(state, 'unknown_player', 'You are not connected.');
    if (!('round' in action) || action.round !== state.round) return reject(state, 'stale_round', 'That round has moved on.');
    if (action.type === 'LYING_NEXT') return nextRound(state, id, ctx);
    if (!['LYING_CLUE', 'LYING_DISCUSS', 'LYING_VOTE'].includes(action.type)) return reject(state, 'unknown_action', 'That move does not belong to this game.');
    if (state.phase === 'REVEAL' || state.phase === 'RESULTS') return reject(state, 'round_ended', 'This round has ended.');
    const current = tick(state, ctx);
    // Expired intentions never cross into the next phase.
    if (current.phase !== state.phase) return { ok: true, state: current };
    if (!state.participants.includes(id)) return reject(state, 'wait_next_round', 'You join the next round.');
    if (action.type === 'LYING_CLUE') {
      if (state.phase !== 'CLUES') return reject(state, 'wrong_phase', 'The clue window has closed.');
      if (state.clues[id] !== undefined) return reject(state, 'already_submitted', 'Your clue is locked.');
      const text = actionText(action).toLowerCase().replace(/\s+/g, ' ');
      if (text.length > 60 || !/^[a-z]+(?: [a-z]+){0,2}$/.test(text)) return reject(state, 'invalid_clue', 'Use one to three words, letters only, up to 60 characters.');
      if (text.replace(/ /g, '').includes(state.deck[state.round - 1]!.word)) return reject(state, 'answer_in_clue', 'Your clue cannot contain the secret word.');
      return { ok: true, state: tick({ ...state, clues: { ...state.clues, [id]: text } }, ctx) };
    }
    if (action.type === 'LYING_DISCUSS') {
      if (state.phase !== 'DISCUSSION') return reject(state, 'wrong_phase', 'Discussion is not open.');
      const text = actionText(action);
      if (!text || text.length > 160) return reject(state, 'invalid_message', 'Use 1–160 characters.');
      if ((state.messageCounts[id] ?? 0) >= 4) return reject(state, 'message_limit', 'Four messages per discussion.');
      if (ctx.now - (state.lastMessageAt[id] ?? -Infinity) < 1000) return reject(state, 'too_fast', 'Wait a second between messages.');
      return { ok: true, state: { ...state, discussion: [...state.discussion, { playerId: id, text }].slice(-32),
        messageCounts: { ...state.messageCounts, [id]: (state.messageCounts[id] ?? 0) + 1 },
        lastMessageAt: { ...state.lastMessageAt, [id]: ctx.now } } };
    }
    if (state.phase !== 'VOTING') return reject(state, 'wrong_phase', 'Voting is not open.');
    if (state.votes[id] !== undefined) return reject(state, 'already_voted', 'Your vote is locked.');
    const target = 'targetPlayerId' in action ? action.targetPlayerId : null;
    if (typeof target !== 'string' || target === id || !state.participants.includes(target)) return reject(state, 'invalid_target', 'Vote for another participant.');
    return { ok: true, state: tick({ ...state, votes: { ...state.votes, [id]: target } }, ctx) };
  },
  tick: (state, ctx) => ({ ok: true, state: tick(state, ctx) }),
  isFinished: state => state.phase === 'RESULTS',
  getPublicView: state => ({ phase: state.phase, round: state.round, maxRounds: state.deck.length,
    category: state.deck[state.round - 1]!.category, participants: state.participants, timerEndsAt: state.timerEndsAt,
    submittedPlayerIds: Object.keys(state.clues), clues: state.phase === 'CLUES' ? {} : state.clues,
    discussion: state.discussion, votedPlayerIds: Object.keys(state.votes), scores: state.scores, result: state.result }),
  getPlayerView: (state, id) => ({ round: state.round,
    role: !state.participants.includes(id) ? null : id === state.bluffer ? 'BLUFFER' : 'INFORMED',
    word: state.participants.includes(id) && id !== state.bluffer ? state.deck[state.round - 1]!.word : null,
    clue: state.clues[id] ?? null, vote: state.votes[id] ?? null, messagesRemaining: Math.max(0, 4 - (state.messageCounts[id] ?? 0)) })
};

function nextRound(state: OneOfUsState, id: string, ctx: GameContext): GameActionResult<OneOfUsState> {
  if (id !== ctx.hostPlayerId) return reject(state, 'host_only', 'Only the host can continue.');
  if (state.phase !== 'REVEAL') return reject(state, 'wrong_phase', 'Wait for the reveal.');
  const participants = getConnectedPlayers(ctx.players).map(p => p.id);
  if (state.round === state.deck.length || participants.length < 3) return { ok: true, state: { ...state, phase: 'RESULTS' } };
  let usedBluffers = state.usedBluffers;
  let candidates = participants.filter(p => !usedBluffers.includes(p));
  if (!candidates.length) { usedBluffers = []; candidates = participants; }
  const bluffer = shuffled(candidates, ctx.random)[0]!;
  return { ok: true, state: { ...state, phase: 'CLUES', round: state.round + 1, participants, bluffer,
    usedBluffers: [...usedBluffers, bluffer], timerEndsAt: ctx.now + 30_000, clues: {}, discussion: [],
    messageCounts: {}, lastMessageAt: {}, votes: {}, result: null } };
}
function tick(state: OneOfUsState, ctx: GameContext): OneOfUsState {
  if (state.phase === 'REVEAL' || state.phase === 'RESULTS') return state;
  const connected = state.participants.filter(id => ctx.players.get(id)?.connected);
  if (!ctx.players.has(state.bluffer) || connected.length < 3) return reveal(state, 'Round void: the bluffer left or fewer than three participants remain connected.');
  let next = state;
  if (next.phase === 'CLUES' && (ctx.now >= next.timerEndsAt || connected.every(id => next.clues[id] !== undefined))) {
    const boundary = Math.min(ctx.now, next.timerEndsAt);
    next = { ...next, phase: 'DISCUSSION', timerEndsAt: boundary + 30_000 };
  }
  if (next.phase === 'DISCUSSION' && ctx.now >= next.timerEndsAt) next = { ...next, phase: 'VOTING', timerEndsAt: next.timerEndsAt + 20_000 };
  if (next.phase === 'VOTING' && (ctx.now >= next.timerEndsAt || connected.every(id => next.votes[id] !== undefined))) return reveal(next);
  return next;
}
function reveal(state: OneOfUsState, voidReason?: string): OneOfUsState {
  const counts = new Map<string, number>();
  for (const target of Object.values(state.votes)) counts.set(target, (counts.get(target) ?? 0) + 1);
  const max = Math.max(0, ...counts.values());
  const leaders = [...counts].filter(([, count]) => count === max).map(([id]) => id);
  const accused = !voidReason && leaders.length === 1 ? leaders[0]! : null;
  const points: Record<string, number> = {};
  if (!voidReason) {
    if (accused === state.bluffer) {
      for (const [id, target] of Object.entries(state.votes)) if (id !== state.bluffer && target === state.bluffer) points[id] = 100;
    } else points[state.bluffer] = 200;
  }
  const scores = { ...state.scores };
  for (const [id, awarded] of Object.entries(points)) scores[id] = (scores[id] ?? 0) + awarded;
  return { ...state, phase: 'REVEAL', timerEndsAt: 0, scores, result: {
    word: state.deck[state.round - 1]!.word, bluffer: state.bluffer, accused, votes: state.votes, points,
    voided: !!voidReason, explanation: voidReason ?? (accused === state.bluffer ? 'Caught! Correct voters earn 100 points.' : 'The bluffer escaped and earns 200 points. A tie or no votes means no accusation.')
  } };
}
function actionText(action: PlayerAction): string { return 'text' in action && typeof action.text === 'string' ? action.text.trim() : ''; }
function reject(state: OneOfUsState, code: string, message: string): GameActionResult<OneOfUsState> { return { ok: false, state, error: { code, message } }; }
