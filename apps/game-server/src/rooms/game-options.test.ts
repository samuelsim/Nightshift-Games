import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { GameContext } from '@nightshift/game-core';
import { gameRegistry, getGameDefinition } from '@nightshift/games-registry';
import { defaultGameOptions, effectiveGameOptions, validGameOptionsPatch, type PlayerAction } from '@nightshift/protocol';
import { humanExeDefinition } from '../../../../libs/games/human-exe/src/lib/definition';
import { estimateDefinition } from '../../../../libs/games/estimate/src/lib/estimate.definition';
import { freshHand } from '@nightshift/game-core';

test('fresh hands prefer unseen cards and oldest replays without duplicates',()=>{
  assert.deepEqual(new Set(freshHand(['a','b','c','d'],x=>x,['a','b','c'],2,()=>.4)),new Set(['d','a']));
  assert.deepEqual(new Set(freshHand(['a','b','c'],x=>x,['b','a','c'],2,()=>.4)),new Set(['b','a']));
});

for(const id of ['majority-rules','one-of-us','restricted-clues','human-exe','human-infiltrator']) test(`${id} supplies thirty different cards across replays without leaking history`,()=>{
  const game=getGameDefinition(id)!;
  const history:string[]=[];
  for(let run=0;run<3;run++) {
    const ctx={...context(10),previousContent:history};
    const state=game.createInitialState(ctx) as Record<string,unknown>;
    for(let round=1;round<=10;round++) {
      const current={...state,round}; const key=game.replayKey!(current);
      assert.ok(key); assert.equal(history.includes(key),false,`${id} repeated ${key}`); history.push(key);
      const view=game.getPublicView(current,ctx) as Record<string,unknown>;
      assert.equal('previousContent' in view,false); assert.equal('deck' in view,false);
      if(id==='one-of-us' || id==='restricted-clues') assert.equal(JSON.stringify(view).includes(JSON.stringify(key)),false,'secret word leaked');
    }
  }
});

const context = (rounds: number): GameContext => ({ now: 1000, random: () => .42, hostPlayerId: 'p0', gameOptions: { rounds },
  players: new Map(Array.from({length:3}, (_, i) => [`p${i}`, {id:`p${i}`, nickname:`Player ${i}`, avatarId:'moon', connected:true, ready:true, host:i===0, score:0, joinedAt:0, lastSeenAt:1000}])) });
const next: Record<string,string> = {estimate:'ESTIMATE_NEXT_ROUND', 'pick-number':'PICK_NUMBER_NEXT_ROUND', 'human-exe':'HUMAN_NEXT', 'human-infiltrator':'INFILTRATOR_NEXT', 'majority-rules':'MAJORITY_NEXT', 'one-of-us':'LYING_NEXT', 'restricted-clues':'CLUES_NEXT'};

for (const id of Object.keys(gameRegistry)) for (const rounds of [1,10]) test(`${id} completes exactly ${rounds} configured rounds`, () => {
  const game = getGameDefinition(id)!; let ctx = context(rounds); let state = game.createInitialState(ctx);
  const view = () => game.getPublicView(state,ctx) as {phase:string;round:number;maxRounds:number;timerEndsAt:number};
  for (let round=1; round<=rounds; round++) {
    assert.equal(view().round,round); assert.equal(view().maxRounds,rounds); assert.equal(game.isFinished(state),false);
    if (id==='pick-number' || id==='human-exe') for (const player of ctx.players.keys()) {
      const action = id==='pick-number' ? {type:'PICK_NUMBER_SUBMIT',round,value:5} : {type:'HUMAN_CHOOSE',round,choice:0};
      state=game.handleAction(state,player,action as PlayerAction,ctx).state;
    }
    for (let phase=0; view().phase!=='REVEAL' && phase<5; phase++) {
      ctx={...ctx,now:view().timerEndsAt+1}; state=game.tick!(state,ctx).state;
    }
    assert.equal(view().phase,'REVEAL');
    const result=game.handleAction(state,'p0',{type:next[id],round} as PlayerAction,ctx);
    assert.equal(result.ok,true); state=result.state;
  }
  assert.equal(game.isFinished(state),true);
});

test('settings reject unknown fields, invalid types and out-of-range values', () => {
  for (const id of Object.keys(gameRegistry)) {
    assert.equal(validGameOptionsPatch(id,defaultGameOptions(id)),true);
    for (const patch of [{rounds:0},{rounds:11},{rounds:1.5},{rounds:'5'},{unknown:1},{}]) assert.equal(validGameOptionsPatch(id,patch),false);
  }
  assert.equal(validGameOptionsPatch('toString',{rounds:5}),false);
  assert.equal(effectiveGameOptions('estimate',{daily:true,rounds:10})['rounds'],5);
});

test('Human.exe easy removes only decoys and preserves correct scoring', () => {
  for (const solo of [false,true]) {
    let ctx=context(10); if(solo) ctx={...ctx,players:new Map([['p0',ctx.players.get('p0')!]])};
    const standard=humanExeDefinition.createInitialState(ctx);
    ctx={...ctx,gameOptions:{rounds:10,difficulty:'easy'}};
    let state=humanExeDefinition.createInitialState(ctx);
    assert.equal(state.deck.length,10);
    for(const card of state.deck) {
      const original=standard.deck.find(item=>item.question===card.question)!;
      assert.equal(card.options.length,2);
      assert.equal(card.options[card.human],original.options[original.human]);
      assert.equal(card.options[card.machine],original.options[original.machine]);
    }
    const card=state.deck[0]!;
    if(solo) {
      state=humanExeDefinition.handleAction(state,'p0',{type:'HUMAN_SOLO_SUBMIT',round:1,humanChoice:card.human,machineChoice:card.machine},ctx).state;
      assert.equal(state.soloResult?.correctCount,2);
    } else for(const id of ctx.players.keys()) state=humanExeDefinition.handleAction(state,id,{type:'HUMAN_CHOOSE',round:1,choice:state.roles[id]==='HUMAN'?card.human:card.machine},ctx).state;
    assert.equal(state.phase,'REVEAL'); assert.ok(Object.values(state.scores).every(score=>score>0));
  }
});

test('every Estimate deck and tier supports ten unique questions; daily stays at five', () => {
  for(const deck of ['generated','mixed','facts','earth','wildlife'] as const) for(const difficulty of ['easy','standard','hard'] as const) {
    const ctx={...context(10),estimateOptions:{deck,difficulty,daily:false}};
    const state=estimateDefinition.createInitialState(ctx);
    assert.equal(state.prompts.length,10); assert.equal(new Set(state.prompts.map(p=>p.question)).size,10);
    const daily=estimateDefinition.createInitialState({...ctx,estimateOptions:{deck,difficulty,daily:true}});
    assert.equal(daily.prompts.length,5);
  }
});
