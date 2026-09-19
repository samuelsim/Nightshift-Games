import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { GameContext } from '@nightshift/game-core';
import { oneOfUsDefinition as game, type OneOfUsState } from './definition';
import { wordCards } from './content';

function context(count = 3, now = 1000): GameContext {
  return { now, random: () => .4, hostPlayerId: 'p0', players: new Map(Array.from({ length: count }, (_, i) => {
    const id = `p${i}`; return [id, { id, nickname: id, avatarId: 'moon', connected: true, ready: true, host: i === 0, score: 0, joinedAt: i, lastSeenAt: now }];
  })) };
}
function discussion(state: OneOfUsState, ctx: GameContext): OneOfUsState {
  for (const id of state.participants) state = game.handleAction(state,id,{type:'LYING_CLUE',round:state.round,text:'very unusual'},ctx).state;
  assert.equal(state.phase,'DISCUSSION'); return state;
}
function voting(state: OneOfUsState, ctx: GameContext): OneOfUsState {
  const discussed = discussion(state,ctx);
  return game.tick!(discussed,{...ctx,now:discussed.timerEndsAt}).state;
}
describe('One of Us Is Lying', () => {
  it('has thirty cards, conceals the word from the bluffer and hides all roles publicly', () => {
    const ctx = context(); const state = game.createInitialState(ctx);
    assert.equal(wordCards.length,30); assert.equal(new Set(state.deck.map(c=>c.word)).size,3);
    assert.equal(game.start(state,context(2)).ok,false);
    const view = game.getPublicView(state,ctx);
    assert.equal('bluffer' in view,false); assert.equal('deck' in view,false); assert.equal(view.result,null);
    for (const id of state.participants) assert.equal(game.getPlayerView(state,id,ctx).word, id === state.bluffer ? null : state.deck[0]!.word);
    assert.equal(game.getPlayerView(state,'late',ctx).role,null);
  });
  it('publishes clues simultaneously and validates clue shape and answer leakage', () => {
    const ctx = context(); let state = game.createInitialState(ctx);
    for (const text of [state.deck[0]!.word,'one two three four','<script>','']) {
      assert.equal(game.handleAction(state,'p0',{type:'LYING_CLUE',round:1,text},ctx).ok,false);
    }
    state = game.handleAction(state,'p0',{type:'LYING_CLUE',round:1,text:'very unusual'},ctx).state;
    assert.deepEqual(game.getPublicView(state,ctx).clues,{});
    assert.equal(game.getPlayerView(state,'p0',ctx).clue,'very unusual');
    assert.equal(game.getPlayerView(state,'p1',ctx).clue,null);
    assert.equal(game.handleAction(state,'p0',{type:'LYING_CLUE',round:1,text:'again'},ctx).ok,false);
    for (const id of ['p1','p2']) state = game.handleAction(state,id,{type:'LYING_CLUE',round:1,text:'quite interesting'},ctx).state;
    assert.equal(Object.keys(game.getPublicView(state,ctx).clues).length,3);
  });
  it('limits discussion messages and enforces deadlines without accepting late intentions', () => {
    const ctx = context(); let state = discussion(game.createInitialState(ctx),ctx);
    for (let i=0;i<4;i++) {
      const result = game.handleAction(state,'p0',{type:'LYING_DISCUSS',round:1,text:'What do you think?'},{...ctx,now:ctx.now+i*1000});
      assert.ok(result.ok); state=result.state;
      assert.equal(game.handleAction(state,'p0',{type:'LYING_DISCUSS',round:1,text:'Again'},{...ctx,now:ctx.now+i*1000}).ok,false);
    }
    assert.equal(game.handleAction(state,'p0',{type:'LYING_DISCUSS',round:1,text:'Fifth'},{...ctx,now:ctx.now+5000}).ok,false);
    const expired=game.handleAction(state,'p1',{type:'LYING_DISCUSS',round:1,text:'Late'},{...ctx,now:state.timerEndsAt});
    assert.equal(expired.state.phase,'VOTING'); assert.equal(expired.state.discussion.length,4);
    const noVotes=game.tick!(expired.state,{...ctx,now:expired.state.timerEndsAt}).state;
    assert.equal(noVotes.result?.accused,null); assert.equal(noVotes.scores[state.bluffer],200);
  });
  it('keeps ballots private, prevents self/outsider/double votes and scores a caught bluffer', () => {
    const ctx=context(); let state=voting(game.createInitialState(ctx),ctx); const voteCtx={...ctx,now:state.timerEndsAt-1000};
    const informed=state.participants.filter(id=>id!==state.bluffer);
    assert.equal(game.handleAction(state,'p0',{type:'LYING_VOTE',round:1,targetPlayerId:'p0'},voteCtx).ok,false);
    assert.equal(game.handleAction(state,'p0',{type:'LYING_VOTE',round:1,targetPlayerId:'outside'},voteCtx).ok,false);
    state=game.handleAction(state,informed[0]!,{type:'LYING_VOTE',round:1,targetPlayerId:state.bluffer},voteCtx).state;
    assert.equal(game.getPublicView(state,voteCtx).result,null); assert.equal('votes' in game.getPublicView(state,voteCtx),false);
    assert.equal(game.getPlayerView(state,informed[1]!,voteCtx).vote,null);
    assert.equal(game.handleAction(state,informed[0]!,{type:'LYING_VOTE',round:1,targetPlayerId:state.bluffer},voteCtx).ok,false);
    state=game.handleAction(state,informed[1]!,{type:'LYING_VOTE',round:1,targetPlayerId:state.bluffer},voteCtx).state;
    state=game.handleAction(state,state.bluffer,{type:'LYING_VOTE',round:1,targetPlayerId:informed[0]!},voteCtx).state;
    assert.equal(state.result?.accused,state.bluffer); assert.equal(state.scores[informed[0]!],100); assert.equal(state.scores[informed[1]!],100);
    assert.equal(state.scores[state.bluffer]??0,0); assert.equal(game.tick!(state,voteCtx).state,state);
  });
  it('resolves a voting tie without an accusation', () => {
    const ctx=context(); let state=voting(game.createInitialState(ctx),ctx); const now=state.timerEndsAt-1;
    for (let i=0;i<3;i++) state=game.handleAction(state,`p${i}`,{type:'LYING_VOTE',round:1,targetPlayerId:`p${(i+1)%3}`},{...ctx,now}).state;
    assert.equal(state.result?.accused,null); assert.equal(state.scores[state.bluffer],200);
  });
  it('rotates the bluffer without repeats, completes three rounds and rejects stale actions', () => {
    const ctx=context(); let state=game.createInitialState(ctx); const seen=new Set<string>();
    for (let round=1;round<=3;round++) {
      seen.add(state.bluffer);
      assert.equal(game.handleAction(state,'p0',{type:'LYING_CLUE',round:9,text:'wrong'},ctx).ok,false);
      state=game.tick!(state,{...ctx,now:state.timerEndsAt+50000}).state;
      assert.equal(state.phase,'REVEAL');
      assert.equal(game.handleAction(state,'p1',{type:'LYING_NEXT',round},ctx).ok,false);
      state=game.handleAction(state,'p0',{type:'LYING_NEXT',round},ctx).state;
    }
    assert.equal(seen.size,3); assert.ok(game.isFinished(state));
  });
  it('voids on departure, permits a temporary drop with three others, and excludes late joiners', () => {
    const ctx=context(4); const state=game.createInitialState(ctx);
    const temporary={...ctx,players:new Map([...ctx.players].map(([id,p])=>[id,{...p,connected:id!==state.bluffer}]))};
    assert.equal(game.tick!(state,temporary).state,state);
    const permanent={...ctx,players:new Map([...ctx.players].filter(([id])=>id!==state.bluffer))};
    const voided=game.tick!(state,permanent).state;
    assert.equal(voided.result?.voided,true); assert.deepEqual(voided.scores,{});
    assert.equal(game.tick!(game.createInitialState(context()),context(2)).state.result?.voided,true);
    assert.equal(game.handleAction(state,'p4',{type:'LYING_CLUE',round:1,text:'late'},context(5)).ok,false);
    const restored=game.getPlayerView(state,state.bluffer,ctx);
    assert.equal(restored.role,'BLUFFER'); assert.equal(restored.word,null);
  });
});
