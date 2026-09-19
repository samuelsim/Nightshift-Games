import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { GameActionResult, GameContext, GameRejected } from '@nightshift/game-core';
import type { Player } from '@nightshift/protocol';
import { createPickNumberState, pickNumberDefinition } from './pick-number.definition';

const samuel: Player = {
  id: 'p1',
  nickname: 'Samuel',
  avatarId: 'moon',
  connected: true,
  ready: true,
  host: true,
  score: 0,
  joinedAt: 1,
  lastSeenAt: 1
};

const alice: Player = {
  id: 'p2',
  nickname: 'Alice',
  avatarId: 'spark',
  connected: true,
  ready: true,
  host: false,
  score: 0,
  joinedAt: 2,
  lastSeenAt: 2
};

function context(players: readonly Player[] = [samuel, alice], random = () => 0.4): GameContext {
  return {
    players: new Map(players.map((player) => [player.id, player])),
    now: 10,
    random,
    hostPlayerId: 'p1'
  };
}

function assertRejected<TState>(result: GameActionResult<TState>): asserts result is GameRejected<TState> {
  assert.equal(result.ok, false);
}

describe('Pick a Number', () => {
  it('runs a secret three-guess hunt and switches to multiplayer next round after a join',()=>{
    const ctx=context([samuel]); let state=createPickNumberState(ctx);
    const view=pickNumberDefinition.getPublicView(state,ctx);
    assert.equal(view.target,null); assert.equal('target' in view.solo!,false);
    assert.equal(view.timerEndsAt,20_010);
    state=pickNumberDefinition.handleAction(state,'p1',{type:'PICK_NUMBER_SUBMIT',round:1,value:2},ctx).state;
    assert.equal(state.solo?.attempts[0]?.hint,'Go higher'); assert.equal(state.phase,'SUBMISSION');
    assert.equal(pickNumberDefinition.tick!(state,ctx).state,state);
    assert.equal(pickNumberDefinition.handleAction(state,'p1',{type:'PICK_NUMBER_SUBMIT',round:1,value:2},ctx).ok,false);
    assert.equal(pickNumberDefinition.handleAction(state,'p2',{type:'PICK_NUMBER_SUBMIT',round:1,value:5},context()).ok,false);
    state=pickNumberDefinition.handleAction(state,'p1',{type:'PICK_NUMBER_SUBMIT',round:1,value:5},ctx).state;
    assert.equal(state.scores['p1'],60); assert.equal(state.phase,'REVEAL');
    const next=pickNumberDefinition.handleAction(state,'p1',{type:'PICK_NUMBER_NEXT_ROUND',round:1},context()).state;
    assert.equal(next.solo,null); assert.equal(next.timerEndsAt,0);
  });
  it('reveals without a consolation win after three misses or timeout',()=>{
    const ctx=context([samuel]); const initial=createPickNumberState(ctx); let state=initial;
    for(const value of [1,2,3]) state=pickNumberDefinition.handleAction(state,'p1',{type:'PICK_NUMBER_SUBMIT',round:1,value},ctx).state;
    assert.equal(state.phase,'REVEAL'); assert.equal(state.scores['p1'],0);
    const late=pickNumberDefinition.handleAction(initial,'p1',{type:'PICK_NUMBER_SUBMIT',round:1,value:5},{...ctx,now:20_010}).state;
    assert.equal(late.phase,'REVEAL'); assert.equal(late.scores['p1'],0); assert.equal(late.solo?.attempts.length,0);
    assert.equal(pickNumberDefinition.tick!(late,ctx).state,late);
  });
  it('rejects stale round actions and reveals when a waiting player disconnects', () => {
    const ctx = context(); const state = createPickNumberState(ctx);
    assert.equal(pickNumberDefinition.handleAction(state, 'p1', {type:'PICK_NUMBER_SUBMIT',round:2,value:5},ctx).ok,false);
    const first = pickNumberDefinition.handleAction(state,'p1',{type:'PICK_NUMBER_SUBMIT',round:1,value:5},ctx).state;
    const solo = context([samuel]);
    const reveal = pickNumberDefinition.tick!(first,solo).state;
    assert.equal(reveal.phase,'REVEAL');
    assert.equal(pickNumberDefinition.tick!(reveal,solo).state,reveal);
    const next = pickNumberDefinition.handleAction(reveal,'p1',{type:'PICK_NUMBER_NEXT_ROUND',round:1},solo).state;
    assert.equal(pickNumberDefinition.handleAction(next,'p1',{type:'PICK_NUMBER_SUBMIT',round:1,value:5},solo).ok,false);
  });
  it('reveals a round after all connected players submit', () => {
    let state = createPickNumberState(context());

    const first = pickNumberDefinition.handleAction(
      state,
      'p1',
      { type: 'PICK_NUMBER_SUBMIT', round: state.round, value: 2 },
      context()
    );
    assert.ok(first.ok);
    state = first.state;
    assert.equal(state.phase, 'SUBMISSION');

    const second = pickNumberDefinition.handleAction(
      state,
      'p2',
      { type: 'PICK_NUMBER_SUBMIT', round: state.round, value: 5 },
      context()
    );

    assert.ok(second.ok);
    assert.equal(second.state.phase, 'REVEAL');
    assert.equal(second.state.target, 5);
    assert.equal(second.state.scores['p2'], 8);
  });

  it('rejects duplicate and out-of-range submissions', () => {
    const state = createPickNumberState(context());
    const first = pickNumberDefinition.handleAction(
      state,
      'p1',
      { type: 'PICK_NUMBER_SUBMIT', round: state.round, value: 4 },
      context()
    );

    assert.ok(first.ok);

    const duplicate = pickNumberDefinition.handleAction(
      first.state,
      'p1',
      { type: 'PICK_NUMBER_SUBMIT', round: state.round, value: 6 },
      context()
    );
    const outOfRange = pickNumberDefinition.handleAction(
      state,
      'p2',
      { type: 'PICK_NUMBER_SUBMIT', round: state.round, value: 11 },
      context()
    );

    assertRejected(duplicate);
    assert.equal(duplicate.error.code, 'already_submitted');
    assertRejected(outOfRange);
    assert.equal(outOfRange.error.code, 'number_out_of_range');
  });

  it('requires the host to advance revealed rounds', () => {
    let state = createPickNumberState(context([samuel]));
    const submitted = pickNumberDefinition.handleAction(
      state,
      'p1',
      { type: 'PICK_NUMBER_SUBMIT', round: state.round, value: 5 },
      context([samuel])
    );

    assert.ok(submitted.ok);
    state = submitted.state;

    const rejected = pickNumberDefinition.handleAction(
      state,
      'p2',
      { type: 'PICK_NUMBER_NEXT_ROUND', round: state.round },
      context([samuel, alice])
    );

    assertRejected(rejected);
    assert.equal(rejected.error.code, 'host_only');
  });

  it('finishes after the configured final round', () => {
    let state = createPickNumberState(context([samuel]));

    for (let round = 1; round <= 3; round += 1) {
      const submitted = pickNumberDefinition.handleAction(
        state,
        'p1',
        { type: 'PICK_NUMBER_SUBMIT', round: state.round, value: 5 },
        context([samuel])
      );
      assert.ok(submitted.ok);

      const advanced = pickNumberDefinition.handleAction(
        submitted.state,
        'p1',
        { type: 'PICK_NUMBER_NEXT_ROUND', round: state.round },
        context([samuel])
      );
      assert.ok(advanced.ok);
      state = advanced.state;
    }

    assert.equal(state.phase, 'RESULTS');
    assert.equal(pickNumberDefinition.isFinished(state), true);
  });
});

