import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { GameContext } from '@nightshift/game-core';
import { restrictedCluesDefinition as game } from './definition';

function context(now = 1000): GameContext {
  return { now, random: () => .4, hostPlayerId: 'a', players: new Map(['a', 'b'].map(id => [id, {
    id, nickname: id, avatarId: 'moon', connected: true, ready: true, host: id === 'a', score: 0, joinedAt: 0, lastSeenAt: 0
  }])) };
}
describe('Restricted Clues', () => {
  it('only sends the secret and forbidden words to the clue giver', () => {
    const ctx = context(); const state = game.createInitialState(ctx);
    assert.equal(game.getPublicView(state, ctx).answer, null);
    assert.equal('deck' in game.getPublicView(state, ctx), false);
    assert.ok(game.getPlayerView(state, 'a', ctx).word);
    assert.deepEqual(game.getPlayerView(state, 'b', ctx), { round: 1, word: null, forbidden: [] });
  });
  it('enforces ownership, restricted clues, stale actions, and guess throttling', () => {
    const ctx = context(); const state = game.createInitialState(ctx);
    for (const text of [state.deck[0]![0], state.deck[0]![1], 'two words', '', '123']) {
      assert.equal(game.handleAction(state, 'a', { type: 'CLUES_GIVE', round: 1, text }, ctx).ok, false);
    }
    assert.equal(game.handleAction(state, 'b', { type: 'CLUES_GIVE', round: 1, text: 'mysterious' }, ctx).ok, false);
    assert.equal(game.handleAction(state, 'a', { type: 'CLUES_GUESS', round: 1, text: state.deck[0]![0] }, ctx).ok, false);
    assert.equal(game.handleAction(state, 'b', { type: 'CLUES_GUESS', round: 9, text: 'wrong' }, ctx).ok, false);
    const wrong = game.handleAction(state, 'b', { type: 'CLUES_GUESS', round: 1, text: 'wrong' }, ctx).state;
    assert.equal(game.handleAction(wrong, 'b', { type: 'CLUES_GUESS', round: 1, text: 'again' }, ctx).ok, false);
  });
  it('plays four rotating rounds and awards both giver and guesser exactly once', () => {
    const ctx = context(); let state = game.start(game.createInitialState(ctx), ctx).state;
    for (let round = 1; round <= 4; round++) {
      const guesser = state.giver === 'a' ? 'b' : 'a';
      const result = game.handleAction(state, guesser, { type: 'CLUES_GUESS', round, text: state.deck[round - 1]![0] }, ctx);
      assert.ok(result.ok); assert.equal(result.state.phase, 'REVEAL');
      assert.equal(result.state.scores['a'], round * 100);
      assert.equal(result.state.scores['b'], round * 100);
      assert.equal(game.handleAction(result.state, guesser, { type: 'CLUES_GUESS', round, text: 'repeat' }, ctx).ok, false);
      assert.equal(game.handleAction(result.state, 'b', { type: 'CLUES_NEXT', round }, ctx).ok, false);
      state = game.handleAction(result.state, 'a', { type: 'CLUES_NEXT', round }, ctx).state;
    }
    assert.ok(game.isFinished(state));
  });
  it('times out on tick or at the action boundary and handles giver disconnect', () => {
    const ctx = context(); const state = game.createInitialState(ctx);
    assert.equal(game.tick!(state, ctx).state, state);
    assert.equal(game.tick!(state, context(state.timerEndsAt)).state.phase, 'REVEAL');
    const late = game.handleAction(state, 'b', { type: 'CLUES_GUESS', round: 1, text: state.deck[0]![0] }, context(state.timerEndsAt));
    assert.equal(late.state.phase, 'REVEAL'); assert.deepEqual(late.state.scores, {});
    const disconnected = { ...ctx, players: new Map([...ctx.players].map(([id,p]) => [id, {...p, connected: id !== 'a'}])) };
    assert.equal(game.tick!(state, disconnected).state.phase, 'REVEAL');
    assert.equal(game.start(state, disconnected).ok, false);
  });
});
