import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { GameContext } from '@nightshift/game-core';
import { majorityRulesDefinition as game } from './definition';
import { majorityPrompts } from './content';

function context(count = 3, now = 1000): GameContext {
  return { now, random: () => .4, hostPlayerId: 'p0', players: new Map(Array.from({ length: count }, (_, i) => {
    const id = `p${i}`; return [id, { id, nickname: id, avatarId: 'moon', connected: true, ready: true, host: i === 0, score: 0, joinedAt: i, lastSeenAt: now }];
  })) };
}
describe('Majority Rules', () => {
  it('uses five distinct prompts from thirty and requires at least two players', () => {
    const ctx = context(); const state = game.createInitialState(ctx);
    assert.equal(majorityPrompts.length, 30); assert.equal(new Set(state.deck.map(p => p.question)).size, 5);
    assert.equal(game.start(state, context(1)).ok, false);
  });
  it('keeps submissions private and excludes your own answer when scoring', () => {
    const ctx = context(); let state = game.createInitialState(ctx);
    state = game.handleAction(state, 'p0', { type: 'MAJORITY_SUBMIT', round: 1, choice: 'A', prediction: 'TIE' }, ctx).state;
    assert.equal(game.getPublicView(state, ctx).result, null);
    assert.equal('submissions' in game.getPublicView(state, ctx), false);
    assert.equal(game.getPlayerView(state, 'p1', ctx).submission, null);
    assert.equal(game.getPlayerView(state, 'p0', ctx).submission?.prediction, 'TIE');
    state = game.handleAction(state, 'p1', { type: 'MAJORITY_SUBMIT', round: 1, choice: 'A', prediction: 'TIE' }, ctx).state;
    state = game.handleAction(state, 'p2', { type: 'MAJORITY_SUBMIT', round: 1, choice: 'B', prediction: 'A' }, ctx).state;
    assert.equal(state.phase, 'REVEAL'); assert.deepEqual(state.result?.counts, { A: 2, B: 1 });
    assert.deepEqual(state.scores, { p0: 100, p1: 100, p2: 100 });
    assert.equal(game.tick!(state, ctx).state, state);
  });
  it('plays five duo rounds, rejects tie predictions and restricts advance to host', () => {
    const ctx = context(2); let state = game.createInitialState(ctx);
    assert.equal(game.handleAction(state, 'p0', { type: 'MAJORITY_SUBMIT', round: 1, choice: 'A', prediction: 'TIE' }, ctx).ok, false);
    for (let round = 1; round <= 5; round++) {
      state = game.handleAction(state, 'p0', { type: 'MAJORITY_SUBMIT', round, choice: 'A', prediction: 'B' }, ctx).state;
      state = game.handleAction(state, 'p1', { type: 'MAJORITY_SUBMIT', round, choice: 'B', prediction: 'A' }, ctx).state;
      assert.equal(game.handleAction(state, 'p1', { type: 'MAJORITY_NEXT', round }, ctx).ok, false);
      state = game.handleAction(state, 'p0', { type: 'MAJORITY_NEXT', round }, ctx).state;
    }
    assert.ok(game.isFinished(state)); assert.deepEqual(state.scores, { p0: 500, p1: 500 });
  });
  it('rejects invalid, stale, duplicate and late-join submissions', () => {
    const ctx = context(2); const state = game.createInitialState(ctx);
    for (const action of [{ type: 'MAJORITY_SUBMIT', round: 1, choice: 'C', prediction: 'A' },
      { type: 'MAJORITY_SUBMIT', round: 9, choice: 'A', prediction: 'A' }, { type: 'MAJORITY_NEXT', round: 1 }]) {
      assert.equal(game.handleAction(state, 'p0', action, ctx).ok, false);
    }
    const action = { type: 'MAJORITY_SUBMIT', round: 1, choice: 'A', prediction: 'B' } as const;
    assert.equal(game.handleAction(state, 'p2', action, context(3)).ok, false);
    const first = game.handleAction(state, 'p0', action, ctx).state;
    assert.equal(game.handleAction(first, 'p0', action, ctx).ok, false);
  });
  it('times out without inventing votes and skips missing players', () => {
    const ctx = context(2); const initial = game.createInitialState(ctx);
    assert.equal(game.tick!(initial, ctx).state, initial);
    const first = game.handleAction(initial, 'p0', { type: 'MAJORITY_SUBMIT', round: 1, choice: 'A', prediction: 'B' }, ctx).state;
    const expired = game.tick!(first, context(2, first.timerEndsAt)).state;
    assert.equal(expired.result?.entries[0]?.actual, null); assert.equal(expired.scores['p0'], 0);
    const late = game.handleAction(first, 'p1', { type: 'MAJORITY_SUBMIT', round: 1, choice: 'B', prediction: 'A' }, context(2, first.timerEndsAt));
    assert.equal(late.state.result?.entries.length, 1);
    const disconnected = game.tick!(first, context(1)).state;
    assert.equal(disconnected.phase, 'REVEAL');
    assert.equal(game.handleAction(disconnected, 'p0', { type: 'MAJORITY_NEXT', round: 1 }, context(1)).state.phase, 'RESULTS');
    assert.deepEqual(game.tick!(initial, context(2, initial.timerEndsAt)).state.result?.counts, {A:0,B:0});
  });
});
