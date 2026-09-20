import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { GameContext } from '@nightshift/game-core';
import type { Player } from '@nightshift/protocol';
import { estimateDefinition as game, scoreEstimate } from './estimate.definition';
import { createPrompts } from './estimate.prompts';
import { factDeck, createFactPrompts } from './estimate.facts';
import { dailyIdentity, dailyRandom } from './estimate.daily';
import { earthDeck, wildlifeDeck } from './estimate.topics';
import { questionKey } from './estimate.selection';

function context(count = 2): GameContext {
  const players: Player[] = Array.from({ length: count }, (_, i) => ({
    id: `p${i}`, nickname: `Player ${i}`, avatarId: 'moon', connected: true, ready: true,
    host: i === 0, score: 0, joinedAt: i, lastSeenAt: 0
  }));
  return { players: new Map(players.map((p) => [p.id, p])), now: 0, hostPlayerId: 'p0', random: () => .4 };
}

describe('Estimate', () => {
  it('plays six Mixed Trivia games before repeating any fact at a fixed difficulty', () => {
    assert.equal(new Set([...factDeck,...earthDeck,...wildlifeDeck].map(card=>card.id)).size,90);
    for(const difficulty of ['easy','standard','hard'] as const) {
      const previous:string[]=[];
      for(let run=0;run<6;run++) {
        const state=game.createInitialState({...context(1),estimateOptions:{deck:'mixed',difficulty},previousEstimateQuestions:previous});
        assert.ok(state.prompts.every(card=>!previous.includes(card.question)));
        previous.push(...state.prompts.map(card=>card.question));
      }
      assert.equal(new Set(previous).size,30);
    }
  });
  it('avoids the previous regular hand in every deck and tier, including generated template repeats', () => {
    for(const deck of ['generated','facts','earth','wildlife','mixed'] as const) for(const difficulty of ['easy','standard','hard'] as const) {
      let previous:string[]=[];
      let lastHand:string[]=[];
      const visited=new Set<string>();
      for(let run=0;run<8;run++) {
        const state=game.createInitialState({...context(1),estimateOptions:{deck,difficulty},previousEstimateQuestions:previous});
        const keys=state.prompts.map(card=>questionKey(card.question));
        assert.equal(new Set(keys).size,5);
        assert.ok(keys.every(key=>!lastHand.includes(key)),`${deck}/${difficulty} repeated the last hand`);
        keys.forEach(key=>visited.add(key));
        previous.push(...state.prompts.map(card=>card.question)); lastHand=keys;
      }
      assert.ok(visited.size>=10);
    }
  });
  it('provides complete, sourced Earth and Wildlife tiers with reveal-only answers', () => {
    for (const [deck,cards] of [['earth',earthDeck],['wildlife',wildlifeDeck]] as const) {
      assert.equal(cards.length,30);
      assert.equal(new Set(cards.map(card=>card.id)).size,30);
      for (const difficulty of ['easy','standard','hard'] as const) {
        assert.equal(cards.filter(card=>card.difficulty===difficulty).length,10);
        const ctx={...context(1),estimateOptions:{deck,difficulty}};
        const state=game.createInitialState(ctx);
        assert.equal(new Set(state.prompts.map(card=>card.question)).size,5);
        for(const card of state.prompts) {
          assert.ok(card.answer>0 && card.answer<=1e9 && Number.isFinite(card.answer));
          assert.ok(card.convention);
          assert.ok(['oceanservice.noaa.gov','science.nasa.gov','nationalzoo.si.edu'].includes(new URL(card.source!.url).hostname));
        }
        const hidden=game.getPublicView(state,ctx);
        assert.equal(hidden.deck,deck);
        assert.equal('answer' in hidden.prompt,false); assert.equal('source' in hidden.prompt,false);
        const revealed=game.handleAction(state,'p0',{type:'ESTIMATE_SUBMIT',round:1,value:state.prompts[0]!.answer},ctx).state;
        assert.equal(revealed.scores['p0'],1000);
        assert.deepEqual(game.getPublicView(revealed,ctx).latestResult!.prompt.source,state.prompts[0]!.source);
      }
    }
  });
  it('uses UTC daily identity and identical versioned sets across rooms and player counts', () => {
    const now=Date.parse('2026-09-15T00:00:00Z');
    assert.equal(dailyIdentity(now-1),'v4:2026-09-14');
    assert.equal(dailyIdentity(now),'v4:2026-09-15');
    assert.equal(dailyIdentity(now+86_399_999),'v4:2026-09-15');
    assert.equal(dailyIdentity(now+86_400_000),'v4:2026-09-16');
    for(const deck of ['facts','generated','earth','wildlife','mixed'] as const) for(const difficulty of ['easy','standard','hard'] as const) {
      const options={daily:true,deck,difficulty};
      const a=game.createInitialState({...context(1),now,estimateOptions:options,random:()=>{throw new Error('Daily content must not use room randomness');}});
      const b=game.createInitialState({...context(3),now:now+86_399_999,estimateOptions:options,random:()=>.99,previousEstimateQuestions:a.prompts.map(card=>card.question)});
      assert.deepEqual(a.prompts,b.prompts); assert.equal(a.dailyId,b.dailyId);
      assert.equal(new Set(a.prompts.map(p=>p.question)).size,5);
      const c=game.createInitialState({...context(1),now:now+86_400_000,estimateOptions:options});
      assert.notDeepEqual(c.prompts,a.prompts);
      assert.equal(game.getPublicView(a,context()).dailyId,'v4:2026-09-15');
      assert.equal('prompts' in game.getPublicView(a,context()),false);
    }
    assert.notEqual(dailyRandom('v1:2026-09-15','facts','easy')(),dailyRandom('v4:2026-09-15','facts','easy')());
  });
  it('keeps an in-progress daily set through midnight and records a zero-point completed daily run', () => {
    const now=Date.parse('2026-09-15T23:59:59Z');
    const ctx={...context(1),now,estimateOptions:{daily:true,deck:'generated' as const,difficulty:'standard' as const}};
    let state=game.createInitialState(ctx);
    const original=state.prompts;
    for(let round=1;round<=5;round++) {
      state=game.tick!(state,{...ctx,now:state.timerEndsAt}).state;
      assert.equal(state.phase,'REVEAL'); assert.equal(state.scores['p0'],0);
      state=game.handleAction(state,'p0',{type:'ESTIMATE_NEXT_ROUND',round},{...ctx,now:now+round*20_000}).state;
      assert.equal(state.dailyId,'v4:2026-09-15'); assert.equal(state.prompts,original);
    }
    assert.equal(state.phase,'RESULTS');
    const regular=game.createInitialState({...ctx,estimateOptions:{...ctx.estimateOptions,daily:false}});
    assert.equal(regular.dailyId,''); assert.deepEqual(regular.scores,{});
  });
  it('serves reviewed, unique factual questions in each tier and hides sources until reveal', () => {
    assert.equal(new Set(factDeck.map(card => card.id)).size, factDeck.length);
    for (const difficulty of ['easy','standard','hard'] as const) {
      const ctx = {...context(1),estimateOptions:{deck:'facts' as const,difficulty}};
      const state = game.createInitialState(ctx);
      assert.equal(state.prompts.length,5);
      assert.equal(new Set(state.prompts.map(card => card.question)).size,5);
      assert.ok(createFactPrompts(ctx.random,difficulty).every(card => factDeck.some(fact => fact.question === card.question && fact.difficulty === difficulty)));
      const publicView = game.getPublicView(state,ctx);
      assert.equal(publicView.deck,'facts'); assert.equal(publicView.difficulty,difficulty);
      assert.equal('source' in publicView.prompt,false); assert.equal('answer' in publicView.prompt,false);
      assert.equal(publicView.latestResult,null); assert.deepEqual(publicView.history,[]);
      assert.equal(game.getPlayerView(state,'p0',ctx).submittedValue,null);
      assert.equal(state.timerEndsAt,30_000);
      for (const card of state.prompts) {
        assert.ok(Number.isFinite(card.answer) && card.answer > 0 && card.answer <= 1e9);
        assert.ok(card.source?.url.startsWith('https://science.nasa.gov/'));
        assert.ok(['2026-09-15','2026-09-19'].includes(card.source!.reviewedAt)); assert.ok(card.convention);
      }
      const revealed = game.handleAction(state,'p0',{type:'ESTIMATE_SUBMIT',round:1,value:state.prompts[0]!.answer},ctx).state;
      assert.equal(revealed.scores['p0'],1000);
      assert.deepEqual(game.getPublicView(revealed,ctx).latestResult!.prompt.source,state.prompts[0]!.source);
      const next = game.handleAction(revealed,'p0',{type:'ESTIMATE_NEXT_ROUND',round:1},{...ctx,estimateOptions:{deck:'generated',difficulty:'easy'}}).state;
      assert.equal(next.deck,'facts'); assert.equal(next.difficulty,difficulty);
      assert.equal(next.timerEndsAt,30_000);
    }
  });
  it('keeps generated difficulty decks distinct and preserves the default quantities mode', () => {
    const ctx=context();
    const base=game.createInitialState(ctx);
    assert.equal(base.deck,'generated'); assert.equal(base.difficulty,'standard');
    const easy=createPrompts(ctx.random,'easy'), hard=createPrompts(ctx.random,'hard');
    assert.equal(easy.length,5); assert.equal(hard.length,5);
    assert.equal(new Set([...easy,...hard,...base.prompts].map(card=>card.question)).size,15);
    for(const prompt of [...easy,...hard]) assert.ok(prompt.answer>0 && !prompt.source);
  });
  it('expires empty rounds, clears the timer, and starts a fresh deadline each round', () => {
    const ctx = context();
    const state = {...game.createInitialState(ctx), streaks:{p0:2}};
    assert.equal(game.getPublicView(state,ctx).timerEndsAt,30_000);
    assert.equal(game.tick!(state,{...ctx,now:29_999}).state,state);
    const expired = game.tick!(state,{...ctx,now:30_000}).state;
    assert.equal(expired.phase,'REVEAL');
    assert.equal(expired.timerEndsAt,0);
    assert.deepEqual(expired.history[0]!.guesses,[]);
    assert.deepEqual(expired.history[0]!.winners,[]);
    assert.equal(expired.streaks['p0'],0);
    assert.equal(game.tick!(expired,{...ctx,now:31_000}).state,expired);
    const next = game.handleAction(expired,'p0',{type:'ESTIMATE_NEXT_ROUND',round:1},{...ctx,now:40_000}).state;
    assert.equal(next.timerEndsAt,70_000);
  });
  it('scores submitted guesses at expiry and excludes answers arriving at the deadline', () => {
    const ctx = context();
    const initial = game.createInitialState(ctx);
    const first = game.handleAction(initial,'p0',{type:'ESTIMATE_SUBMIT',round:1,value:initial.prompts[0]!.answer},{...ctx,now:29_999}).state;
    const late = game.handleAction(first,'p1',{type:'ESTIMATE_SUBMIT',round:1,value:initial.prompts[0]!.answer},{...ctx,now:30_000}).state;
    assert.equal(late.phase,'REVEAL');
    assert.equal(late.scores['p0'],1000);
    assert.equal(late.submissions['p1'],undefined);
    assert.equal(late.history[0]!.guesses.length,1);
  });
  it('scores exact, close, distant and symmetric guesses', () => {
    assert.equal(scoreEstimate(100, 100).basePoints, 1000);
    assert.equal(scoreEstimate(90, 100).basePoints, 900);
    assert.equal(scoreEstimate(110, 100).basePoints, 900);
    assert.equal(scoreEstimate(0, 100).basePoints, 0);
    assert.equal(scoreEstimate(1000, 100).basePoints, 0);
  });
  it('generates five distinct templates with variable positive answers', () => {
    const low = createPrompts(() => 0);
    const high = createPrompts(() => .999);
    assert.equal(new Set(low.map((p) => p.question)).size, 5);
    assert.ok(low.every((p) => p.answer > 0 && Number.isInteger(p.answer)));
    assert.notDeepEqual(low, high);
  });
  it('keeps the answer and other guesses private until both players submit, then awards ties', () => {
    const ctx = context();
    const initial = game.createInitialState(ctx);
    const answer = initial.prompts[0]!.answer;
    const first = game.handleAction(initial, 'p0', { type: 'ESTIMATE_SUBMIT', round: 1, value: answer }, ctx);
    assert.ok(first.ok);
    assert.equal(first.state.phase, 'SUBMISSION');
    const publicView = game.getPublicView(first.state, ctx);
    assert.deepEqual(Object.keys(publicView.prompt).sort(), ['question', 'unit']);
    assert.equal(publicView.latestResult, null);
    assert.deepEqual(publicView.history, []);
    assert.equal('submissions' in publicView, false);
    assert.equal(game.getPlayerView(first.state, 'p1', ctx).submittedValue, null);
    assert.equal(game.getPlayerView(first.state, 'p0', ctx).submittedValue, answer);
    const second = game.handleAction(first.state, 'p1', { type: 'ESTIMATE_SUBMIT', round: 1, value: answer }, ctx);
    assert.ok(second.ok);
    assert.equal(second.state.phase, 'REVEAL');
    assert.deepEqual(second.state.history[0]!.winners, ['p0', 'p1']);
    assert.equal(second.state.scores['p0'], 1000);
    assert.deepEqual(initial.submissions, {});
  });
  it('rejects malformed, duplicate, stale, foreign and unauthorized actions without changing state', () => {
    const ctx = context();
    const state = game.createInitialState(ctx);
    for (const value of [NaN, Infinity, -1, 1_000_000_001, '42', null, undefined]) {
      const result = game.handleAction(state, 'p0', { type: 'ESTIMATE_SUBMIT', round: 1, value }, ctx);
      assert.equal(result.ok, false);
      assert.equal(result.state, state);
    }
    assert.equal(game.handleAction(state, 'outsider', { type: 'ESTIMATE_SUBMIT', round: 1, value: 1 }, ctx).ok, false);
    assert.equal(game.handleAction(state, 'p0', { type: 'ESTIMATE_SUBMIT', round: 2, value: 1 }, ctx).ok, false);
    assert.equal(game.handleAction(state, 'p0', { type: 'PICK_NUMBER_SUBMIT', round: 1, value: 1 }, ctx).ok, false);
    assert.equal(game.handleAction(state, 'p0', { type: 'ESTIMATE_NEXT_ROUND', round: 1 }, ctx).ok, false);
    const first = game.handleAction(state, 'p0', { type: 'ESTIMATE_SUBMIT', round: 1, value: 1 }, ctx).state;
    assert.equal(game.handleAction(first, 'p0', { type: 'ESTIMATE_SUBMIT', round: 1, value: 2 }, ctx).ok, false);
    const revealed = game.handleAction(first, 'p1', { type: 'ESTIMATE_SUBMIT', round: 1, value: 1 }, ctx).state;
    assert.equal(game.handleAction(revealed, 'p1', { type: 'ESTIMATE_NEXT_ROUND', round: 1 }, ctx).ok, false);
  });
  it('plays five solo rounds, caps streak bonus, and rejects moves after finishing', () => {
    const ctx = context(1);
    let state = game.start(game.createInitialState(ctx), ctx).state;
    for (let round = 1; round <= 5; round++) {
      const submit = game.handleAction(state, 'p0', { type: 'ESTIMATE_SUBMIT', round, value: state.prompts[round - 1]!.answer }, ctx);
      assert.ok(submit.ok);
      assert.equal(submit.state.phase, 'REVEAL');
      const advance = game.handleAction(submit.state, 'p0', { type: 'ESTIMATE_NEXT_ROUND', round }, ctx);
      assert.ok(advance.ok);
      state = advance.state;
    }
    assert.equal(game.isFinished(state), true);
    assert.equal(state.scores['p0'], 5900);
    assert.equal(state.history.length, 5);
    assert.equal(game.handleAction(state, 'p0', { type: 'ESTIMATE_SUBMIT', round: 5, value: 1 }, ctx).ok, false);
    assert.equal(game.handleAction(state, 'p0', { type: 'ESTIMATE_NEXT_ROUND', round: 5 }, ctx).ok, false);
  });
  it('resets a streak after an inaccurate round', () => {
    const ctx = context(1);
    let state = game.createInitialState(ctx);
    state = game.handleAction(state, 'p0', { type: 'ESTIMATE_SUBMIT', round: 1, value: state.prompts[0]!.answer }, ctx).state;
    state = game.handleAction(state, 'p0', { type: 'ESTIMATE_NEXT_ROUND', round: 1 }, ctx).state;
    state = game.handleAction(state, 'p0', { type: 'ESTIMATE_SUBMIT', round: 2, value: 0 }, ctx).state;
    assert.equal(state.streaks['p0'], 0);
  });
  it('reveals on tick when the outstanding player disconnects, without scoring twice', () => {
    const ctx = context();
    const state = game.handleAction(game.createInitialState(ctx), 'p0', { type: 'ESTIMATE_SUBMIT', round: 1, value: 1 }, ctx).state;
    const disconnected = { ...ctx, players: new Map([...ctx.players].map(([id, p]) => [id, { ...p, connected: id === 'p0' }])) };
    assert.equal(game.tick!(state, ctx).state, state);
    const revealed = game.tick!(state, disconnected).state;
    assert.equal(revealed.phase, 'REVEAL');
    assert.equal(game.tick!(revealed, disconnected).state, revealed);
    assert.equal(game.tick!(game.createInitialState(ctx), disconnected).state.phase, 'SUBMISSION');
  });
});
