import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { GameContext } from '@nightshift/game-core';
import { infiltratorDefinition as game, type InfiltratorState } from './infiltrator';
function ctx(count=3,now=1000):GameContext {return {now,random:()=>.4,hostPlayerId:'p0',players:new Map(Array.from({length:count},(_,i)=>{const id=`p${i}`;return [id,{id,nickname:id,avatarId:'moon',connected:true,ready:true,host:i===0,score:0,joinedAt:i,lastSeenAt:now}];}))};}
function answered(state:InfiltratorState,c:GameContext):InfiltratorState {
  for(const id of state.participants) state=game.handleAction(state,id,{type:'INFILTRATOR_RESPOND',round:state.round,text:id===state.machine?`A very ${state.codeWord} biscuit`:`This is fine ${id}`},c).state;
  return state;
}
function voting(state:InfiltratorState,c:GameContext):InfiltratorState {const ready=answered(state,c);return game.tick!(ready,{...c,now:ready.timerEndsAt}).state;}
describe('Human.exe Infiltrator',()=>{
  it('keeps roles, required words, responses, authors and votes private until their reveal boundaries',()=>{
    const c=ctx();let state=game.createInitialState(c);
    assert.equal(game.start(state,ctx(2)).ok,false);
    assert.equal(new Set(state.deck).size,3);
    const publicView=game.getPublicView(state,c);
    assert.equal('machine' in publicView,false);assert.equal('codeWord' in publicView,false);assert.equal('authors' in publicView,false);assert.equal('deck' in publicView,false);
    for(const id of state.participants) assert.equal(game.getPlayerView(state,id,c).codeWord,id===state.machine?state.codeWord:null);
    assert.equal(game.getPlayerView(state,'outsider',c).role,null);
    state=game.handleAction(state,state.machine,{type:'INFILTRATOR_RESPOND',round:1,text:`Try ${state.codeWord} tea`},c).state;
    assert.equal(game.getPublicView(state,c).cards.length,0);assert.equal(game.getPlayerView(state,'outsider',c).response,null);
    for(const id of state.participants.filter(id=>id!==state.machine)) state=game.handleAction(state,id,{type:'INFILTRATOR_RESPOND',round:1,text:'A normal biscuit'},c).state;
    assert.equal(state.phase,'DISCUSSION');assert.equal(state.cards.length,3);
    assert.equal(game.getPublicView(state,c).result,null);
    assert.equal('authors' in game.getPublicView(state,c),false);
    assert.equal(state.cards.every(card=>Object.keys(card).sort().join(',')==='id,text'),true);
  });
  it('validates code words, input bounds, duplicate/stale moves, private ballots and self votes',()=>{
    const c=ctx();const initial=game.createInitialState(c);
    for(const text of ['', 'a', 'x'.repeat(161),`not${initial.codeWord}ish`]) assert.equal(game.handleAction(initial,initial.machine,{type:'INFILTRATOR_RESPOND',round:1,text},c).ok,false);
    assert.equal(game.handleAction(initial,'p0',{type:'INFILTRATOR_RESPOND',round:2,text:'test'},c).ok,false);
    const once=game.handleAction(initial,initial.machine,{type:'INFILTRATOR_RESPOND',round:1,text:`${initial.codeWord.toUpperCase()}!`},c).state;
    assert.equal(game.handleAction(once,initial.machine,{type:'INFILTRATOR_RESPOND',round:1,text:`${initial.codeWord} again`},c).ok,false);
    let state=voting(initial,c);
    const own=game.getPlayerView(state,'p0',c).ownCard!;
    for(const cardId of [own,'bad']) assert.equal(game.handleAction(state,'p0',{type:'INFILTRATOR_VOTE',round:1,cardId},c).ok,false);
    const cardId=state.cards.find(card=>card.id!==own)!.id;
    state=game.handleAction(state,'p0',{type:'INFILTRATOR_VOTE',round:1,cardId},c).state;
    assert.equal(game.getPlayerView(state,'p0',c).vote,cardId);
    assert.equal(game.getPlayerView(state,'p1',c).vote,null);
    assert.equal(game.getPublicView(state,c).result,null);
    assert.equal(game.handleAction(state,'p0',{type:'INFILTRATOR_VOTE',round:1,cardId},c).ok,false);
  });
  it('scores caught machines, rotates roles, and completes three rounds',()=>{
    const c=ctx();let state=game.createInitialState(c);const machines=new Set<string>();
    for(let round=1;round<=3;round++) {
      machines.add(state.machine);state=voting(state,c);
      const machineCard=Object.keys(state.authors).find(card=>state.authors[card]===state.machine)!;
      const otherCard=state.cards.find(card=>card.id!==machineCard)!.id;
      for(const id of state.participants) state=game.handleAction(state,id,{type:'INFILTRATOR_VOTE',round,cardId:id===state.machine?otherCard:machineCard},c).state;
      assert.equal(state.phase,'REVEAL');assert.equal(state.result!.accused,state.machine);
      assert.equal(state.result!.points[state.machine],0);
      assert.equal(game.handleAction(state,'p1',{type:'INFILTRATOR_NEXT',round},c).ok,false);
      state=game.handleAction(state,'p0',{type:'INFILTRATOR_NEXT',round},c).state;
    }
    assert.equal(machines.size,3);assert.equal(state.phase,'RESULTS');assert.deepEqual(Object.values(state.scores),[200,200,200]);
  });
  it('awards an escape on a tied vote but voids no-vote or insufficient-response rounds',()=>{
    const c=ctx();const initial=game.createInitialState(c);let state=voting(initial,c);
    for(let i=0;i<state.participants.length;i++) {
      const id=state.participants[i]!,target=state.participants[(i+1)%3]!;
      const cardId=Object.keys(state.authors).find(card=>state.authors[card]===target)!;
      state=game.handleAction(state,id,{type:'INFILTRATOR_VOTE',round:1,cardId},c).state;
    }
    assert.equal(state.result!.accused,null);assert.equal(state.result!.points[state.machine],200);
    const emptyVote=voting(initial,c);
    assert.equal(game.tick!(emptyVote,{...c,now:emptyVote.timerEndsAt}).state.result!.voided,true);
    const empty=game.tick!(initial,{...c,now:initial.timerEndsAt}).state;
    assert.equal(empty.result!.voided,true);assert.deepEqual(empty.scores,{});
  });
  it('voids permanent machine loss or too few connections, preserves temporary seats, and excludes late joins',()=>{
    const c=ctx(4);const initial=game.createInitialState(c);
    const dropped=new Map(c.players);dropped.set(initial.machine,{...dropped.get(initial.machine)!,connected:false});
    assert.equal(game.tick!(initial,{...c,players:dropped}).state.phase,'SUBMISSION');
    dropped.delete(initial.machine);
    assert.equal(game.tick!(initial,{...c,players:dropped}).state.result!.voided,true);
    const three=ctx();const state=game.createInitialState(three);const fewer=new Map(three.players);fewer.set('p0',{...fewer.get('p0')!,connected:false});
    assert.equal(game.tick!(state,{...three,players:fewer}).state.result!.voided,true);
    assert.equal(game.handleAction(state,'p3',{type:'INFILTRATOR_RESPOND',round:1,text:'Late hello'},c).ok,false);
  });
  it('does not carry expired inputs into the next phase',()=>{
    const c=ctx();const state=game.createInitialState(c);
    const late=game.handleAction(state,state.machine,{type:'INFILTRATOR_RESPOND',round:1,text:`Very ${state.codeWord}`},{...c,now:state.timerEndsAt}).state;
    assert.equal(late.phase,'REVEAL');assert.deepEqual(late.responses,{});
  });
});
