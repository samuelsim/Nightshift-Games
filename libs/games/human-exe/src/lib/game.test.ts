import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { GameContext } from '@nightshift/game-core';
import { humanExeDefinition as game } from './definition';
import { extraChallenges } from './scenarios';

function context(count = 2): GameContext {
  return { now: 1000, random: () => .4, hostPlayerId: 'p0', players: new Map(Array.from({length:count}, (_, i) => {
    const id = `p${i}`; return [id, { id, nickname: id, avatarId: 'moon', connected: true, ready: true, host: i === 0, score: 0, joinedAt: 0, lastSeenAt: 0 }];
  })) };
}
describe('Human.exe', () => {
  it('expands scenarios, remaps shuffled answers, and skips recently presented questions', () => {
    const seen=new Set<string>(); const positions=new Set<number>();
    let seed=193;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let run=0;run<50;run++) {
      const ctx={...context(1),random}; const state=game.createInitialState(ctx);
      assert.equal(new Set(state.deck.map(card=>card.question)).size,5);
      for(const card of state.deck) {
        seen.add(card.question);
        const original=extraChallenges.find(item=>item.question===card.question);
        if(original) {
          assert.equal(card.options[card.human],original.options[original.human]);
          assert.equal(card.options[card.machine],original.options[original.machine]);
          positions.add(card.human);
        }
      }
      const recent=state.deck.map(card=>card.question);
      const next=game.createInitialState({...ctx,previousHumanQuestions:recent});
      assert.ok(next.deck.every(card=>!recent.includes(card.question)));
    }
    assert.equal(seen.size,40); assert.equal(positions.size,4);
  });
  it('times out solo rounds, excludes late answers, and rejects duplicate pairs',()=>{
    const ctx=context(1); const state=game.createInitialState(ctx); const card=state.deck[0]!;
    assert.equal(game.getPublicView(state,ctx).timerEndsAt,16_000);
    assert.equal(game.getPublicView(state,ctx).soloResult,null);
    assert.equal(game.handleAction(state,'p0',{type:'HUMAN_SOLO_SUBMIT',round:1,humanChoice:0,machineChoice:0},ctx).ok,false);
    const action={type:'HUMAN_SOLO_SUBMIT',round:1,humanChoice:card.human,machineChoice:card.machine};
    const expired=game.handleAction(state,'p0',action,{...ctx,now:16_000}).state;
    assert.equal(expired.phase,'REVEAL'); assert.equal(expired.scores['p0'],0);
    assert.equal(game.tick!(expired,ctx).state,expired);
    const won=game.handleAction(state,'p0',action,{...ctx,now:6000}).state;
    assert.equal(won.soloResult?.points,300);
    assert.equal(game.handleAction(won,'p0',action,ctx).ok,false);
    const joined=context(2);
    assert.equal(game.handleAction(state,'p1',action,joined).ok,false);
    const next=game.handleAction(won,'p0',{type:'HUMAN_NEXT',round:1},joined).state;
    assert.equal(next.soloPlayerId,null); assert.equal(next.timerEndsAt,0);
  });
  it('keeps directives, answers and choices out of public views before reveal', () => {
    const ctx = context(); const state = game.createInitialState(ctx);
    const first = game.handleAction(state, 'p0', { type: 'HUMAN_CHOOSE', round: 1, choice: 0 }, ctx).state;
    const view = game.getPublicView(first, ctx);
    assert.equal(view.phase, 'CHOICE'); assert.equal(view.result, null);
    assert.equal('roles' in view, false); assert.equal('deck' in view, false);
    assert.equal(game.getPlayerView(first, 'p1', ctx).choice, null);
    assert.equal(game.getPlayerView(first, 'p0', ctx).choice, 0);
  });
  it('rejects invalid choices, duplicate choices, stale rounds and non-host advances', () => {
    const ctx = context(); const state = game.createInitialState(ctx);
    for (const choice of [-1, state.deck[0]!.options.length, 1.5, NaN, '1', null]) assert.equal(game.handleAction(state, 'p0', { type: 'HUMAN_CHOOSE', round: 1, choice }, ctx).ok, false);
    assert.equal(game.handleAction(state, 'p0', { type: 'HUMAN_CHOOSE', round: 2, choice: 0 }, ctx).ok, false);
    assert.equal(game.handleAction(state, 'outside', { type: 'HUMAN_CHOOSE', round: 1, choice: 0 }, ctx).ok, false);
    const first = game.handleAction(state, 'p0', { type: 'HUMAN_CHOOSE', round: 1, choice: 0 }, ctx).state;
    assert.equal(game.handleAction(first, 'p0', { type: 'HUMAN_CHOOSE', round: 1, choice: 1 }, ctx).ok, false);
    const reveal = game.handleAction(first, 'p1', { type: 'HUMAN_CHOOSE', round: 1, choice: 0 }, ctx).state;
    assert.equal(reveal.phase, 'REVEAL');
    assert.equal(game.handleAction(reveal, 'p1', { type: 'HUMAN_NEXT', round: 1 }, ctx).ok, false);
  });
  it('scores both directives and completes five solo rounds', () => {
    for (const random of [() => .1, () => .9]) {
      const ctx = {...context(1), random}; let state = game.createInitialState(ctx);
      for (let round=1; round<=5; round++) {
        const card = state.deck[round - 1]!;

        state = game.handleAction(state, 'p0', {type:'HUMAN_SOLO_SUBMIT',round,humanChoice:card.human,machineChoice:card.machine},ctx).state;
        assert.equal(state.scores['p0'], round * 350);
        state = game.handleAction(state,'p0',{type:'HUMAN_NEXT',round},ctx).state;
      }
      assert.ok(game.isFinished(state));
    }
  });
  it('reveals when a waiting player disconnects without scoring twice', () => {
    const ctx = context(); const first = game.handleAction(game.createInitialState(ctx),'p0',{type:'HUMAN_CHOOSE',round:1,choice:0},ctx).state;
    const left = {...ctx, players: new Map([...ctx.players].filter(([id]) => id === 'p0'))};
    const revealed = game.tick!(first,left).state;
    assert.equal(revealed.phase,'REVEAL'); assert.equal(game.tick!(revealed,left).state,revealed);
  });
  it('lets a late joiner continue when all original participants have left', () => {
    const ctx = context(); const state = game.createInitialState(ctx);
    const late = {...ctx, hostPlayerId:'late', players: new Map([['late',{...ctx.players.get('p0')!,id:'late'}]])};
    assert.equal(game.handleAction(state,'late',{type:'HUMAN_CHOOSE',round:1,choice:0},late).ok,false);
    const revealed = game.tick!(state,late).state;
    assert.equal(revealed.phase,'REVEAL');
    const next = game.handleAction(revealed,'late',{type:'HUMAN_NEXT',round:1},late).state;
    assert.equal(next.phase,'CHOICE'); assert.ok(next.roles['late']);
  });
});
